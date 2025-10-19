Quick Render deployment guide

This repo contains a frontend (Vite + React) at the project root and a backend (Express) in the `server/` folder.

Quick checklist before deploying

1. Set environment variables in Render for the backend service (`marketplace-backend`):
   - `DATABASE_URL` (postgres connection string)
   - `JWT_SECRET` (secret for tokens)
   - `Cloudinary_API_Key`, `Cloudinary_API_Secret`, `Cloudinary_Cloud_Name` (if you use Cloudinary uploads)
   - `PORT` (Render sets it automatically, but it's safe to set 4000)

2. Ensure your `server/package.json` scripts are correct. The default `start` runs `node --experimental-specifier-resolution=node src/index.js`.

3. If you need to run migrations first, use the `server/migrate.js` script locally or add a Render Job.

How Render manifest is set up

- `render.yaml` contains two services:
  - `marketplace-backend` (web service) pointing to `server/` — it will run `npm install` then `npm start`.
  - `marketplace-frontend` (static site) at project root — it will run `npm install && npm run build` and publish `dist`.

Notes

- Render sets the `PORT` env var for web services. The backend uses `process.env.PORT` in `server/src/index.js`.
- The frontend `dist` directory is Vite's build output. If your `vite.config.ts` outputs to another folder, update `publishPath`.

Optional: single repo monorepo approach

If you prefer the frontend and backend to be in the same web service (Node process serving both), you'd need to implement an Express static middleware to serve the frontend build from `server/public` and change the `render.yaml` accordingly.

If you want, I can:
- Add a small `server/src/static.js` to serve the built frontend and adjust the backend to serve static files (single process deploy).
- Add a `Procfile` alternative or a Render Job to run DB migrations before start.

Tell me which option you prefer and I will make the changes.
