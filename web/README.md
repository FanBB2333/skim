# skim landing page

A small React + Vite + Tailwind + shadcn-style landing page that explains what
skim does.

```bash
cd web
npm install
npm run dev      # start dev server
npm run build    # produce a static bundle in dist/
npm run preview  # serve the built bundle locally
```

The page is intentionally static — no API calls, no build-time dependency on
the Go binary. Deploy `dist/` to any static host.
