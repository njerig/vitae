# Working State Tests

This directory contains integration and API tests for the "Working State" system, which tracks the user's currently selected resume items.

## Test Files

### `api.test.ts`
Tests the backend implementation of `/api/working-state` routes.
- **GET**: Verifies fetching the current working state for authenticated users.
- **PUT**: Tests creating/updating the working state with a JSON payload.
- **Validation**: Checks for proper UUID validation and ensures `item_type_ids` and `item_ids` belong to the authenticated user.
- **Authorization**: Ensures unauthorized requests return 401.

### `interaction.test.tsx`
Integration tests for the `useWorkingState` hook and frontend interactions.
- **Hook State**: Verifies the hook loads the initial state from the API.
- **Toggle Item**: Tests selecting and deselecting items via checkboxes.
- **Persistence**: Confirms that state changes are persisted to the API via `PUT`.
- **Loading & Error**: Validates loading states and error toasts on failed API calls.
