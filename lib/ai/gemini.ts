import { GoogleGenerativeAI } from "@google/generative-ai"

const GEMINI_API_KEY_ENV = "GEMINI_API_KEY"
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite"

let geminiClient: GoogleGenerativeAI | null = null

export class GeminiConfigurationError extends Error {
  constructor(message = "AI service not configured") {
    super(message)
    this.name = "GeminiConfigurationError"
  }
}

export class GeminiAbortError extends Error {
  constructor(message = "Generation cancelled") {
    super(message)
    this.name = "GeminiAbortError"
  }
}

function getGeminiApiKey(): string {
  const apiKey = process.env[GEMINI_API_KEY_ENV]?.trim()
  if (!apiKey) {
    throw new GeminiConfigurationError()
  }
  return apiKey
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env[GEMINI_API_KEY_ENV]?.trim())
}

export function getGeminiModel(model = DEFAULT_GEMINI_MODEL) {
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(getGeminiApiKey())
  }
  return geminiClient.getGenerativeModel({ model })
}

export async function generateGeminiText(
  prompt: string,
  options?: { model?: string }
): Promise<string> {
  const model = getGeminiModel(options?.model)
  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}

export function stripMarkdownCodeFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()
}

export function parseGeminiJson<T>(text: string): T {
  const cleaned = stripMarkdownCodeFences(text)
  return JSON.parse(cleaned) as T
}

export async function generateGeminiJson<T>(
  prompt: string,
  options?: { model?: string }
): Promise<T> {
  const text = await generateGeminiText(prompt, options)
  return parseGeminiJson<T>(text)
}

export async function* streamGeminiText(
  prompt: string,
  options?: { model?: string; signal?: AbortSignal }
): AsyncGenerator<string, void, unknown> {
  if (options?.signal?.aborted) {
    throw new GeminiAbortError()
  }

  const model = getGeminiModel(options?.model)
  const result = await model.generateContentStream(prompt)

  for await (const chunk of result.stream) {
    if (options?.signal?.aborted) {
      throw new GeminiAbortError()
    }

    const text = chunk.text()
    if (text) {
      yield text
    }
  }
}
