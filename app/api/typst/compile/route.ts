import { NextRequest, NextResponse } from "next/server"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { buildResumeViewModel } from "@/lib/typst/view-model"

type TypstCompiler = {
  svg: (args: { mainFileContent: string; inputs?: Record<string, string> }) => string
}

let compiler: TypstCompiler | null = null
let templatePromise: Promise<string> | null = null

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null
}

async function getCompiler() {
  if (!compiler) {
    // Dynamic import to avoid build-time issues with native modules
    const { NodeCompiler } = await import("@myriaddreamin/typst-ts-node-compiler")
    compiler = NodeCompiler.create() as TypstCompiler
  }
  return compiler
}

async function getTemplate(): Promise<string> {
  if (!templatePromise) {
    const themePath = join(process.cwd(), "lib", "typst", "theme.typ")
    const resumePath = join(process.cwd(), "lib", "typst", "resume.typ")
    templatePromise = Promise.all([
      readFile(themePath, "utf8"),
      readFile(resumePath, "utf8"),
    ]).then(([theme, resume]) => `${theme}\n\n${resume}`)
  }
  return templatePromise
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const data = isRecord(body) ? body.data : null

    if (!isRecord(data)) {
      return NextResponse.json(
        { error: "data field is required" },
        { status: 400 }
      )
    }

    const [comp, template] = await Promise.all([getCompiler(), getTemplate()])
    const vm = buildResumeViewModel(data)

    const svg = comp.svg({
      mainFileContent: template,
      inputs: {
        data: JSON.stringify(vm),
      },
    })

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
      },
    })
  } catch (error) {
    console.error("Typst compilation error:", error)
    const message = error instanceof Error ? error.message : "Compilation failed"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
