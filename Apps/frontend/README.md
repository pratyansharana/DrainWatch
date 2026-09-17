# 🌊 Flood & Furious — Frontend

> **NCT of Delhi Flood Command & Control System**
> A professional, real-time flood monitoring and incident management dashboard for Delhi''s flood response authorities.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Prerequisites](#3-prerequisites)gi
4. [Getting Started](#4-getting-started)
5. [Folder Structure](#5-folder-structure)
6. [Key Components](#6-key-components)
7. [Services & API Layer](#7-services--api-layer)
8. [Map Engine](#8-map-engine)
9. [Context Providers](#9-context-providers)
10. [NPM Scripts](#10-npm-scripts)
11. [Vite Configuration](#11-vite-configuration)
12. [Environment & Backend Integration](#12-environment--backend-integration)
13. [Build & Deployment](#13-build--deployment)
14. [Design System](#14-design-system)
15. [Known Limitations & Notes](#15-known-limitations--notes)

---

## 1. Project Overview

**Flood & Furious** is a single-page React application built as the command-and-control dashboard for Delhi''s flood management infrastructure. It provides:

- **Live Flood Map** — Interactive MapLibre GL map showing Delhi flood sectors, waterlogged locations, and drainage infrastructure overlaid on real tile layers.
- **Flooded Locations** — Searchable, filterable list of active waterlogged underpasses and low-lying areas with depth readings, vehicle clearance status, and agency dispatch info.
- **Drainage Pumps** — Status of major Delhi stormwater trunk canals (load percentages, flow rates) and dewatering pump stations with sluice gate controls.
- **Emergency Coordination** — Inter-agency hotline directory and public alert broadcast composer.
- **Metric Strip** — Key KPIs: Yamuna river gauge, flooded site count, active pumps, and IMD rainfall rate.

The application is **fully functional without a backend**. All API calls fall back gracefully to realistic Delhi seed data when the backend is offline, making it safe to demo and develop standalone.

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| UI Framework | React | 18.3.x |
| Build Tool | Vite | 6.x |
| Styling | Tailwind CSS | 3.4.x |
| Map Engine | MapLibre GL JS | 4.7.x |
| Icons | Lucide React | 0.475.x |
| HTTP Client | Axios | 1.7.x |
| WebSocket | Socket.IO Client | 4.8.x |
| Charts | Recharts | 2.15.x |
| Utilities | clsx, tailwind-merge | latest |
| Language | JavaScript (ESM) | ES2020+ |

> **No Google Maps API key required.** All map tiles use free, no-key tile providers (Carto, Esri).

---

## 3. Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x (or yarn/pnpm)
- No API keys required for the frontend to run.

---

## 4. Getting Started

### Install dependencies

```bash
cd flood-authority-platform/frontend
npm install
```

### Start development server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**

> If the backend is not running, the app automatically uses fallback seed data. You will see proxy errors in the terminal for `/api/*` and `/socket.io` — these are silenced and do not affect app functionality.

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

---

## 5. Folder Structure

```
frontend/
├── index.html                      # HTML entry point, MapLibre CSS included
├── package.json                    # Dependencies and scripts
├── vite.config.js                  # Vite + proxy + chunk splitting config
├── tailwind.config.js              # Tailwind theme config
├── postcss.config.js               # PostCSS with autoprefixer
├── README.md                       # This file
│
└── src/
    ├── main.jsx                    # React app entry — mounts <App />
    ├── App.jsx                     # Root layout, routing, state management
    ├── index.css                   # Global styles, scrollbar, MapLibre popup overrides
    │
    ├── services/
    │   └── api.js                  # Unified API service layer with fallback data
    │
    ├── context/
    │   ├── SocketContext.jsx       # Socket.IO real-time event provider
    │   └── AuthContext.jsx         # (Legacy) Auth context — not used in current App
    │
    └── components/
        ├── Common/
        │   ├── Button.jsx          # Reusable button (primary/secondary/danger/ghost)
        │   ├── Badge.jsx           # Status badge (critical/warning/info/success/neutral)
        │   ├── Card.jsx            # Card, CardHeader, CardBody, CardFooter
        │   ├── Modal.jsx           # Accessible modal with Escape key + backdrop close
        │   └── Toast.jsx           # Auto-dismiss notification (success/error/info)
        │
        ├── Layout/
        │   ├── Navbar.jsx          # Top navigation bar with tab switching + mobile menu
        │   ├── MetricStrip.jsx     # 4-metric executive KPI strip
        │   └── Footer.jsx          # Footer with emergency helplines
        │
        ├── Map/
        │   └── MapLibreOSMView.jsx # Full interactive map with themes, layers, markers
        │
        ├── Hotspots/
        │   ├── HotspotsSection.jsx # Flooded Locations search/filter/cards/table view
        │   └── ReportModal.jsx     # Incident reporting form with validation
        │
        ├── Drainage/
        │   └── DrainageSection.jsx # Trunk canal progress bars + pump station controls
        │
        └── Advisory/
            └── AdvisorySection.jsx # Agency hotline directory + alert broadcast composer
```

---

## 6. Key Components

### `App.jsx`
The root component. Responsibilities:
- Fetches all data on mount via `api.js` (segments, hotspots, drainage, alerts, weather)
- Manages `activeTab` state to switch between the 4 main views
- Renders `<Navbar>`, `<MetricStrip>`, the tab bar, and the active section
- On the **Live Flood Map** tab: 12-column layout — MapLibreOSMView (8 cols) + sidebar (4 cols)

**Tabs:**

| Tab ID | Label | Component |
|---|---|---|
| `MAP` | Live Flood Map | `MapLibreOSMView` + sidebar queue |
| `HOTSPOTS` | Flooded Locations | `HotspotsSection` + `ReportModal` |
| `DRAINAGE` | Drainage Pumps | `DrainageSection` |
| `ADVISORY` | Emergency Coordination | `AdvisorySection` |

---

### `MapLibreOSMView.jsx`
Full-featured interactive map component. Features:
- **3 Map Themes** (toggle buttons on map):
  - **Crisp City** — Carto Voyager @2x retina tiles (default, highest quality)
  - **Satellite View** — Esri World Imagery (free, no API key)
  - **Street Network** — Esri World Street Map (free, no API key)
- **Landmark Focus Pills** — Fly-to buttons: Minto Bridge, Kashmere Gate, ITO Junction, Pul Prahladpur, All Delhi
- **Layer Toggles**: Flood Sectors, Trunk Drains, Pump Stations
- **Delhi Flood Zone Polygons** — Colour-coded by risk: Critical (red), High (amber), Moderate (blue), Low (green)
- **Waterlogged Hotspot Markers** — Animated pulse pill showing flood depth in cm
- **Pump Station Markers** — Emerald/sky colored indicators
- **Fly-to animation** when a hotspot is selected from the sidebar
- **Inspector flyout card** on map feature click (white card, clean design)

---

### `HotspotsSection.jsx`
Flooded locations manager. Features:
- **Search bar** — filter by location name
- **Urgency filter pills** — All / Critical (>70cm) / High (40-70cm)
- **View toggle** — Cards view or Table view
- **Per-location cards** — depth badge, clearance status, agency badge, "Locate on Map" button
- **Status dropdown** — update clearance status (Active / Under Observation / Cleared)

---

### `DrainageSection.jsx`
Drainage infrastructure panel. Features:
- **Trunk Canal Cards** — colour-coded load progress bars (red >85%, amber >70%, blue otherwise), flow rate (m3/s), capacity
- **Pump Station Cards** — active/total pump count, sluice gate open/close toggle with loading state, power status badge

---

### `AdvisorySection.jsx`
Emergency coordination panel. Features:
- **Inter-agency hotline directory** — 5 agencies (DDMA, DJB, Delhi Fire, PWD, IMD) with direct call links
- **Alert broadcast composer** — Title, severity dropdown (Critical/High/Medium/Low), message body, channel checkboxes (SMS/App/IVR/Twitter), send button

---

### Common Components

#### `Button.jsx`
```jsx
<Button variant="primary" size="md" loading={false} disabled={false}>
  Label
</Button>
```
Variants: `primary` | `secondary` | `danger` | `ghost`
Sizes: `sm` | `md` | `lg`

#### `Badge.jsx`
```jsx
<Badge variant="critical" size="sm" dot={true}>Active</Badge>
```
Variants: `critical` | `warning` | `info` | `success` | `neutral`

#### `Card.jsx`
```jsx
<Card>
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
  <CardFooter>Actions</CardFooter>
</Card>
```

#### `Modal.jsx`
```jsx
<Modal isOpen={true} onClose={handleClose} title="Modal Title">
  Content
</Modal>
```
- Supports Escape key to close
- Backdrop click to close
- Focus trap for accessibility

#### `Toast.jsx`
```jsx
<Toast message="Saved successfully" type="success" onDismiss={fn} />
```
Types: `success` | `error` | `info`
Auto-dismisses after 4 seconds.

---

### Layout Components

#### `Navbar.jsx`
- Left: **Flood & Furious** brand logo + wordmark
- Center: Navigation tabs (desktop) / hamburger drawer (mobile)
- Right: Emergency Hotline `1077` button + **Report Incident** CTA
- Shows critical count badge on "Flooded Locations" tab

#### `MetricStrip.jsx`
Displays 4 live KPIs in a horizontal strip below the Navbar:

| Metric | Source |
|---|---|
| Yamuna River Gauge | Hardcoded / API |
| Flooded Sites | `hotspots.length` |
| Dewatering Pumps Active | `17/19` (API / fallback) |
| IMD Rainfall Rate | `weather.rainfall_rate_mmh` |

#### `Footer.jsx`
3-column footer:
- Brand info and tagline
- Emergency helplines: 1077 / 112 / 1095 / 101
- Platform standards note

---

## 7. Services & API Layer

**File:** `src/services/api.js`

All data fetching is centralised here. Each function:
1. Attempts to call the backend API with a **3-second timeout**
2. If the backend is unreachable or returns a non-200 response, silently **falls back to realistic Delhi seed data**

### Available Methods

```js
import api from './services/api';

// Fetch all flood segments (GeoJSON polygons)
const segments = await api.getSegments();

// Fetch all active flooded locations / hotspots
const hotspots = await api.getGrievances();

// Fetch drainage pipeline network + pump stations
const drainage = await api.getDrainageNetwork();

// Fetch authority/agency contact list
const authorities = await api.getAuthorities();

// Fetch active alert broadcasts
const alerts = await api.getAlerts();

// Fetch current weather data
const weather = await api.getWeather();

// Update a hotspot clearance status
await api.updateGrievanceStatus(id, 'CLEARED');

// Update pump station data
await api.updatePumpStation(id, { active_pumps: 3, status: 'RUNNING_OPTIMAL' });
```

### Fallback Seed Data Includes

- **8 Delhi flood zone polygons** (Minto Bridge, Kashmere Gate, ITO, Pul Prahladpur, Laxmi Nagar, Shahdara, Okhla, Dwarka)
- **4 waterlogged hotspots** with depth readings (Minto Bridge: 145cm, ITO: 87cm, Pul Prahladpur: 112cm, Kashmere Gate: 63cm)
- **4 trunk drainage canals** with flow/capacity data (Najafgarh Drain, Shahdara Drain, Supplementary Drain, Barapullah Drain)
- **4 pump stations** (Minto Bridge, ITO Regulator, Pul Prahladpur, Kashmere Gate) with sluice gate and power status
- **5 emergency agencies** (DDMA, DJB, Delhi Fire, PWD, IMD) with direct phone numbers
- **2 active alert broadcasts** (current weather + road closure)
- **Live weather data** (58.4 mm/h rainfall, 82% humidity, 31 degrees C)

---

## 8. Map Engine

**Library:** MapLibre GL JS v4.7.x
**No API key required.**

### Tile Providers

| Theme | Provider | Notes |
|---|---|---|
| Crisp City (default) | Carto Voyager @2x | Sharpest tiles, retina quality |
| Satellite View | Esri World Imagery | Free, no key |
| Street Network | Esri World Street | Free, no key |

### Map Initialization

The map centers on Delhi (77.209, 28.6139) at zoom level 11.
Settings: `maxZoom: 18`, `minZoom: 9`.

### Layer Rendering Order

1. Base raster tile layer (selected theme)
2. Flood sector fill polygons (GeoJSON)
3. Flood sector stroke lines
4. Trunk drainage canal lines
5. Pump station point markers (HTML elements)
6. Hotspot point markers (HTML elements with animated pulse)

---

## 9. Context Providers

### `SocketContext.jsx`

Provides real-time Socket.IO connection throughout the app. Wrap your component tree with `<SocketProvider>`.

```jsx
import { SocketProvider, useSocket } from './context/SocketContext';

// Access socket data in any child component:
const { isConnected, liveAlerts, livePings, lastPrediction } = useSocket();
```

**Offline-safe:** When the backend is not running, the socket will attempt to connect **3 times** with a **10-second initial delay** (max 30 seconds). After 3 failed attempts it stops retrying — no terminal spam.

**Real-time events consumed:**

| Event | State Updated |
|---|---|
| `ml:prediction-update` | `lastPrediction` |
| `weather:15min-check` | `lastWeatherCheck` |
| `alert:new-broadcast` | `liveAlerts` (prepended) |
| `ping:authority-update` | `livePings` (prepended) |
| `grievance:new` | `liveGrievances` (prepended) |

---

## 10. NPM Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `vite` | Start local dev server at port 3000 |
| `build` | `vite build` | Production build to `dist/` |
| `preview` | `vite preview` | Serve the production `dist/` locally |

---

## 11. Vite Configuration

**File:** `vite.config.js`

### Code Splitting (Manual Chunks)

The build is split into 3 chunks for optimal loading:

| Chunk | Contents | Gzip Size |
|---|---|---|
| `maplibre-*.js` | MapLibre GL JS | ~218 KB |
| `vendor-*.js` | React, ReactDOM, Axios, Lucide React | ~68 KB |
| `index-*.js` | App code | ~32 KB |

### Development Proxy

All `/api/*` and `/socket.io/*` requests are proxied to `http://localhost:5000` (backend).

When the backend is **offline**:
- `/api/*` requests receive a graceful `502` JSON response: `{ offline: true, message: "Backend offline - using local fallback" }`
- The `api.js` service layer catches this and returns fallback data instead
- `/socket.io` WebSocket errors are silently swallowed — no terminal noise

---

## 12. Environment & Backend Integration

The frontend is **backend-agnostic by design**. No `.env` file is required to run the frontend.

### When Backend IS Running

Start the backend separately on port 5000:

```bash
cd ../backend
npm install
npm start
```

The Vite proxy automatically routes `/api/*` and `/socket.io` to the backend. Real-time WebSocket events will flow through Socket.IO.

### Backend API Endpoints Expected

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/segments` | Flood zone GeoJSON polygons |
| GET | `/api/grievances` | Active flooded locations list |
| PATCH | `/api/grievances/:id` | Update location status |
| GET | `/api/drainage/network` | Drainage canals + pump stations |
| PATCH | `/api/drainage/pumps/:id` | Update pump station |
| GET | `/api/pings/authorities` | Agency contact list |
| GET | `/api/alerts` | Active alert broadcasts |
| GET | `/api/weather/current` | Current weather data |

---

## 13. Build & Deployment

### Production Build

```bash
npm run build
```

Output in `dist/`:
```
dist/
├── index.html
└── assets/
    ├── index-*.css       (~59 KB, gzip: ~10 KB)
    ├── index-*.js        (~117 KB, gzip: ~32 KB)
    ├── vendor-*.js       (~206 KB, gzip: ~68 KB)
    └── maplibre-*.js     (~803 KB, gzip: ~218 KB)
```

### Deploy to Static Hosting (Netlify / Vercel)

```bash
# Netlify CLI
netlify deploy --prod --dir=dist

# Vercel CLI
vercel --prod
```

### Deploy with Nginx (Self-Hosted)

```nginx
server {
    listen 80;
    root /var/www/flood-furious/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
    }

    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Deploy with Docker

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 14. Design System

The UI follows a **white-first, minimal, professional SaaS design language**.

### Color Palette

| Purpose | Color | Tailwind Class |
|---|---|---|
| Primary accent | Blue 600 | `bg-blue-600` / `text-blue-600` |
| Page background | White | `bg-white` |
| Section background | Slate 50 | `bg-slate-50` |
| Primary text | Slate 900 | `text-slate-900` |
| Secondary text | Slate 500 | `text-slate-500` |
| Borders | Slate 200 | `border-slate-200` |
| Critical / Red | Red 500 | `bg-red-500` |
| Warning / Amber | Amber 500 | `bg-amber-500` |
| Safe / Green | Emerald 600 | `bg-emerald-600` |

### Typography

- **Headings:** `font-bold`, `tracking-tight`, `text-slate-900`
- **Labels / Captions:** `text-xs`, `text-slate-500`, `uppercase`, `tracking-wider`
- **Mono data (gauge readings, IDs):** `font-mono`

### Spacing & Radius

- Section gaps: `gap-6` / `space-y-6`
- Cards: `rounded-xl`, `border border-slate-200`, `shadow-sm`
- Buttons: `rounded-lg`
- Badges: `rounded-full` or `rounded-md`

### Design Principles

- White background dominant — no dark themes
- Plenty of whitespace — content breathes
- No unnecessary gradients or neon accents
- Subtle shadows only (`shadow-sm`)
- Consistent blue-600 accent across all interactive elements

---

## 15. Known Limitations & Notes

| Item | Detail |
|---|---|
| No auth guard | The `AuthContext.jsx` is still on disk but not wired into the current App. Authentication is disabled. |
| Socket reconnect limit | When backend is offline, socket retries 3 times then stops. Reload the page to retry after starting the backend. |
| MapLibre chunk size | The maplibre JS chunk is ~803 KB (218 KB gzip). This is expected — MapLibre GL is a large mapping library. |
| No .env required | Backend URL is hardcoded to `http://localhost:5000` in vite.config.js. Change the proxy target if your backend runs on a different port. |
| Legacy files | `GoogleMapView.jsx`, `ApiKeyModal.jsx`, `CommandNavbar.jsx`, and files in `Operations/`, `Auth/`, `Chat/` are legacy components from a previous iteration. They are not imported by `App.jsx` and can be safely deleted. |

---

## Emergency Contact Numbers (Built-in)

| Agency | Number |
|---|---|
| Delhi Flood Helpline | **1077** |
| National Emergency | **112** |
| Delhi Jal Board | **1916** |
| Delhi Fire | **101** |
| IMD Weather | **1095** |

---

*Built for NCT of Delhi Flood Command — Flood & Furious v1.0.0*
