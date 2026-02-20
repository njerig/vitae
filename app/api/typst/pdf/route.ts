import { NextRequest, NextResponse } from "next/server"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { buildResumeViewModel } from "@/lib/typst/view-model"

type TypstCompiler = {
  pdf: (args: {
    mainFileContent: string
    inputs?: Record<string, string>
  }) => Buffer
}

let compiler: TypstCompiler | null = null
let templatePromise: Promise<string> | null = null

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
