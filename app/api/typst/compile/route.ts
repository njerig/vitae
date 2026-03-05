import { mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { NextRequest, NextResponse } from "next/server"
import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { buildResumeViewModel } from "@/lib/typst/view-model"

const FONTS_DIR = join(process.cwd(), "lib", "typst", "themes", "fonts")
const FONT_EXT = /\.(ttf|otf)$/i

// Workspace dir for Typst: compiler resolves relative paths (e.g. read("resume-data.json")) from here.
// Using a short path avoids "File name too long" when passing large JSON via sys.inputs.
const TMP_WORKSPACE = join(tmpdir(), `vitae-${process.pid}`)

type TypstCompiler = {
  svg: (args: { mainFileContent: string; inputs?: Record<string, string> }) => string
}

let compiler: TypstCompiler | null = null

// Cache each template file independently by template_id
const templateCache: Record<string, Promise<string>> = {}

const THEME_FILES: Record<string, string> = {
  classic: "jakes-resume.typ",
  modern: "modern.typ",
  "two-col": "two-col.typ",
  highlight: "highlight.typ",
  gradient: "gradient.typ",
}

const DEFAULT_THEME = "jakes-resume.typ"

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null
}

function errorMessage(error: unknown): string {
  if (isRecord(error) && typeof error.code === "string" && error.code.trim() !== "") {
    return error.code
  }
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message
  }
  return "Compilation failed"
}

async function getCompiler() {
  if (!compiler) {
    mkdirSync(TMP_WORKSPACE, { recursive: true })
    const { NodeCompiler } = await import("@myriaddreamin/typst-ts-node-compiler")
    const entries = await readdir(FONTS_DIR, { withFileTypes: true })
    const fontFiles = entries
      .filter((e) => e.isFile() && FONT_EXT.test(e.name))
      .map((e) => join(FONTS_DIR, e.name))
    const fontBlobs = await Promise.all(fontFiles.map((p) => readFile(p)))
    compiler = NodeCompiler.create({
      workspace: TMP_WORKSPACE,
      fontArgs: [{ fontBlobs }],
    }) as TypstCompiler
  }
  return compiler
}

async function getTemplate(templateId: string): Promise<string> {
  if (!templateCache[templateId]) {
    const themeFile = THEME_FILES[templateId] ?? DEFAULT_THEME
    const themePath = join(process.cwd(), "lib", "typst", "themes", themeFile)
    const adapterPath = join(process.cwd(), "lib", "typst", "json-adapter.typ")
    templateCache[templateId] = Promise.all([
      readFile(themePath, "utf8"),
      readFile(adapterPath, "utf8"),
    ]).then(([theme, adapter]) => `${theme}\n\n${adapter}`)
  }
  return templateCache[templateId]
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const data = isRecord(body) ? body.data : null
    const templateId =
      isRecord(body) && typeof body.template_id === "string" ? body.template_id : "classic"

    if (!isRecord(data)) {
      return NextResponse.json({ error: "data field is required" }, { status: 400 })
    }

    const [comp, template] = await Promise.all([getCompiler(), getTemplate(templateId)])
    const vm = buildResumeViewModel(data)

    // Write JSON to workspace file so sys.inputs can pass a short path (avoids "File name too long").
    const dataPath = join(TMP_WORKSPACE, "resume-data.json")
    writeFileSync(dataPath, JSON.stringify(vm), "utf-8")

    const svg = comp.svg({
      mainFileContent: template,
      inputs: {
        data: "resume-data.json",
      },
    })

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
      },
    })
  } catch (error) {
    console.error("Typst compilation error:", error)
    const message = errorMessage(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
