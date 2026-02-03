// backend/schemas.js
// Centralized Zod v4 validation schemas

const { z } = require("zod")

// ─────────────────────────────────────────────────────────────
// Content Schemas (per item type, matching docs/schema.md)
// ─────────────────────────────────────────────────────────────

const WorkContentSchema = z.object({
  org: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Position is required"),
  start: z.string().min(1, "Start date is required"),
  end: z.string().nullable().optional(),
  bullets: z.array(z.string()).min(1, "At least one bullet point is required"),
  skills: z.array(z.string()).optional(),
}).refine(
  (data) => !data.start || !data.end || data.start <= data.end,
  { message: "Start date must be before or equal to end date" }
)

const EducationContentSchema = z.object({
  institution: z.string().optional(),
  degree: z.string().optional(),
  field: z.string().optional(),
  start: z.string().optional(),
  end: z.string().nullable().optional(),
  gpa: z.string().optional(),
  bullets: z.array(z.string()).optional(),
}).refine(
  (data) => !data.start || !data.end || data.start <= data.end,
  { message: "Start date must be before or equal to end date" }
)

const ProjectContentSchema = z.object({
  description: z.string().optional(),
  url: z.string().optional(),
  start: z.string().optional(),
  end: z.string().nullable().optional(),
  bullets: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
}).refine(
  (data) => !data.start || !data.end || data.start <= data.end,
  { message: "Start date must be before or equal to end date" }
)

const SkillContentSchema = z.object({
  category: z.string().optional(),
  skills: z.array(z.string()).optional(),
})

const LinkContentSchema = z.object({
  url: z.string(),
  label: z.string().optional(),
})

// Generic content schema (accepts any object)
const GenericContentSchema = z.record(z.string(), z.unknown())

// Map item type display names to their content schemas
const CONTENT_SCHEMAS = {
  "Work Experience": WorkContentSchema,
  "Education": EducationContentSchema,
  "Projects": ProjectContentSchema,
  "Skills": SkillContentSchema,
  "Links": LinkContentSchema,
}

/**
 * Returns the appropriate content schema for a given item type display name.
 * Falls back to GenericContentSchema for custom types.
 */
function getContentSchema(displayName) {
  return CONTENT_SCHEMAS[displayName] || GenericContentSchema
}

// ─────────────────────────────────────────────────────────────
// Request Schemas
// ─────────────────────────────────────────────────────────────

// Item Types
const CreateItemTypeSchema = z.object({
  display_name: z.string().min(1, "display_name is required"),
})

// Canon Items
const CreateCanonItemSchema = z.object({
  item_type_id: z.uuid("item_type_id must be a valid UUID"),
  title: z.string().optional().default(""),
  position: z.number().int().optional().default(0),
  content: GenericContentSchema.optional().default({}),
})

const PatchCanonItemSchema = z
  .object({
    title: z.string().optional(),
    position: z.number().int().optional(),
    content: GenericContentSchema.optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "No fields to patch",
  })

// ─────────────────────────────────────────────────────────────
// Query Param Schemas
// ─────────────────────────────────────────────────────────────

const IdQuerySchema = z.object({
  id: z.uuid("id must be a valid UUID"),
})

const ItemTypeQuerySchema = z.object({
  item_type_id: z.uuid().optional(),
})

// ─────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────

module.exports = {
  // Content schemas
  WorkContentSchema,
  EducationContentSchema,
  ProjectContentSchema,
  SkillContentSchema,
  LinkContentSchema,
  GenericContentSchema,
  getContentSchema,

  // Request schemas
  CreateItemTypeSchema,
  CreateCanonItemSchema,
  PatchCanonItemSchema,

  // Query schemas
  IdQuerySchema,
  ItemTypeQuerySchema,
}
