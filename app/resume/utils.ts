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
