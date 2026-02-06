# Database Schema

This document describes the core database tables for Vitae.

---

## Users

Stores user profile and contact information. The `id` is the Clerk user ID.

```sql
CREATE TABLE users (
  id            TEXT PRIMARY KEY,          -- Clerk user id (e.g. "user_abc123")
  email         TEXT UNIQUE,
  full_name     TEXT,
  phone_number  TEXT,
  location      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Item Types

Defines the types/sections a user can organize their resume items into. Each user has their own set of item types.

```sql
CREATE TABLE item_types (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,  -- e.g. "Work Experience", "Education", "Research"
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Default Item Types

On user signup, create these default item_types:

| display_name         |
|----------------------|
| Work Experience      |
| Education            |
| Project              |
| Skill                |
| Link                 |

Users can create custom item_types (e.g., "Research", "Volunteer Work", "Publications") with any `display_name` they choose.

---

## Canon Items

The master record of all resume items. Each item belongs to an item_type.

```sql
CREATE TABLE canon_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type_id  UUID NOT NULL REFERENCES item_types(id) ON DELETE CASCADE,
  title         TEXT NOT NULL DEFAULT '',
  position      INT NOT NULL DEFAULT 0,
  content       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Content Schemas by Item Type

The `content` JSONB field has different schemas depending on the item type:

#### Work Experience

```typescript
type WorkContent = {
  org?: string;
  role?: string;
  start?: string;       // "YYYY-MM-DD"
  end?: string | null;  // null means "Present"
  bullets?: string[];
  skills?: string[];
}
```

#### Education

```typescript
type EducationContent = {
  institution?: string;
  degree?: string;
  field?: string;
  start?: string;
  end?: string | null;
  gpa?: string;
  bullets?: string[];
}
```

#### Project

```typescript
type ProjectContent = {
  description?: string;
  url?: string;
  start?: string;
  end?: string | null;
  bullets?: string[];
  skills?: string[];
}
```

#### Skill

```typescript
type SkillContent = {
  category?: string;    // e.g. "Languages", "Frameworks", "Tools"
  skills?: string[];
}
```

#### Link

```typescript
type LinkContent = {
  url: string;
  label?: string;       // e.g. "LinkedIn", "GitHub", "Portfolio"
}
```

---

## Working State

Stores the current "draft" resume state for each user. One row per user.

```sql
CREATE TABLE working_state (
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  state       JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

See [working-state-design.md](./working-state-design.md) for details on the `state` JSONB structure.

---

## Versions

Named snapshots of saved resumes.

```sql
CREATE TABLE versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  snapshot    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

The `snapshot` field contains a copy of the working state at the time of save.

---

## Entity Relationship

```
users
  ├── item_types (1:N) - user's custom section types
  ├── canon_items (1:N) - user's resume items
  │     └── item_type_id -> item_types.id
  ├── working_state (1:1) - current draft
  └── versions (1:N) - saved snapshots
```
