import { NextRequest, NextResponse } from "next/server"
import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { buildResumeViewModel } from "@/lib/typst/view-model"

const FONTS_DIR = join(process.cwd(), "lib", "typst", "themes", "fonts")
const FONT_EXT = /\.(ttf|otf)$/i

type TypstCompiler = {
  pdf: (args: {
    mainFileContent: string
    inputs?: Record<string, string>
  }) => Buffer
}

let compiler: TypstCompiler | null = null

const templateCache: Record<string, Promise<string>> = {}

const THEME_FILES: Record<string, string> = {
  "classic":  "jakes-resume.typ",
  "modern":   "modern.typ",
  "two-col":  "two-col.typ",
  "highlight":  "highlight.typ",
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
  return "PDF generation failed"
}

async function getCompiler(): Promise<TypstCompiler> {
  if (!compiler) {
    const { NodeCompiler } = await import("@myriaddreamin/typst-ts-node-compiler")
    const entries = await readdir(FONTS_DIR, { withFileTypes: true })
    const fontFiles = entries
      .filter((e) => e.isFile() && FONT_EXT.test(e.name))
      .map((e) => join(FONTS_DIR, e.name))
    const fontBlobs = await Promise.all(fontFiles.map((p) => readFile(p)))
    compiler = NodeCompiler.create({
      fontArgs: [{ fontBlobs }],
    }) as TypstCompiler
  }
  return compiler
}

async function getTemplate(templateId: string): Promise<string> {
  if (!templateCache[templateId]) {
    const themeFile = THEME_FILES[templateId] ?? DEFAULT_THEME
    const themePath = join(process.cwd(), "lib", "typst", "themes", themeFile)
    const resumePath = join(process.cwd(), "lib", "typst", "json-adapter.typ")
    templateCache[templateId] = Promise.all([
      readFile(themePath, "utf8"),
      readFile(resumePath, "utf8"),
    ]).then(([theme, resume]) => `${theme}\n\n${resume}`)
  }
  return templateCache[templateId]
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const data = isRecord(body) ? body.data : null
    const templateId = isRecord(body) && typeof body.template_id === "string"
      ? body.template_id
      : "classic"

    if (!isRecord(data)) {
      return NextResponse.json(
        { error: "data field is required" },
        { status: 400 }
      )
    }

    const [comp, template] = await Promise.all([getCompiler(), getTemplate(templateId)])
    const vm = buildResumeViewModel(data)

    const pdfBuffer = comp.pdf({
      mainFileContent: template,
      inputs: {
        data: JSON.stringify(vm),
      },
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="resume.pdf"',
      },
    })
  } catch (error) {
    console.error("Typst PDF generation error:", error)
    const message = errorMessage(error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export const dynamic = "force-dynamic"