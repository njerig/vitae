// backend/schemas.js
// Centralized Zod v4 validation schemas

const { z } = require("zod")

// Helper for date validation
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (use YYYY-MM-DD)")

const optionalDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (use YYYY-MM-DD)")
  .nullable()
  .optional()
  .or(z.literal(""))

// ─────────────────────────────────────────────────────────────
// Content Schemas (per item type, matching docs/schema.md)
// ─────────────────────────────────────────────────────────────

const WorkContentSchema = z
  .object({
    org: z.string().min(1, "Company is required"),
    role: z.string().min(1, "Position is required"),
    start: dateString.refine((v) => v && v.length > 0, "Start date is required"),
    end: optionalDateString,
    bullets: z.array(z.string()).min(1, "At least one bullet point is required"),
    skills: z.array(z.string()).optional(),
  })
  .refine((data) => !data.start || !data.end || data.start <= data.end, {
    message: "Start date must be before or equal to end date",
  })

const EducationContentSchema = z
  .object({
    institution: z.string().min(1, "Institution is required"),
    degree: z.string().optional().or(z.literal("")),
    field: z.string().optional().or(z.literal("")),
    start: optionalDateString,
    end: optionalDateString,
    gpa: z.string().optional().or(z.literal("")),
    bullets: z.array(z.string()).optional(),
  })
  .refine((data) => !data.start || !data.end || data.start <= data.end, {
    message: "Start date must be before or equal to end date",
  })

const ProjectContentSchema = z
  .object({
    title: z.string().min(1, "Project Name is required"),
    description: z.string().optional().or(z.literal("")),
    url: z.string().optional().or(z.literal("")),
    start: optionalDateString,
    end: optionalDateString,
    bullets: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
  })
  .refine((data) => !data.start || !data.end || data.start <= data.end, {
    message: "Start date must be before or equal to end date",
  })

const SkillContentSchema = z.object({
  category: z.string().min(1, "Category is required"),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
})

const LinkContentSchema = z.object({
  label: z.string().min(1, "Label is required"),
  url: z.string().min(1, "URL is required"),
})

// Generic content schema (accepts any object)
const GenericContentSchema = z.record(z.string(), z.unknown())

// Map item type display names to their content schemas
const CONTENT_SCHEMAS = {
  "Work Experience": WorkContentSchema,
  "Education": EducationContentSchema,
  "Project": ProjectContentSchema,
  "Skill": SkillContentSchema,
  "Link": LinkContentSchema,
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


// Working State Schema

const SectionStateSchema = z.object({
  item_type_id: z.uuid("item_type_id must be a valid UUID"),
  item_ids: z.array(z.uuid("item_ids must contain valid UUIDs")),
})

const WorkingStateSchema = z.object({
  sections: z.array(SectionStateSchema),
})


// Query Param Schemas

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

  // Working state schemas
  SectionStateSchema,
  WorkingStateSchema,

  // Query schemas
  IdQuerySchema,
  ItemTypeQuerySchema,
}
