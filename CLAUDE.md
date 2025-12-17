# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

IPhey is a browser fingerprint intelligence service that provides digital identity analysis by combining IP reputation, location fidelity, and browser fingerprint consistency. The project consists of a Node.js/Express API backend and a web frontend.

## Architecture

### Backend (Node.js + Express + TypeScript)
- **Entry Point**: `src/server.ts` - HTTP server with graceful shutdown
- **App Configuration**: `src/app.ts` - Express app with middleware and routing
- **Environment**: `src/config.ts` - Zod-validated configuration with required API keys
- **API Routes**: `src/routes/` - Organized by feature (health, ip, report)
- **External Clients**: `src/clients/` - IP data providers (ipinfo.io, Cloudflare Radar)
- **Services**: `src/services/` - Business logic layer
- **Middleware**: `src/middleware/` - Rate limiting, logging, error handling
- **Types**: `src/types/` - TypeScript type definitions
- **Schemas**: `src/schemas/` - Zod validation schemas

### Frontend (Next.js 14 + TypeScript)
- **Location**: `apps/web-next/` - Production SPA consuming the API
- **Tech Stack**: Next.js 14 (App Router), Tailwind CSS, React Query
- **Integration**: Deployed to Cloudflare Pages (or via `web:build` for local integration tests)

### Dependencies
- **IP Data**: Primary ipinfo.io API with Cloudflare Radar as fallback
- **Fingerprinting**: Integrates with creepjs assets (expected at `../creepjs/dist`)
- **Caching**: LRU cache for IP lookup responses
- **Testing**: Vitest with Supertest for API testing

## Development Commands

### Backend Development
```bash
npm run dev          # Development server with hot reload (ts-node-dev)
npm run build        # Build TypeScript + web frontend
npm start            # Production server (runs built dist/server.js)
npm run lint         # TypeScript type checking
```

### Testing
```bash
npm test             # Run all tests
npm run test:watch   # Tests in watch mode
npm run coverage     # Run tests with coverage report
```

### Frontend Development
```bash
npm run web:dev      # Frontend development server
npm run web:build    # Build frontend only
npm run web:preview  # Preview built frontend
npm run web:lint     # Frontend linting
```

## Configuration

### Required Environment Variables
The application requires either:
- `IPINFO_TOKEN` - ipinfo.io API token (primary)
OR both:
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `CLOUDFLARE_RADAR_TOKEN` - Cloudflare Radar API token

### Optional Variables
- `PORT` - Server port (default: 4310)
- `NODE_ENV` - Environment (development/test/production)
- `LOG_LEVEL` - Logging level (default: info)
- `CACHE_TTL_MS` - Cache TTL in milliseconds (default: 300000)
- `CACHE_MAX_ITEMS` - Maximum cache items (default: 500)
- `CLIENT_TIMEOUT_MS` - External API timeout (default: 2500)
- `CREEPJS_ASSETS_PATH` - Path to creepjs assets (default: ../creepjs/dist)

### Configuration Validation
Configuration is validated at startup using Zod. The application will fail to start if required environment variables are missing or invalid.

## API Endpoints

- `GET /api/health` - Health check with build info and dependency status
- `GET /api/ip/:ip` - Single IP lookup with caching
- `POST /api/report` - Full fingerprint analysis and report
- `GET /api/*` - API routes mounted under `/api` prefix
- `GET /*` - Static files and SPA fallback (serves from `dist/public`)

## Key Implementation Details

### Client Strategy Pattern
- `src/clients/ipinfoClient.ts` - Primary IP data provider
- `src/clients/cloudflareRadarClient.ts` - Fallback provider
- Both implement similar interfaces for easy swapping

### Caching Layer
- LRU cache implementation in `src/utils/cache.ts`
- 5-minute default TTL for IP lookups
- Configurable cache size limits

### Error Handling
- Centralized error handler in `src/middleware/errorHandler.ts`
- Request logging with PII redaction (IP hashes)
- Graceful degradation for external API failures

### Security
- Helmet middleware for security headers
- Rate limiting to prevent abuse
- CSP in production (disabled in development)
- No persistence of user data/fingerprints

## Testing Strategy

### Unit Tests
- Service layer tests in `src/services/__tests__/`
- Mock external dependencies using fixtures
- Focus on business logic and data transformation

### Integration Tests
- API endpoint tests using Supertest
- Full request/response cycle testing
- Coverage target: 80% on routes and clients

### Test Utilities
- Test setup in `src/test/setup.ts`
- Mock fixtures in `src/clients/__mocks__/`

## Development Notes

### Project Structure
- Monorepo structure with separate backend (`src/`) and Next.js frontend (`apps/web-next/`)
- Cloudflare Pages + Workers are the reference deployment targets (see `docs/DIRECT_DEPLOY.md`)
- **Note**: The `mixvisit/` directory (if present) is an external Svelte library, NOT part of the main IPhey application. It's gitignored and not integrated into the build process.

### External Dependencies
- Requires creepjs assets for browser fingerprinting
- IP data providers require API tokens with rate limits
- All external calls have timeouts and retry logic

### Performance Considerations
- IP lookup responses cached to reduce API calls
- Compression enabled for all responses
- Static assets served efficiently by Express
- Target <400ms API response times

## Troubleshooting

### Common Issues
- Missing API tokens: Check environment configuration
- Creepjs assets not found: Verify `CREEPJS_ASSETS_PATH` setting
- Cache misses: Check TTL and max items configuration
- Rate limiting: Adjust rate limiter settings in middleware

### Debug Logging
Set `LOG_LEVEL=debug` to see detailed request/response logging
IP addresses are redacted in logs using SHA256 hashes for privacy.
