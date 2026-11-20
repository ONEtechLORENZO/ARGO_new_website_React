# ARGO website — moving to a new PC

How to get the ARGO website running on another computer and continue working on it with Claude Code.
Part A is done once on the **old** PC, Part B on the **new** one, and Part C is the prompt to paste into Claude on the new PC.

---

## Part A — on the old PC (before you switch)

1. **Make sure GitHub has the latest version.** Ask Claude on the old PC: *"push everything"*.
   Anything not pushed stays only on the old PC.
2. **Copy the secrets file.** The file `.env.local` (in the project folder) is deliberately **not** on GitHub,
   because it contains the Apps Script address and the secret password for the contact form.
   Copy it to the new PC privately: a USB stick, or a private message to yourself.
   Don't email it around or upload it anywhere public.
   - Lost it? It contains two lines (see `.env.example`):
     `DEMO_WEBHOOK_URL` = the Apps Script web app address ending in `/exec`,
     `DEMO_WEBHOOK_SECRET` = the same value as the script property `DEMO_SECRET` in Google Apps Script
     (Project Settings → Script Properties).

---

## Part B — on the new PC

### 1. Install the tools (one time)

| Tool | Where | Notes |
|---|---|---|
| **Git** | https://git-scm.com/download/win | Default options are fine. |
| **Node.js** (LTS, version 24 or newer) | https://nodejs.org | Default options are fine. |
| **VS Code** | https://code.visualstudio.com | |
| **Claude Code** extension | in VS Code: Extensions (Ctrl+Shift+X) → search "Claude Code" → Install | Sign in with your Claude account. |
| **Microsoft Edge** | already on Windows | Used for the automatic browser tests. |

Check in a terminal (VS Code → Terminal → New Terminal):
```
git --version
node -v
```

### 2. Give the new PC access to GitHub

The repository is **github.com/ONEtechLORENZO/ARGO_new_website_React** (private).
Easiest way: download with HTTPS and sign in to GitHub when the window asks (step 3).
If you prefer SSH keys (what the old PC uses), Claude on the new PC can set that up for you.

### 3. Download the project

In the terminal, go to where you want the folder (for example the Desktop) and run:
```
cd Desktop
git clone https://github.com/ONEtechLORENZO/ARGO_new_website_React.git "New Argo"
cd "New Argo"
```

### 4. Put the secrets file in place

Copy `.env.local` from Part A into the `New Argo` folder (next to `package.json`).
Without it the site still works, but the contact form opens an email instead of sending automatically.

### 5. Install and start

```
npm install
npm run dev
```
Then open **http://localhost:6120** (English: http://localhost:6120/en).
The site runs as long as that terminal stays open. Stop it with Ctrl+C.

### 6. (Optional) Let others on the same Wi-Fi see it

The terminal shows a "Network" address like `http://192.168.x.x:6120`. Share that.
If colleagues can't open it, Windows Firewall is blocking it. Run this once in **PowerShell as Administrator**:
```
New-NetFirewallRule -DisplayName "ARGO sito locale 6120" -Direction Inbound -Protocol TCP -LocalPort 6120 -Action Allow
```

### 7. Nothing to do in Google Apps Script

The email script (`apps-script/Code.gs`) is already deployed and keeps working: it runs on Google, not on the PC.

### 8. Start Claude

In VS Code: File → Open Folder → `New Argo`, open the Claude Code panel, and paste the prompt from Part C.

---

## Part C — prompt to paste into Claude on the new PC

```
You're picking up an existing project: the ARGO marketing website (ARGO by One Tech, a document-reading
engine). I've just moved it to this PC from GitHub (github.com/ONEtechLORENZO/ARGO_new_website_React).
Read this, then check the project yourself before changing anything.

STACK AND RUNNING
- Next.js 16 (App Router, Turbopack), React 19, TypeScript. This Next version has breaking changes:
  read the docs in node_modules/next/dist/docs/ before using unfamiliar APIs (see AGENTS.md).
- Dev server: `npm run dev` on port 6120 (http://localhost:6120). Typecheck: `npx tsc --noEmit`.
- Secrets are in .env.local (never commit it): DEMO_WEBHOOK_URL, DEMO_WEBHOOK_SECRET.
  NEXT_PUBLIC_SITE_URL must be set to the real domain when it goes live.
- next.config.mjs allows LAN dev access (allowedDevOrigins 192.168.*.*) and handles the language routes.

LANGUAGES AND ROUTES
- Italian is served at "/" (internally /it via a rewrite, /it redirects to /), English at /en.
  Root layout is app/[lang]/layout.tsx.
- Every visible text lives in lib/i18n.ts (dictionaries `it` and `en`, typed by `Dict`); components read
  them with useT() from components/I18n.tsx. Any text change must be done in BOTH languages.
- Site settings in lib/site.ts: email sales@otech.one, address Via Gustavo Fara 35, 20124 Milano,
  WhatsApp 393409683934, appLoginUrl https://myargo.otech.one/ (the header "Accedi" button opens it
  in a new tab), SHOW_PRICING = false (the "Piani e prezzi" section, its "Piani" tab and the prices in
  JSON-LD are hidden; true brings them back).

PAGE STRUCTURE (app/[lang]/page.tsx)
Header (logo, section tabs, Accedi ↗, IT|EN, Contattaci; on ≤1100px a second row of section tabs; on
≤640px Accedi moves into the ☰ menu) · Hero (the "reading logo" animation, lib/argoReader.ts) ·
Come funziona (5 dark step cards with animated scenes) · subheading "ARGO non è solo un motore di lettura
documenti. È qualcosa di molto più avanzato." · ARGO+ (Matrix rain card, 4 points) · Perché conviene
(4 dark cards) · Chi siamo (One Tech mark drawn in Matrix characters with code streams, components/
LogoMatrix.tsx) · Footer · floating WhatsApp button · contact form modal.

CONTACT FORM
- components/DemoModal.tsx: 4-step form in a <dialog>. Any link to "#richiedi-demo" opens it; links with
  data-plan pass the chosen pricing plan. Validation in lib/validate.ts (Italian phone rules).
- It posts to app/api/demo/route.ts, which forwards to the Google Apps Script in apps-script/Code.gs
  (already deployed). The script emails sales@otech.one with all details and sends the customer a
  confirmation ("Gentile {nome}"). If Code.gs changes, it must be re-pasted in Apps Script and deployed
  as a new version.

DESIGN RULES (the client is picky about these)
- Dark theme only (html data-theme="dark"; colours in app/globals.css + overrides in app/theme.css).
- Sharp, square corners on buttons and boxes (no rounded pills), except the round WhatsApp button.
- Font DM Mono everywhere. Brand greens #1f9d5a / #16884f / #2fbf72, lime accent #d4f25a.
- "Matrix" style = falling binary + letters (GLYPHS in components/MatrixRain.tsx).
- Everything must work well on phones (check 360/390px) with no sideways scrolling.
- Respect prefers-reduced-motion. Code comments are written in Italian, in the existing style.

STANDALONE FILES (standalone/)
Single-file HTML/CSS/JS versions for use on other websites: argo-login.html (full login page),
argo-scanner.html (document scanner box), argo-matrix-logo.html (Chi siamo animation). They're not used
by the site itself.

HOW I LIKE TO WORK
- I'm not a developer. Explain results in plain words, keep answers short, and verify changes yourself in
  a real browser (Playwright with channel "msedge" works on this PC) before saying they work.
- Don't push to GitHub unless I say "push". Other people (Lorenzo, Luis) also push to the repo, so pull
  before starting work.

First: run `git pull`, `npm install`, then start the dev server and confirm the home page, /en, and the
contact form open correctly. Tell me if anything is missing (for example .env.local).
```
