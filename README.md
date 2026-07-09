# ProofMode

Mobile-first agreement capture app.

ProofMode helps people capture everyday agreements before they become disagreements. Add an optional photo, write a quick note, and generate a structured Proof Card you can review, save, and share.

Built with **Cursor iOS** as a mobile-first PWA-style MVP for hackathon submission.

## Run locally

```bash
npm install
npm run dev
```

Open in Safari on iPhone or use responsive mode at 390px width.

For production preview:

```bash
npm run build
npm run preview
```

## Demo flow

1. Open **Capture**
2. Optionally add a photo
3. Enter an agreement note, for example:
   *"I lent Alex my USB-C charger. He'll return it after demos."*
4. Tap **Create Proof Card** and review extracted details
5. **Save**, **Copy message**, or **Mark complete**
6. Switch to **My Proofs** to browse Open and Complete cards

## Features

- **Capture** — Photo upload with preview and agreement note input
- **Proof Cards** — Deterministic keyword parser (no AI API)
- **My Proofs** — Open/Complete filters, save, delete, and status updates
- **localStorage** — All data stays on device in the browser
- **PWA-ready** — Standalone manifest and mobile web app metadata for iPhone Safari

## Safety and oversight

ProofMode is **not a legal contract**. It helps you create a clear personal record and confirmation message.

- AI-style extraction uses local keyword logic only — review all details before saving or sharing
- The app never sends or saves data automatically to any server
- No backend, auth, database, or external API calls

## Stack

- React 19 + Vite
- No backend · No auth · No external APIs

## Privacy

This project contains no personal information or private account details.
