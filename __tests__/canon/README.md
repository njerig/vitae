# Canon Tests

This directory contains tests for canon item behavior across both API client logic and user interaction flows.

## Test Files

### `api.test.ts`

Tests the canon API client in `lib/canon/api.ts`.

**What these tests cover:**

#### 1. **Successful Requests**
- `listItemTypes()` returns parsed item types
- `listCanonItems(itemTypeId)` sends the correct query param
- `createCanonItem(payload)` sends correct POST body and headers

#### 2. **HTTP Error Handling (non-Zod)**
- 500, 401, 404, and fallback status-text errors throw as `Error`
- `toast.error(...)` is shown for non-validation server errors

#### 3. **Zod Validation Errors**
- 400 responses with `issues` throw `ValidationError`
- Validation errors do **not** trigger `toast.error(...)`
- Field paths are extracted into `ValidationError.fields`
- Error message formatting includes readable field context

#### 4. **Network Failures**
- Rejected `fetch` calls propagate as thrown errors

### `interaction.test.tsx`

Integration-style tests for canon form/list flow using real `useCanon`, `CanonForm`, and `CanonList` with mocked API responses.

**What these tests cover:**

#### 1. **Item Type Switching**
- Clicking add/open form allows switching item type
- Default item types render different forms:
  - Work Experience
  - Education
  - Project
  - Skill
  - Link

#### 2. **Inline Zod Error UX**
- Submitting invalid input returns validation errors
- Error message is rendered in-form
- Invalid inputs show inline error styling (`border-red-500`)

#### 3. **Per-Type Add Flow**
- Each default item type can be filled and submitted successfully
- Created items are rendered in `CanonList` with expected type-specific text

### `list-bullets.test.tsx`

Focused rendering coverage for `CanonList` bullet behavior.

**What these tests cover:**

#### 1. **Cross-Type Bullet Rendering**
- If an item has `content.bullets`, bullet lines render in the card UI
- Coverage includes Work, Education, Project, Skill, Link, and Misc/custom types

## Running These Tests

```bash
# Run all tests in this directory
npm test -- __tests__/canon

# Run only API tests
npm test -- __tests__/canon/api.test.ts

# Run only interaction tests
npm test -- __tests__/canon/interaction.test.tsx

# Run list bullet rendering tests
npm test -- __tests__/canon/list-bullets.test.tsx

# Run in watch mode
npm run test:watch -- __tests__/canon
```
