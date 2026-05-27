# MedSafe

MedSafe is a pharmaceutical batch verification demo built with Next.js.

## Features implemented

- Manufacturer batch registration flow with Lightning-style invoice creation
- Payment confirmation endpoint that signs and publishes a Nostr event
- Batch verification endpoint with signature check and anomaly logging
- Twilio WhatsApp webhook endpoint for text/image verification flow
- Dashboard pages for registration and viewing batches
- NeonDB-compatible data layer with in-memory fallback for local hacking

## Quick start

1. Copy env values:

```bash
cp .env.example .env.local
```

2. Install dependencies:

```bash
npm install
```

3. Run dev server:

```bash
npm run dev
```

## Main routes

- `/` landing page
- `/register` batch registration form
- `/batches` list of created batches
- `POST /api/register-batch`
- `GET /api/register-batch/confirm?paymentHash=...`
- `GET /api/verify-batch?batchId=...`
- `POST /api/whatsapp-webhook`
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
