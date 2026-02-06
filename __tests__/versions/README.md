# Versions Tests

This directory contains tests for the Save Resume feature, which allows users to save their current working state as a named resume version.

## Test Files

### `SaveResumeButton.test.tsx`

Tests the `SaveResumeButton` and `SaveResumeModal` components that handle saving resume versions.

**What these tests cover:**

#### 1. **Button Rendering & State** (Tests 1-4)
- Button displays "Save Resume" text with icon
- Button is **disabled** when working state is empty (no sections)
- Button is **disabled** when sections exist but have no items
- Button is **enabled** when working state has selected items

#### 2. **Modal Behavior** (Tests 5-6)
- Clicking button opens the modal with title "Save Resume Version"
- Clicking "Cancel" button closes the modal
- Clicking outside modal (on overlay) closes it

#### 3. **Form Submission & API** (Test 7)
- Entering a resume name and clicking "Save" calls `POST /api/versions`
- Request body contains `{ name: "Resume Name" }`
- Correct headers are sent (`Content-Type: application/json`)

#### 4. **Success Flow** (Tests 8, 12)
- Success toast appears with message: `Resume "{name}" saved successfully!`
- Modal automatically closes after successful save
- Working state remains unchanged (not cleared)

#### 5. **Error Handling** (Test 9)
- Network/API failures show error toast
- Error message: "Failed to save resume. Please try again."
- Modal stays open on error so user can retry

#### 6. **Form Validation** (Test 10)
- Empty resume name shows validation error
- Error message: "Resume name is required"
- Form doesn't submit with invalid data
- API is not called when validation fails

#### 7. **Loading States** (Test 11)
- Save button shows "Saving..." text during submission
- Form inputs are disabled while saving
- Prevents double-submission

## Running These Tests

```bash
# Run all tests in this directory
npm test -- __tests__/versions

# Run only SaveResumeButton tests
npm test -- SaveResumeButton.test.tsx

# Run tests in watch mode
npm run test:watch -- SaveResumeButton.test.tsx
```
