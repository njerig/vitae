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

/**
 * Gets the Gemini API key from the environment variables.
 * @returns The Gemini API key if it is set, otherwise throws a GeminiConfigurationError.
 */
function getGeminiApiKey(): string {
  const apiKey = process.env[GEMINI_API_KEY_ENV]?.trim()
  if (!apiKey) {
    throw new GeminiConfigurationError()
  }
  return apiKey
}

/**
 * Checks if the Gemini API key is configured.
 * @returns True if the Gemini API key is set, otherwise false.
 */
export function geminiConfigured(): boolean {
  return Boolean(process.env[GEMINI_API_KEY_ENV]?.trim())
}

/**
 * Gets the Gemini model.
 * @param model - The model to use.
 * @returns The Gemini model if it is set, otherwise throws a GeminiConfigurationError.
 */
export function getGeminiModel(model = DEFAULT_GEMINI_MODEL) {
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(getGeminiApiKey())
  }
  return geminiClient.getGenerativeModel({ model })
}

/**
 * Generates text using the Gemini model.
 * @param prompt - The prompt to generate text from.
 * @param options - The options for the generation.
 * @returns The generated text.
 */
export async function generateGeminiText(
  prompt: string,
  options?: { model?: string }
): Promise<string> {
  const model = getGeminiModel(options?.model)
  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}

/**
 * Strips the markdown code fences from the text.
 * @param text - The text to strip the markdown code fences from.
 * @returns The text with the markdown code fences stripped.
 */
export function stripMarkdownCodeFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()
}

/**
 * Parses the Gemini JSON response.
 * @param text - The text to parse the Gemini JSON response from.
 * @returns The parsed Gemini JSON response.
 */
export function parseGeminiJson<T>(text: string): T {
  const cleaned = stripMarkdownCodeFences(text)
  return JSON.parse(cleaned) as T
}

/**
 * Generates JSON using the Gemini model.
 * @param prompt - The prompt to generate JSON from.
 * @param options - The options for the generation.
 * @returns The generated JSON.
 */
export async function generateGeminiJson<T>(
  prompt: string,
  options?: { model?: string }
): Promise<T> {
  const text = await generateGeminiText(prompt, options)
  return parseGeminiJson<T>(text)
}

/**
 * Streams the Gemini text.
 * @param prompt - The prompt to stream the Gemini text from.
 * @param options - The options for the streaming.
 * @returns The streamed Gemini text.
 */
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
