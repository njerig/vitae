// backend/middleware.js
// Reusable Express middleware for auth and validation

const { getAuth } = require("@clerk/express")

// ─────────────────────────────────────────────────────────────
// Authentication Middleware
// ─────────────────────────────────────────────────────────────

/**
 * Extracts userId from Clerk auth. Returns 401 if not authenticated.
 * Attaches userId to req.userId for downstream handlers.
 */
function requireAuth(req, res, next) {
  const { userId } = getAuth(req)
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" })
  }
  req.userId = userId
  next()
}

// ─────────────────────────────────────────────────────────────
// Validation Middleware (Zod v4)
// ─────────────────────────────────────────────────────────────

/**
 * Validates req.body against a Zod schema.
 * On success: attaches parsed data to req.validatedBody
 * On failure: returns 400 with validation errors
 */
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {})
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        issues: result.error.issues,
      })
    }
    req.validatedBody = result.data
    next()
  }
}

/**
 * Validates req.query against a Zod schema.
 * On success: attaches parsed data to req.validatedQuery
 * On failure: returns 400 with validation errors
 */
function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query ?? {})
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        issues: result.error.issues,
      })
    }
    req.validatedQuery = result.data
    next()
  }
}

// ─────────────────────────────────────────────────────────────
// Async Handler Wrapper
// ─────────────────────────────────────────────────────────────

/**
 * Wraps async route handlers to properly catch and forward errors.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// ─────────────────────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────────────────────

/**
 * Express error handler middleware. Place at the end of the middleware chain.
 */
function errorHandler(err, req, res, _next) {
  console.error("[Error]", err)
  res.status(500).json({ error: "Server error" })
}

// ─────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────

module.exports = {
  requireAuth,
  validateBody,
  validateQuery,
  asyncHandler,
  errorHandler,
}
