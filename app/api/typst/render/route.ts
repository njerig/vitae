import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { NextRequest, NextResponse } from "next/server"

type TypstCompiler = {
  vector: (args: { mainFileContent: string; inputs?: Record<string, string> }) => Buffer
  pdf: (
    args: { mainFileContent: string; inputs?: Record<string, string> },
    opts?: { pdfStandard?: string; pdfTags?: boolean; creationTimestamp?: number }
  ) => Buffer
  mapShadow: (path: string, content: Buffer) => void
  resetShadow: () => void
}

type AssetInput = {
  path: string
  contentBase64: string
}

type RenderRequestBody = {
  source?: unknown
  inputs?: unknown
  assets?: unknown
}

const VECTOR_EXT = ".vector"
const PDF_EXT = ".pdf"
const DEFAULT_FONT_BUNDLE_VERSION = "default"

let compiler: TypstCompiler | null = null
let compilerVersionPromise: Promise<string> | null = null

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null
}

function isStringRecord(v: unknown): v is Record<string, string> {
  if (!isRecord(v)) return false
  return Object.values(v).every((value) => typeof value === "string")
}

function parseAssets(v: unknown): AssetInput[] {
  if (v === undefined) return []
  if (!Array.isArray(v)) {
    throw new Error("assets must be an array")
  }
  const parsed: AssetInput[] = []
  for (const item of v) {
    if (!isRecord(item)) throw new Error("assets must contain objects")
    const path = item.path
    const contentBase64 = item.contentBase64
    if (typeof path !== "string" || path.trim() === "") {
      throw new Error("asset path must be a non-empty string")
    }
    if (typeof contentBase64 !== "string" || contentBase64.trim() === "") {
      throw new Error("asset contentBase64 must be a non-empty string")
    }
    parsed.push({ path, contentBase64 })
  }
  return parsed
}

async function getCompiler(): Promise<TypstCompiler> {
  if (!compiler) {
    const { NodeCompiler } = await import("@myriaddreamin/typst-ts-node-compiler")
    compiler = NodeCompiler.create() as TypstCompiler
  }
  return compiler
}

async function getCompilerVersion(): Promise<string> {
  if (!compilerVersionPromise) {
    const pkgPath = join(
      process.cwd(),
      "node_modules",
      "@myriaddreamin",
      "typst-ts-node-compiler",
      "package.json"
    )
    compilerVersionPromise = readFile(pkgPath, "utf8")
      .then((text) => {
        const parsed: unknown = JSON.parse(text)
        if (
          isRecord(parsed) &&
          typeof parsed.version === "string" &&
          parsed.version.trim() !== ""
        ) {
          return parsed.version
        }
        return "unknown"
      })
      .catch(() => "unknown")
  }
  return compilerVersionPromise
}

function normalizedInputs(inputs: Record<string, string>): string {
  const pairs = Object.entries(inputs).sort(([a], [b]) => a.localeCompare(b))
  return JSON.stringify(Object.fromEntries(pairs))
}

function normalizedAssets(assets: AssetInput[]): string {
  const normalized = assets
    .map((asset) => ({
      path: asset.path,
      // hash asset contents instead of embedding full content in the id payload
      contentHash: createHash("sha256").update(asset.contentBase64).digest("hex"),
    }))
    .sort((a, b) => a.path.localeCompare(b.path))
  return JSON.stringify(normalized)
}

function buildDocId(args: {
  source: string
  inputs: Record<string, string>
  assets: AssetInput[]
  compilerVersion: string
  fontBundleVersion: string
}): string {
  return createHash("sha256")
    .update(args.source)
    .update("\n")
    .update(normalizedInputs(args.inputs))
    .update("\n")
    .update(normalizedAssets(args.assets))
    .update("\n")
    .update(args.compilerVersion)
    .update("\n")
    .update(args.fontBundleVersion)
    .digest("hex")
}

function artifactUrls(docId: string) {
  return {
    vectorUrl: `/api/typst/artifacts/${docId}${VECTOR_EXT}`,
    pdfUrl: `/api/typst/artifacts/${docId}${PDF_EXT}`,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    if (!isRecord(body)) {
      return NextResponse.json({ error: "request body must be an object" }, { status: 400 })
    }

    const parsed = body as RenderRequestBody
    const source = parsed.source
    const inputs = parsed.inputs ?? {}

    if (typeof source !== "string" || source.trim() === "") {
      return NextResponse.json({ error: "source must be a non-empty string" }, { status: 400 })
    }
    if (!isStringRecord(inputs)) {
      return NextResponse.json(
        { error: "inputs must be an object of string key/value pairs" },
        { status: 400 }
      )
    }

    const assets = parseAssets(parsed.assets)
    const [comp, compilerVersion] = await Promise.all([getCompiler(), getCompilerVersion()])
    const fontBundleVersion = process.env.TYPST_FONT_BUNDLE_VERSION ?? DEFAULT_FONT_BUNDLE_VERSION

    const docId = buildDocId({
      source,
      inputs,
      assets,
      compilerVersion,
      fontBundleVersion,
    })

    const urls = artifactUrls(docId)

    comp.resetShadow()
    try {
      for (const asset of assets) {
        const bytes = Buffer.from(asset.contentBase64, "base64")
        comp.mapShadow(asset.path, bytes)
      }

      const compileArgs = { mainFileContent: source, inputs }
      await Promise.all([
        Promise.resolve(comp.vector(compileArgs)),
        Promise.resolve(comp.pdf(compileArgs)),
      ])
    } finally {
      comp.resetShadow()
    }

    return NextResponse.json({ docId, ...urls })
  } catch (error) {
    console.error("Typst render route error:", error)
    const message = error instanceof Error && error.message ? error.message : "Render failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
