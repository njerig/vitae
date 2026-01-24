-- Optional seed data for local demos
-- Safe to delete if you don't want any seeded rows.

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

-- Demo oauth mapping 
INSERT INTO oauth_accounts (user_id, provider, provider_user_id)
SELECT id, 'google', 'demo-google-sub'
FROM users
WHERE email = 'demo@vitae.local'
ON CONFLICT (provider, provider_user_id) DO NOTHING;

-- Demo experience + bullets
WITH u AS (
  SELECT id AS user_id FROM users WHERE email = 'demo@vitae.local'
),
e AS (
  INSERT INTO experiences (user_id, title, org, org_location, start_date, end_date, is_current, summary)
  SELECT u.user_id, 'Software Engineer', 'Example Corp', 'Palo Alto, CA', '2024-06-01', NULL, true,
         'Built internal tools to speed up release automation.'
  FROM u
  RETURNING id
)
INSERT INTO experience_bullets (experience_id, bullet_text, position)
SELECT e.id, 'Automated build + release workflows to reduce manual steps.', 0 FROM e
UNION ALL
SELECT e.id, 'Improved reliability of deployment pipelines with validation checks.', 1 FROM e;
