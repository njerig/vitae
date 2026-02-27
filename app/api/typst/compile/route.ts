import { NextRequest, NextResponse } from "next/server"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { buildResumeViewModel } from "@/lib/typst/view-model"

const FONTS_DIR = join(process.cwd(), "lib", "typst", "themes", "fonts")
const FONT_FILES = [
  "Figtree-Regular.ttf",
  "Figtree-Bold.ttf",
  "Figtree-Italic.ttf",
  "Figtree-BoldItalic.ttf",
]

type TypstCompiler = {
  svg: (args: { mainFileContent: string; inputs?: Record<string, string> }) => string
}

let compiler: TypstCompiler | null = null

// Cache each template file independently by template_id
const templateCache: Record<string, Promise<string>> = {}

const THEME_FILES: Record<string, string> = {
  "classic":   "jakes-resume.typ",
  "modern":    "jakes-resume-2.typ",
  // Add more template_ids here as new themes are built
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
    const { NodeCompiler } = await import("@myriaddreamin/typst-ts-node-compiler")
    const fontBlobs = await Promise.all(
      FONT_FILES.map((f) => readFile(join(FONTS_DIR, f)))
    )
    compiler = NodeCompiler.create({
      fontArgs: [{ fontBlobs }],
    }) as TypstCompiler
  }
  return compiler
}

async function getTemplate(): Promise<string> {
  if (!templatePromise) {
    const themePath = join(process.cwd(), "lib", "typst", "themes", "jakes-resume.typ")
    const resumePath = join(process.cwd(), "lib", "typst", "json-adapter.typ")
    templatePromise = Promise.all([
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
    const message = errorMessage(error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'