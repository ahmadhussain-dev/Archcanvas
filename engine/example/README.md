# Floorplan Editor Example Application (example)

This directory contains the frontend demo application for `blueprint3d-babylon`, built with Vite and vanilla ES Modules.

---

## 🚀 Quickstart

Run the dev server in the project root:

```bash
npm run dev
```

Then visit:
`http://127.0.0.1:3000/blueprint3d-babylon/example/index.html`

---

## 📂 Architecture Overview

The example application consumes the core library strictly through the public facade API:

```
example/
├── type/                  # JSDoc static type definitions
├── store/                 # Runtime Store singletons (ui, selection, editor)
├── js/                    # UI handlers and event processors (see example/js/README.md)
├── index.html             # HTML layout, menus, sidebars, modals
├── styles.css             # UI styling
└── app.js                 # Application orchestrator & engine setup
```

For detailed architectural details, please refer to **[Refactoring Documentation](../docs/refactor/01_js.md)**.
