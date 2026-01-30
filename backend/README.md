# Vitae | CSE 115A | Backend

This is an Express backend.

## Getting Started

Firstly, download packages (in `/backend`): `npm install`

Second, set up `.env` with correct credentials and keys

Then, ensure the docker/db is running by doing:
1. `cd /backend/infra/initdb`

2. `docker compose down`

3. `docker compose up -d`

Finally, in `/backend/`, run the development server: `npm run dev`