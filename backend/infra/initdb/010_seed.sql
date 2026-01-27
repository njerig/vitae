-- Optional seed data for local demos (safe to delete)
-- Seeds: one demo user, one oauth mapping, a few canonical items, a draft, and a version.

-- Demo user
INSERT INTO users (id, email, full_name, phone_number, location)
VALUES (
  gen_random_uuid(),
  'demo@vitae.local',
  'Demo User',
  '+1 (555) 010-0000',
  'Santa Clara, CA'
)
ON CONFLICT (email) DO NOTHING;

-- Demo oauth mapping (fake provider_user_id)
INSERT INTO oauth_accounts (user_id, provider, provider_user_id)
SELECT id, 'google', 'demo-google-sub'
FROM users
WHERE email = 'demo@vitae.local'
ON CONFLICT (provider, provider_user_id) DO NOTHING;

-- Canonical items
-- Education
INSERT INTO canon_items (user_id, item_type, title, position, content)
SELECT id, 'education', 'UC Santa Cruz', 0,
  jsonb_build_object(
    'school','UC Santa Cruz',
    'degree','B.S.',
    'major','Computer Science',
    'start','2022-09',
    'end','2026-06',
    'gpa','3.7'
  )
FROM users
WHERE email='demo@vitae.local';

-- Work
INSERT INTO canon_items (user_id, item_type, title, position, content)
SELECT id, 'work', 'Example Corp', 0,
  jsonb_build_object(
    'org','Example Corp',
    'role','Software Engineer',
    'location','Palo Alto, CA',
    'start','2024-06',
    'end',null,
    'is_current',true,
    'bullets', jsonb_build_array(
      'Automated build + release workflows to reduce manual steps.',
      'Improved reliability of deployment pipelines with validation checks.'
    )
  )
FROM users
WHERE email='demo@vitae.local';

-- Skills (one item as a list)
INSERT INTO canon_items (user_id, item_type, title, position, content)
SELECT id, 'skill', 'Skills', 0,
  jsonb_build_object(
    'category','Core',
    'items', jsonb_build_array('TypeScript','React','Node.js','Postgres')
  )
FROM users
WHERE email='demo@vitae.local';

-- Draft (working_state) - placeholder structure for demo
INSERT INTO working_state (user_id, state)
SELECT id,
  jsonb_build_object(
    'sections', jsonb_build_array(
      jsonb_build_object('type','education','item_ids', jsonb_build_array()),
      jsonb_build_object('type','work','item_ids', jsonb_build_array())
    ),
    'note','This is placeholder draft JSON for demo.'
  )
FROM users
WHERE email='demo@vitae.local'
ON CONFLICT (user_id) DO NOTHING;

-- Version snapshot (simple copy of draft for demo)
INSERT INTO versions (user_id, name, snapshot)
SELECT ws.user_id, 'Demo Version v1', ws.state
FROM working_state ws
JOIN users u ON u.id = ws.user_id
WHERE u.email='demo@vitae.local';
