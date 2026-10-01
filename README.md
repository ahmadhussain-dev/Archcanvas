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
npm run dev:web                  # website on http://localhost:5173
npm run dev:engine               # engine demo on http://localhost:3000
```

Check the API is up: open http://localhost:4000/api/health.

## Tests and build

```bash
npm test          # API tests and engine tests
npm run build     # production build of the website
```

GitHub Actions runs the same checks on every pull request.

## Build plan

1. Repo setup (this)
2. Database models: users, projects, project versions, material rates
3. Backend: auth, projects, estimate
4. Frontend: landing and auth pages, plot setup, editor, estimate, admin
5. AI assistant and plan check

## Credits

The editor engine in `engine/` comes from the Blueprint3D project (blueprint3d-babylon), released under the MIT License. See `engine/README.md`.
