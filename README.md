<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# RescueGrid

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local`.
3. Set `SMTP_USER` to your Gmail address and `SMTP_PASS` to a Google App Password (not your Google account password). Enable 2-Step Verification before creating the App Password. Email delivery will fail until these credentials are configured.
4. Optionally set `MONGODB_URI` to your MongoDB Atlas connection string. If omitted, the server uses its local in-memory MongoDB instance.
5. Set `JWT_SECRET` to a locally generated random secret.
6. Run the app:
   `npm run dev`

The server loads `.env.local` (or `.env`). These local files are excluded from Git. Never put real credentials in `.env.example` or commit them.
