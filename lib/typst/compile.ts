import { Dirent, mkdirSync, writeFileSync } from "node:fs"
import { readFile, readdir } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { randomUUID } from "node:crypto"
import { buildResumeViewModel } from "./view-model"

// -- Constants ----------------------------------------------------------------
const FONTS_DIR = join(process.cwd(), "lib", "typst", "themes", "fonts")
const FONT_EXT = /\.(ttf|otf)$/i
const TMP_WORKSPACE = join(tmpdir(), `vitae-${process.pid}`)
const THEME_FILES: Record<string, string> = {
  classic: "jakes-resume.typ",
  modern: "modern.typ",
  "two-col": "two-col.typ",
  highlight: "highlight.typ",
  gradient: "gradient.typ",
}
const DEFAULT_THEME = THEME_FILES.classic
const TEMPLATE_CACHE: Record<string, Promise<string>> = {}

// -- Types --------------------------------------------------------------------
type CompileFormat = "svg" | "pdf"

type TypstCompiler = {
  svg: (args: { mainFileContent: string; inputs?: Record<string, string> }) => string
  pdf: (args: { mainFileContent: string; inputs?: Record<string, string> }) => Buffer
}

let compiler: TypstCompiler | null = null

// -- Helpers ------------------------------------------------------------------

/**
 * Makes a compiler error message from an unknown error.
 * @param error - The error to make a message from.
 * @returns The compiler error message.
 */
export function makeCompilerErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error &&
    "code" in error &&
    typeof (error as any).code === "string"
  ) {
    return (error as any).code
  }
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message
  }
  return "Compilation failed"
}

// -- Main Functions -----------------------------------------------------------

/**
 * Gets the compiler instance.
 * @returns The compiler instance.
 */
async function getCompiler(): Promise<TypstCompiler> {
  if (!compiler) {
    mkdirSync(TMP_WORKSPACE, { recursive: true })
    const { NodeCompiler } = await import("@myriaddreamin/typst-ts-node-compiler")
    const entries = await readdir(FONTS_DIR, { withFileTypes: true })

    const fontFiles = entries
      .filter((e: Dirent) => e.isFile() && FONT_EXT.test(e.name))
      .map((e: Dirent) => join(FONTS_DIR, e.name))

    const fontBlobs = await Promise.all(fontFiles.map((p) => readFile(p)))
    compiler = NodeCompiler.create({
      workspace: TMP_WORKSPACE,
      fontArgs: [{ fontBlobs }],
    }) as TypstCompiler
  }

  return compiler
}

/**
 * Gets the template for a given template ID.
 * @param templateId - The template ID to get the template for.
 * @returns The template for the given template ID.
 */
async function getTemplate(templateId: string): Promise<string> {
  if (!TEMPLATE_CACHE[templateId]) {
    const themeFile = THEME_FILES[templateId] ?? DEFAULT_THEME
    const themePath = join(process.cwd(), "lib", "typst", "themes", themeFile)
    const adapterPath = join(process.cwd(), "lib", "typst", "json-adapter.typ")
    TEMPLATE_CACHE[templateId] = Promise.all([
      readFile(themePath, "utf8"),
      readFile(adapterPath, "utf8"),
    ]).then(([theme, adapter]: [string, string]) => `${theme}\n\n${adapter}`)
  }
  return TEMPLATE_CACHE[templateId]
}

/**
 * Compiles a resume.
 * @param data - The data to include in the resume.
 * @param templateId - The template ID to use for the resume.
 * @param format - The format to compile the resume to.
 * @returns The compiled resume in the given format.
 */
export function compileResume(args: {
  data: Record<string, unknown>
  templateId?: string
  format: "svg"
}): Promise<string>
export function compileResume(args: {
  data: Record<string, unknown>
  templateId?: string
  format: "pdf"
}): Promise<Uint8Array>
export async function compileResume(args: {
  data: Record<string, unknown>
  templateId?: string
  format: CompileFormat
}): Promise<string | Uint8Array> {
  const templateId = args.templateId ?? "classic"
  const [comp, template] = await Promise.all([getCompiler(), getTemplate(templateId)])
  const vm = buildResumeViewModel(args.data)
  const fileName = `resume-data-${randomUUID()}.json`
  writeFileSync(join(TMP_WORKSPACE, fileName), JSON.stringify(vm), "utf-8")
  if (args.format === "svg") {
    return comp.svg({ mainFileContent: template, inputs: { data: fileName } })
  }
  return new Uint8Array(comp.pdf({ mainFileContent: template, inputs: { data: fileName } }))
}
