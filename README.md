# ArchCanvas

Design a house that actually fits your plot. ArchCanvas is a web app for planning homes on Pakistani plots (Marla and Kanal): draw a 2D plan, see it in 3D, check it against real room sizes, and get a grey structure cost estimate in rupees.

Final Year Project, BS IT, NUML Faisalabad. Team: Ahmad Hussain and Ibrahim Azeem. Supervisor: Ms. Sehrish Maqbool.

## What's in this repo

| Folder | What it is |
| --- | --- |
| `web/` | The ArchCanvas website and app. React, Vite, Tailwind CSS, React Router. |
| `api/` | The backend. Node.js, Express, MongoDB (Mongoose). |
| `engine/` | The 2D/3D floor plan editor engine, built on Babylon.js. Based on the Blueprint3D (blueprint3d-babylon) project, MIT licensed. |
| `docs/design/` | The UI guideline and the official logo files. |

## Run it locally

You need Node.js 22 or newer, and MongoDB (a free MongoDB Atlas cluster or a local server).

```bash
npm install                      # installs all three parts
cp api/.env.example api/.env     # then fill in MONGODB_URI and the secrets

npm run dev:api                  # API on http://localhost:4000
npm run dev:editor               # 2D/3D editor on http://localhost:3000/editor/
npm run dev:web                  # website on http://localhost:5173 (open this one)
```

Run all three in separate terminals. The website forwards `/api` to the API and `/editor` to the editor, which opens inside the project page. `npm run dev:engine` still runs the engine's own demo app on its own.

Check the API is up: open http://localhost:4000/api/health.

First-time setup of the database:

```bash
npm run seed -w @archcanvas/api                            # adds the default material prices
npm run make-admin -w @archcanvas/api -- you@example.com   # after signing up, makes you an admin
```

## API

| Route | Who | What |
| --- | --- | --- |
| `POST /api/auth/register`, `/login` | anyone | Start a session. Returns an access token (15 minutes) and sets a refresh cookie (7 days). 5 wrong passwords lock the account for 15 minutes. |
| `POST /api/auth/refresh`, `/logout` | anyone | New access token from the cookie; logout ends the session on every device. |
| `GET /api/auth/me` | logged in | The current user. |
| `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/:id` | owner | Projects with plot size, floors, roof height and requirements. |
| `GET/POST /api/projects/:id/versions`, `GET .../versions/:n`, `POST .../versions/:n/restore` | owner | Saved plans (engine building JSON). Restoring copies an old version forward. |
| `GET /api/projects/:id/estimate` | owner | Grey structure cost for the project. |
| `GET /api/plots/presets`, `GET /api/rates`, `POST /api/estimate` | anyone | Marla presets, current prices and a quick estimate. |
| `GET /api/admin/rates`, `PATCH /api/admin/rates/:id` | admin | Edit and verify material prices. |

Send the access token as `Authorization: Bearer <token>`. The estimate rules of thumb are in `api/src/lib/estimate.js`.

## Tests and build

```bash
npm test          # API tests and engine tests (database tests need MongoDB on localhost, else they are skipped)
npm run build     # production build of the website, with the editor in web/dist/editor
```

GitHub Actions runs the same checks on every pull request.

## Build plan

1. Repo setup
2. Database models: users, projects, project versions, material rates
3. Backend: auth, projects, estimate
4. Frontend: landing and auth pages, plot setup, editor, estimate, admin
5. AI assistant and plan check

## Credits

The editor engine in `engine/` comes from the Blueprint3D project (blueprint3d-babylon), released under the MIT License. See `engine/README.md`.
