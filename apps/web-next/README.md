# IPhey Web (Next.js + next-intl)

Next.js 14 App Router implementation with multi-language support.

## Features

- ✅ **Next.js 14** App Router
- ✅ **next-intl** for internationalization
- ✅ **Clean URLs** - Default language (en) has no prefix
  - English: `/about`
  - Chinese: `/zh/about`
  - Japanese: `/ja/about`
- ✅ **TypeScript** + **Tailwind CSS**
- ✅ **API Proxy** to backend (localhost:4310)
- ✅ **@tremor/react** UI components
- ✅ **TanStack Query** for data fetching
- ✅ **Framer Motion** for animations

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The development server runs on **http://localhost:3000**

## Multi-Language Setup

### Adding a New Language

1. Create translation file: `locales/fr.json`
2. Add locale to middleware: `middleware.ts` and `i18n.ts`
3. Update `app/[locale]/layout.tsx` locales array

### URL Structure

- Default locale (English): No prefix
  - `/` - Home
  - `/about` - About page
- Other locales: Prefixed
  - `/zh` - Chinese home
  - `/zh/about` - Chinese about page
  - `/ja` - Japanese home

## API Routes

All `/api/*` requests are proxied to the backend server at `http://localhost:4310/api/*`

Configure in `next.config.ts` → `rewrites()`

## Project Structure

```
apps/web-next/
├── app/
│   ├── [locale]/          # Locale-specific pages
│   │   ├── layout.tsx     # Root layout with <html lang>
│   │   └── page.tsx       # Home page
│   ├── globals.css        # Global styles
│   └── not-found.tsx      # 404 page
├── locales/
│   ├── en.json            # English translations
│   ├── zh.json            # Chinese translations
│   └── ja.json            # Japanese translations
├── middleware.ts          # next-intl middleware
├── i18n.ts                # next-intl config
└── next.config.ts         # Next.js config
```

## Migration Status

- ✅ Next.js 14 + next-intl setup
- ✅ Basic page structure with demo content
- ✅ Tailwind CSS + design system
- ✅ Multi-language routing (en/zh/ja)
- ⏳ Full component migration from Vite app
- ⏳ API integration testing

## Backend Dependency

Requires IPhey backend API running on `localhost:4310`

Start backend:
```bash
cd ../../ # Back to project root
npm run dev
```
