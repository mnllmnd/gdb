Render deployment checklist (step-by-step)

This guide walks you through deploying the repo to Render using the dual-service approach (frontend static + backend web service).

Prerequisites
- A Render account and permission to create services
- A PostgreSQL database accessible from Render (you can use Render's managed DB or another provider)

1) Import the repo to Render
- Login to Render and click "New +" → "Web Service" (or use the Import from Git button and point to this repository)
- Alternatively, use the `render.yaml` by creating a new "Web Service from YAML" and provide this repository and branch. The manifest defines two services and a job.

2) Configure the backend service (marketplace-backend)
- If creating manually:
  - Environment: Node
  - Root directory: server
  - Build command: npm install
  - Start command: npm start
- Set these Environment Variables in the Render dashboard (for the backend):
  - DATABASE_URL = postgresql://<user>:<password>@<host>:<port>/<db>
  - JWT_SECRET = <a long random secret>
  - Cloudinary_API_Key (if using uploads)
  - Cloudinary_API_Secret (if using uploads)
  - Cloudinary_Cloud_Name (if using uploads)
  - NODE_ENV = production
- Advanced: Set a health check path `/` or `/api/health` if available.

3) Configure the frontend site (marketplace-frontend)
- If creating manually:
  - Type: Static Site
  - Root: repository root
  - Build Command: npm install && npm run build
  - Publish Directory: dist
- Review `vite.config.ts` if you customized `build.outDir`.

4) Run migrations
- Use the `run-migrations` job added to `render.yaml`, or run migrations locally.
- To run as job in Render, navigate to the Jobs section and run the job `run-migrations` (it will execute `npm install` and `npm run migrate` in the `server/` folder).

5) Deploy & verify
- Deploy backend and frontend via Render UI (or let the manifest handle it)
- Verify logs for any database connection errors (common issue: malformed DATABASE_URL)
- Test endpoints:
  - https://<your-backend>.onrender.com/ → should show { ok: true }
  - https://<your-backend>.onrender.com/api/shops/search?q=test → should return JSON
  - Frontend site URL should show the React app

6) Post-deploy tasks
- Configure backups for the database if using Render-managed Postgres
- Optionally add deploy hooks to run `run-migrations` automatically when the backend service deploys

7) Troubleshooting hints
- If you see `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`, ensure your `DATABASE_URL` is an exact string without surrounding quotes. The backend already trims and validates the value.
- Inspect server logs in Render for stack traces.

If you want, I can:
- Add a small Express static middleware to `server/src/index.js` so a single service can serve both frontend and backend (monolithic option).
- Add a GitHub Action or Render deploy hook to run migrations automatically before backend deploys.
