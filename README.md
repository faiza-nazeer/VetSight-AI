# VetSight AI: Frontend

React (Vite) web app for **VetSight AI**, the AI-based livestock disease detection and regional risk prediction system (FAST-NUCES Chiniot-Faisalabad FYP).
Backend: FastAPI + MongoDB (separate repo). Languages: **English and Urdu (RTL)**.

It has four role-based areas: **Farmer / Livestock owner**, **Veterinarian**, **Online store** and **Admin**.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

It runs **without a backend** by default (`VITE_USE_MOCK=true`) using built-in demo data stored in the browser's localStorage.
Demo password for every account is `demo1234`:

| Role | Email |
|---|---|
| Farmer | ali@example.com |
| Veterinarian | sana@example.com |
| Online store | vetmeds@example.com |
| Admin | admin@vetsight.com |

On the login page, tap a role button to fill the demo login. New-account OTP in demo mode is shown on screen (`123456`).
To reset the demo data, clear the site's localStorage.

## Connecting the FastAPI backend

1. Copy `.env.example` to `.env`.
2. Set `VITE_USE_MOCK=false` and `VITE_API_BASE_URL=https://your-api-host/api/v1`.
3. Implement the endpoints in **API_CONTRACT.md**. Every call the UI makes is listed there, with the field names matching your MongoDB schema.
4. In FastAPI enable CORS for the frontend origin (allow headers `Authorization`, `Content-Type`; methods `GET, POST, PUT, PATCH, DELETE`):

```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-host"],   # and http://localhost:5173 while developing
    allow_methods=["*"], allow_headers=["*"], allow_credentials=False,
)
```

Auth is a JWT sent as `Authorization: Bearer <token>`. A `401` response logs the user out automatically.
A reverse proxy (see `nginx.conf`) avoids CORS entirely: serve the app and proxy `/api/` to FastAPI.

## Environment variables

| Variable | Default | Meaning |
|---|---|---|
| `VITE_USE_MOCK` | `true` | `true` = demo data, `false` = real backend |
| `VITE_API_BASE_URL` | `/api/v1` | FastAPI base URL, no trailing slash |
| `VITE_ROUTER` | `hash` | `hash` works on any host with no setup. `browser` gives clean URLs and needs a SPA fallback |

Vite bakes these in **at build time**. Change them, then rebuild.

## Build and deploy

```bash
npm run build      # outputs ./dist (static files)
npm run preview    # test the production build locally
```

`vite.config.js` uses a relative base (`./`), so `dist/` works from any folder or sub-path.

| Host | What to do |
|---|---|
| **Netlify** | Build `npm run build`, publish `dist`. `public/_redirects` is included. |
| **Vercel** | Framework preset Vite. `vercel.json` is included. |
| **GitHub Pages / any static host** | Upload `dist/`. The default hash router needs nothing else. |
| **Nginx / VPS** | Copy `dist/` to the web root, use `nginx.conf` as a starting point. |
| **Docker** | `docker build -t vetsight-web --build-arg VITE_USE_MOCK=false --build-arg VITE_API_BASE_URL=/api/v1 .` then `docker run -p 8080:80 vetsight-web` |

Using clean URLs: set `VITE_ROUTER=browser`, rebuild, and make sure the host falls back to `index.html` (already configured in the files above).

**Deployment checklist**
- Serve over **HTTPS** (needed for microphone/voice input and secure auth).
- Set the env variables, then rebuild.
- Confirm FastAPI CORS (or the proxy) before testing login.
- Map tiles load from `tile.openstreetmap.org`. This is fine for a project demo; use a tile provider for heavy traffic.
- Fonts are bundled with the app (no Google Fonts request).

## Project structure

```
src/
  api/          client.js (axios + JWT), services.js (real API), mock.js (demo backend)
  components/   ui/ (buttons, cards, modal, fields, toasts…), layout/ (app shell, nav, bell), RouteGuards
  context/      AuthContext (login session, roles)
  data/         punjab.js (36 districts + coordinates), diseases.js (seed disease content, EN + UR)
  i18n/         I18nContext, en.js, ur.js (generated flat dictionaries)
  pages/        Landing, Login, Register, farmer/, vet/, store/, admin/, shared/
  styles/       global.css (design tokens: colours, type, radii)
```

Styling is plain **CSS Modules**. Design tokens live in `src/styles/global.css`.

## Language and RTL

`en.js` and `ur.js` must keep the same keys. Use `t('section.key')` in components, and `pick({en, ur})` for bilingual data such as disease information.
Layout uses CSS logical properties (`margin-inline-start`, etc.), so Urdu flips to RTL automatically.
The Urdu text was written for this project. Have a fluent Urdu speaker review the wording before the final demo.

## Roles and routes

| Role | Pages |
|---|---|
| Farmer | Dashboard, My farm, Animals, Disease check, Health records, Chatbot, Risk map, Appointments, Marketplace, Orders, Feedback |
| Vet | Dashboard, Requests (confirm / reschedule / cancel / complete / prescribe, animal details and health history), Availability |
| Store | Dashboard, Orders (accept / reject / update delivery status), Products (read-only) |
| Admin | Dashboard, Users (approve / block / delete), Marketplace (stores, categories, listings), Disease information, Feedback |
| Everyone | Notifications, Profile |

Vet and store sign-ups wait for admin approval before they can log in.

## Scope decisions (agreed after the SRS / database / code review)

- Registration is **farm → animals**: a farmer can have many farms; each farm has a district, address, herd size, and registered animals (animal ID, breed from the four project breeds, age, gender, weight, photo). Disease checks and health records belong to an animal.
- Appointments are **farm visit** (needs the farm address) or **in-person at clinic**. Vets can **confirm, reschedule or cancel** (and mark completed / suggest a prescription).
- Medicine delivery goes through **online stores and orders**, paid by **cash on delivery**. Listings and categories are managed by the **admin**.
- Risk predictions come from a **scheduled backend job**; the app shows stored results and in-app alerts for **Medium and High** risk.
- The chatbot lists **product names only** for medicine suggestions.
- Appointment and order status wording is kept as is for now (see the notes file; it may need unifying later).

## Tests

`npm test` runs a smoke suite (75 checks): every page for every role in English and Urdu, plus login, registration with OTP, photo upload, chatbot, booking, ordering, store, vet and admin flows. It runs against the demo backend.

## Known limits

- The demo "AI" result is simulated from the file name. The real CNN result comes from `POST /detections`.
- Voice input uses the browser's Speech Recognition (Chrome and Edge). Other browsers hide the microphone button.
- Primarily designed for desktop and laptop browsers, and responsive down to phone widths.
