# Style Guide

This document outlines the coding style and documentation conventions for the project.

## Code Conventions

- **TypeScript:** Follow strict TypeScript styles and syntax for all type-checking.
- **Global Types:** Type definitions for database items should live in `/lib/shared/types.ts`.
- **Local Types:** Component-local types or interfaces should live within their respective component files.
- **Separation of Concerns:** There should be minimal state and network logic within `/app/<feature>`. Refactor and modularize complex logic into the corresponding `/lib/<feature>` directory.

## Documentation & Comments

- **API Functions:** Use [JSDoc](https://jsdoc.app/about-getting-started) comments for all API-related functions (i.e., functions inside `/lib/*/api.ts` or `/api/*/route.ts`).
- **Standard Functions:** For general functions and inline code logic, use concise 1-2 line `//` comments.
- **React Components:** For significant structural sections in React components, use `{/* <Component Description> */}` block comments to improve readability and code organization.
