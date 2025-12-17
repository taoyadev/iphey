# IP Intelligence Migration Documentation

## Overview

This document describes the migration of IP Intelligence features from the old Vite-based frontend (`apps/web`) to the new Next.js 14-based frontend (`apps/web-next`).

## Migration Summary

**Date:** 2025-11-16
**Status:** ✅ Complete
**Backend API:** Port 4310 (Express + TypeScript)
**Frontend:**
- **OLD:** `apps/web` (Vite + React, Port 5173) - **DEPRECATED**
- **NEW:** `apps/web-next` (Next.js 14 + App Router, Port 3002) - **PRODUCTION**

## Architecture

### Backend Integration

The IP Intelligence feature integrates with the backend API running on port 4310:

- **Enhanced IP Endpoint:** `GET /api/v1/ip-enhanced`
- **Service Status Endpoint:** `GET /api/v1/services/status`
- **Threat Intel Endpoint:** `GET /api/v1/threats/:ip`
- **ASN Analysis Endpoint:** `GET /api/v1/asn/:asn`

### Data Flow

```
User Browser → Next.js Frontend (Port 3002)
              ↓
         React Query hooks fetch data
              ↓
         API Client (lib/api.ts)
              ↓
         Backend API (Port 4310)
              ↓
    ┌────────┴────────┐
    │                 │
Cloudflare Radar   IPInfo.io
(ASN Analysis)  (Geolocation)
    │                 │
    └────────┬────────┘
             ↓
    Threat Intelligence
  (AbuseIPDB + Spamhaus)
```

## Implementation Details

### Phase 1: Type Definitions

**File:** `apps/web-next/types/report.ts`

Added 87 lines of TypeScript interfaces:
- `ThreatIntelligence` - Multi-provider threat data
- `ASNAnalysis` - Autonomous System Number information
- `RiskAssessment` - Overall risk evaluation
- `EnhancedIPResponse` - Complete IP intelligence payload
- `ServiceStatus` - Backend service availability

### Phase 2: API Client

**File:** `apps/web-next/lib/api.ts` (NEW)

Created 5 API functions with proper error handling:
```typescript
fetchEnhancedIP(ip, options)       // Single IP lookup
fetchClientEnhancedIP(options)     // Current user's IP
fetchServiceStatus()                // Service availability
fetchThreatIntel(ip)                // Threat data only
fetchASNAnalysis(asn)               // ASN info only
```

### Phase 3: UI Components

#### 3.1 ServiceStatusBanner (165 lines)
**File:** `apps/web-next/components/ServiceStatusBanner.tsx` (NEW)

- Shows service availability (geolocation, threat_intelligence, asn_analysis)
- Dismissible banner
- Auto-hides when all services are enabled
- Color-coded: Red (all disabled), Amber (partial)

#### 3.2 RiskAssessmentCard (273 lines)
**File:** `apps/web-next/components/RiskAssessmentCard.tsx` (NEW)

- 4 risk levels: low, medium, high, critical
- Progress bar visualization
- Animated risk factors list
- Recommendations based on risk level
- Summary stats (score, factors count, level)

#### 3.3 ThreatIntelPanel (284 lines)
**File:** `apps/web-next/components/ThreatIntelPanel.tsx` (NEW)

- Provider integration (AbuseIPDB, Spamhaus)
- Threat score with progress bars
- Confidence level indicator
- Threat types badges
- Error handling for provider failures

#### 3.4 ASNInfoPanel (208 lines)
**File:** `apps/web-next/components/ASNInfoPanel.tsx` (NEW)

- ASN number display
- Organization and network name
- Description and country information
- Icon-coded info blocks
- Active status badge

### Phase 4: Main Page Integration

**File:** `apps/web-next/app/[locale]/page.tsx`

Changes made:
1. Added `'ip-intel'` to activeTab type
2. Added `showStatusBanner` state
3. Added React Query hooks:
   - `enhancedIPData` - Fetches IP intelligence (5min staleTime)
   - `serviceStatus` - Fetches service status (2min staleTime, 5min refetch)
4. Added ServiceStatusBanner before tabs section
5. Added IP Intelligence tab button
6. Added IP Intelligence tab panel with:
   - IP address display with geolocation
   - RiskAssessmentCard
   - ThreatIntelPanel + ASNInfoPanel (2-column grid)
   - Data sources badges

### Phase 5: Internationalization

**Files Modified:**
- `apps/web-next/locales/en.json`
- `apps/web-next/locales/zh.json`

Added translations:
```json
{
  "tabs": {
    "ipIntel": "IP Intelligence" | "IP 情报",
    "ipIntelShort": "IP Intel" | "IP 情报"
  },
  "ipIntel": {
    "title": "IP Intelligence" | "IP 情报",
    "subtitle": "Advanced IP reputation and threat analysis" | "高级 IP 信誉和威胁分析",
    "yourIP": "Your IP Address" | "您的 IP 地址",
    "dataSources": "Data Sources" | "数据来源",
    "lastUpdated": "Last updated" | "最后更新"
  }
}
```

## Features

### 1. Service Status Monitoring

The ServiceStatusBanner component monitors three backend services:
- **Geolocation:** IP location lookup
- **Threat Intelligence:** AbuseIPDB + Spamhaus checks
- **ASN Analysis:** Cloudflare Radar ASN data

### 2. Risk Assessment

Multi-factor risk scoring system:
- **Risk Levels:** Low (0-30), Medium (31-60), High (61-85), Critical (86-100)
- **Risk Factors:** Array of identified issues
- **Recommendations:** Actionable guidance based on risk level

### 3. Threat Intelligence

Aggregated threat data from multiple providers:
- **AbuseIPDB:** Abuse reports, threat types, confidence scores
- **Spamhaus:** Blacklist status, list type
- **Combined Score:** Weighted aggregation of all sources
- **Threat Types:** Categorized threat classifications

### 4. ASN Analysis

Autonomous System information powered by Cloudflare Radar:
- **ASN Number:** e.g., AS13335 (Cloudflare)
- **Organization:** Registered organization name
- **Network Name:** Network designation
- **Country:** ASN registration country
- **Description:** Additional context

## API Configuration

### Required Environment Variables

```bash
# Backend .env file

# Cloudflare Radar API (for ASN analysis)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_RADAR_TOKEN=your_radar_token

# IPInfo.io (for geolocation)
IPINFO_TOKEN=your_ipinfo_token

# Threat Intelligence (optional but recommended)
ABUSEIPDB_API_KEY=your_abuseipdb_key
SPAMHAUS_API_KEY=your_spamhaus_key
```

### Service Endpoints

All API endpoints use the `/api/v1` prefix:

```typescript
GET /api/v1/ip-enhanced
  ?threats=true        // Include threat intelligence (default: true)
  &asn=true            // Include ASN analysis (default: true)

GET /api/v1/services/status
  // Returns: { geolocation: bool, threat_intelligence: bool, asn_analysis: bool }

GET /api/v1/ip/:ip/enhanced
  ?threats=false       // Exclude threat intelligence
  &asn=false          // Exclude ASN analysis

GET /api/v1/threats/:ip
  // Returns: ThreatIntelligence

GET /api/v1/asn/:asn
  // Returns: ASNAnalysis
```

## Testing

### Manual Testing

1. **Start Backend:**
   ```bash
   cd /Volumes/SSD/dev/new/ip-dataset/iphey
   npm run dev  # Runs on port 4310
   ```

2. **Start Frontend:**
   ```bash
   cd apps/web-next
   npm run dev  # Runs on port 3002
   ```

3. **Access Application:**
   - Open: http://localhost:3002
   - Click "IP Intelligence" tab (last tab)
   - Verify all components load:
     - Service Status Banner (if any services disabled)
     - Risk Assessment Card
     - Threat Intelligence Panel
     - ASN Info Panel
     - Data Sources badges

### Test Scenarios

#### Scenario 1: All Services Enabled
- **Expected:** No ServiceStatusBanner shown
- **Expected:** All panels show data
- **Verification:** Check browser console for successful API calls

#### Scenario 2: Some Services Disabled
- **Expected:** ServiceStatusBanner shows amber warning
- **Expected:** Disabled services show "No data available"
- **Verification:** Check service status indicator colors

#### Scenario 3: Language Switching
- **Expected:** All labels switch to Chinese when changing language
- **Verification:** Tab labels, panel titles, data source names all localized

#### Scenario 4: Risk Levels
- **Test Different IPs:** Use backend `/api/v1/ip/:ip/enhanced` with various IPs
- **Expected:** Different risk levels show different colors/icons:
  - Low: Green shield
  - Medium: Yellow shield with alert
  - High: Orange triangle warning
  - Critical: Red octagon alert

## Known Issues

### Backend API Issues (RESOLVED)

**Issue:** Cloudflare Radar ASN service was unavailable due to using Intel API endpoint
**Root Cause:** Intel API requires enterprise account permissions
**Solution:** Switched to public Radar API endpoint `/radar/entities/asns/:asn`
**Status:** ✅ Resolved - All services now functional

### Frontend Issues

**Issue:** next-intl deprecation warning
**Severity:** Low (does not affect functionality)
**Warning:** Reading request configuration from `./i18n.ts` is deprecated
**Solution:** Can be migrated to `./i18n/request.ts` in future update

## Performance Considerations

### React Query Caching

- **Enhanced IP Data:** 5-minute stale time, only fetches when IP Intel tab active
- **Service Status:** 2-minute stale time, refetches every 5 minutes
- **Benefits:** Reduces unnecessary API calls, improves UX

### Component Optimization

- All UI components wrapped with `React.memo` for re-render prevention
- Lazy loading for tab content (only loads when selected)
- Framer Motion animations use GPU acceleration

## Future Enhancements

### Planned Features

1. **Historical Tracking:** Store IP intelligence results in browser localStorage
2. **Export Functionality:** Download reports as JSON/PDF
3. **Custom IP Lookup:** Allow users to check any IP address
4. **Webhook Integration:** Real-time threat alerts
5. **Advanced Filters:** Filter threat types, risk levels

### Maintenance Tasks

1. **Migrate i18n config:** Update to new next-intl configuration format
2. **Add Japanese Translations:** Extend i18n support to `ja.json`
3. **Unit Tests:** Add Jest/Vitest tests for components and API client
4. **E2E Tests:** Add Playwright tests for full user flows

## Cleanup Tasks (Phase 6)

### 6.2 Mark Old Frontend as Deprecated

Add notice to `apps/web/README.md`:

```markdown
# ⚠️ DEPRECATED - Old Vite Frontend

**This frontend has been deprecated in favor of `apps/web-next` (Next.js 14).**

## Migration Status
- IP Intelligence features migrated: ✅
- New production URL: http://localhost:3002
- This version will be removed in future updates

Please use `apps/web-next` for all development.
```

### 6.3 Update Root package.json Scripts

```json
{
  "scripts": {
    "dev": "npm run dev --workspace=apps/web-next",
    "dev:backend": "npm run dev --workspace=iphey-backend",
    "dev:old-frontend": "npm run dev --workspace=apps/web",
    "web:build": "npm run build --workspace=apps/web-next",
    "web:start": "npm run start --workspace=apps/web-next"
  }
}
```

### 6.4 Close Old Development Servers

```bash
# Kill old Vite server processes
pkill -f "vite.*--port 5173"
pkill -f "vite.*--port 3002"

# Keep only Next.js server on port 3002
# Keep backend server on port 4310
```

## Troubleshooting

### Service Status Shows All Disabled

**Check:**
1. Backend server running on port 4310?
2. Environment variables configured in backend `.env`?
3. Network connectivity to external APIs (Cloudflare, IPInfo)?

**Debug:**
```bash
# Test backend health
curl http://localhost:4310/api/v1/services/status

# Expected response:
{
  "geolocation": true,
  "threat_intelligence": true,
  "asn_analysis": true
}
```

### IP Intelligence Tab Shows No Data

**Check:**
1. Browser console for API errors
2. React Query DevTools for failed queries
3. Backend logs for API failures

**Debug:**
```bash
# Test enhanced IP endpoint directly
curl http://localhost:4310/api/v1/ip-enhanced

# Check for errors in response
```

### Components Not Rendering

**Check:**
1. Import paths use `@/` alias correctly
2. All dependencies installed (`npm install`)
3. TypeScript types matching backend response

**Debug:**
```bash
# Rebuild Next.js
cd apps/web-next
rm -rf .next
npm run dev
```

## References

### Documentation
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Tremor React Documentation](https://www.tremor.so/docs)

### API Documentation
- [Cloudflare Radar API](https://developers.cloudflare.com/radar/get-started/)
- [IPInfo.io API](https://ipinfo.io/developers)
- [AbuseIPDB API](https://docs.abuseipdb.com/)

### Related Files
- Backend: `/src/routes/enhanced-ip.ts`
- Types: `/src/types/report.ts`
- Clients: `/src/clients/cloudflareRadarASNClient.ts`

## Contact

For questions or issues related to this migration:
- Review this documentation
- Check backend logs: `docker logs ipdata-api`
- Check frontend console for errors
- Review API responses with network tab

---

**Migration completed:** 2025-11-16
**Documentation version:** 1.0
**Next review date:** 2025-12-16
