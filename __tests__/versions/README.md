# Versions Tests

This directory contains key tests for the Save Resume feature and the Resume Versions management page.

## Test Files

### `SaveResumeButton.test.tsx`
Tests the `SaveResumeButton` component which handles saving the current working state as a named version.
- **Button Logic**: Verifies enablement based on working state (disabled if empty).
- **Modal Interaction**: Tests opening/closing the "Save Resume" modal.
- **API Submission**: Validates `POST /api/versions` calls with correct payload.
- **Validation**: Checks for empty names and duplicate name errors.

### `versions-page.test.tsx`
Tests the main `/versions` page functionality.
- **Loading & Empty States**: Verifies spinner and "No saved resumes" message.
- **List Display**: Checks that version cards are rendered with correct names and formatted dates.
- **Delete Flow**: Tests the delete button, confirmation dialog, and optimistic UI updates upon successful deletion.
- **Error Handling**: validation of toast notifications on API failures.

### `restore.test.tsx`
Tests the version restore functionality.
- **Restore UI**: Verifies the "Restore" button on version cards.
- **Confirmation Modal**: Checks that the modal appears with the correct warning message and version name.
- **Restore Logic**: Tests the `POST /api/versions/[id]/restore` call.
- **Redirect**: Confirms redirection to `/resume` after successful restore.
- **Error Handling**: Verifies error toasts on network or API failures.
