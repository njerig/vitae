// lib/utils.ts
// Shared utility functions

/**
 * Formats a date string to a localized format with date and time
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "02/16/2026, 10:30 AM")
 */
export const formatDateTime = (dateString: string): string => {
  if (!dateString) return ""
  try {
    return new Date(dateString).toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}


/**
 * Formats a date string to a localized format with date and time
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "02/16/2026")
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return ""
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}