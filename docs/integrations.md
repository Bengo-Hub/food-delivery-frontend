# Ordering Frontend – Integration Guide

**Last Updated**: March 6, 2026

How the ordering frontend (`ordersapp.codevertexitsolutions.com`) connects to backend APIs and external services.

---

## Primary Backend: Ordering API

**Base URL**: `https://orderingapi.codevertexitsolutions.com`  
**Config**: `NEXT_PUBLIC_API_BASE_URL` environment variable  
**Client**: Axios instance in `src/lib/baseapi.ts`

### Axios Client Setup

The `baseapi` client is the single HTTP client for all backend calls. It provides:

- **Base URL**: From `NEXT_PUBLIC_API_BASE_URL`
- **Auth interceptor**: Attaches `Authorization: Bearer {token}` from auth store
- **Refresh interceptor**: On 401, attempts token refresh, queues concurrent requests
- **Request ID**: Generates `X-Request-ID` (UUIDv4) for every request
- **Tenant scoping**: All API calls include `{tenant}` in the URL path, read from the `[orgSlug]` route parameter

### TanStack Query Integration

All data fetching uses TanStack Query hooks wrapping `baseapi` calls:

| Hook | Location | Endpoint | Stale Time |
|------|----------|----------|------------|
| `useOutlets()` | `src/hooks/use-menu.ts` | `GET /v1/{tenant}/outlets` | 30 min |
| `useMenuCategories()` | `src/hooks/use-menu.ts` | `GET /v1/{tenant}/menu-categories` | 5 min |
| `useMenuItems()` | `src/hooks/use-menu.ts` | `GET /v1/{tenant}/menu-items` | 5 min |
| `useMenuItem(id)` | `src/hooks/use-menu.ts` | `GET /v1/{tenant}/menu-items/{id}` | 5 min |
| `useBrand()` | `src/hooks/use-brand.ts` | `GET /v1/{tenant}/config` | 30 min |
| `useOrders()` | `src/hooks/use-orders.ts` | `GET /v1/{tenant}/orders` | 30 sec |
| `useOrder(id)` | `src/hooks/use-orders.ts` | `GET /v1/{tenant}/orders/{id}` | 10 sec |
| `useCart()` | `src/hooks/use-cart.ts` | `GET /v1/{tenant}/carts/{id}` | 0 (always fresh) |

Mutations use `useMutation` with optimistic updates for cart operations and `onSuccess` invalidation for order operations.

---

## Authentication: Auth Service (SSO)

**Auth Service URL**: `https://sso.codevertexitsolutions.com`  
**Config**: `NEXT_PUBLIC_AUTH_SERVICE_URL`

### Auth Flow

The frontend does NOT call auth-service directly. All auth requests go through the ordering backend proxy:

```
Frontend → orderingapi.codevertexitsolutions.com/v1/{tenant}/auth/login
           → proxies to → sso.codevertexitsolutions.com/api/v1/auth/login
```

### Endpoints (via Backend Proxy)

| Action | Frontend Calls | Backend Proxies To |
|--------|---------------|-------------------|
| Login | `POST /v1/{tenant}/auth/login` | `POST /api/v1/auth/login` on SSO |
| Register | `POST /v1/{tenant}/auth/register` | `POST /api/v1/auth/register` on SSO |
| Refresh | `POST /v1/{tenant}/auth/refresh` | `POST /api/v1/auth/refresh` on SSO |
| Google OAuth | Redirect to SSO `/oauth/google` | SSO handles callback |

### Token Storage

| Token | Storage | Reason |
|-------|---------|--------|
| `access_token` | Zustand store (in-memory) | Short-lived, no persistence needed |
| `refresh_token` | `httpOnly` cookie or `localStorage` | Survives page refresh |
| `session_id` | Zustand store | For session tracking |

### Role-Based Routing

After auth, the frontend inspects JWT claims and routes accordingly:

```typescript
// src/lib/auth-redirect.ts
const roles = decodedToken.roles;

if (roles.includes('rider')) {
  window.location.href = `${LOGISTICS_UI_URL}/${tenantSlug}/dashboard`;
} else if (roles.includes('staff') || roles.includes('admin')) {
  window.location.href = `${CAFE_WEBSITE_URL}/${tenantSlug}/admin`;
} else {
  router.push(`/${tenantSlug}/menu`);
}
```

---

## Payments: Treasury Service (via Backend)

**Integration**: Indirect — frontend calls ordering backend, backend calls treasury-service.

### Order creation and payment flow

The frontend currently sends `POST /v1/{tenant}/orders` with body `{ outletId, items, deliveryAddress, paymentMethod }`. The ordering-backend exposes `POST /checkout` with `{ cartId, deliveryAddressId, ... }` (cart-based). Ensure backend either supports a direct create-order-from-items endpoint matching the frontend contract or frontend is updated to use cart API (`POST /cart/items`, then `POST /checkout` with `cartId`). See e2e-gap-analysis.md.

### Payment Flow

```
1. Frontend: POST /v1/{tenant}/orders  (with payment_method: "mpesa" or "cod")
2. Backend: Creates order → calls treasury POST /api/v1/payments/intents (or /checkout flow)
3. Backend: Returns { order_id, payment_status: "pending" }
4. Backend: Treasury triggers M-Pesa STK push to customer phone
5. Frontend: Polls GET /v1/{tenant}/orders/{id} every 3 seconds
6. Customer: Confirms payment on phone
7. Treasury: Sends webhook to backend → payment_status: "paid"
8. Frontend: Poll detects status change → shows "Payment Confirmed"
```

### Payment Status Polling

```typescript
const { data: order } = useQuery({
  queryKey: ['order', orderId],
  queryFn: () => baseapi.get(`/v1/${tenant}/orders/${orderId}`),
  refetchInterval: (query) => {
    const status = query.state.data?.payment_status;
    if (status === 'paid' || status === 'failed') return false;
    return 3000; // poll every 3s while pending
  },
});
```

### Timeout Handling

- After 2 minutes of polling with no resolution: show "Payment taking longer than expected"
- Offer "Retry Payment" and "Cancel Order" buttons
- Track payment timeout events for analytics

---

## Logistics: Live Tracking (via Backend + Direct)

**Logistics UI URL**: `https://logistics.codevertexitsolutions.com`  
**Config**: `NEXT_PUBLIC_LOGISTICS_UI_URL`

### Order Tracking Data

Order detail from backend includes delivery data:

```json
{
  "id": "order-uuid",
  "status": "out_for_delivery",
  "logistics_task_id": "task-uuid",
  "delivery": {
    "rider_name": "John",
    "eta_minutes": 15,
    "rider_phone": "+254..."
  }
}
```

### Live Rider Location

When `status` is `out_for_delivery` and `logistics_task_id` is present, the frontend connects to the logistics-service for live coordinates:

```typescript
// Polling fallback (MVP)
const { data: tracking } = useQuery({
  queryKey: ['tracking', orderId],
  queryFn: () => baseapi.get(`/v1/${tenant}/orders/${orderId}/tracking`),
  refetchInterval: 10000, // every 10 seconds
  enabled: order?.status === 'out_for_delivery',
});
```

WebSocket/SSE integration is post-MVP. For launch, poll the backend tracking endpoint.

### Rider Redirects

Users with `rider` role are redirected to logistics-service after auth. No rider features exist in the ordering frontend.

---

## Notifications: Push & In-App

**Config**: `NEXT_PUBLIC_VAPID_KEY` for Web Push

### Push Notification Registration

```
1. User grants notification permission (prompted after first order)
2. Frontend: Subscribe to push via service worker
3. Frontend: POST /v1/{tenant}/push/subscribe  (subscription object)
4. Backend: Stores subscription, forwards to notifications-service
```

### Notification Types Received

| Event | Push Title | Action |
|-------|-----------|--------|
| Order confirmed | "Order Confirmed!" | Open order tracking |
| Order preparing | "Your order is being prepared" | Open order tracking |
| Order out for delivery | "Your order is on the way!" | Open order tracking |
| Order delivered | "Order delivered!" | Open order detail |
| Promo available | "New offer available" | Open menu |

### In-App Notifications

Not implemented for MVP. Post-launch: notification bell in header with unread count and dropdown.

---

## External Service Redirects

| Service | Env Variable | URL | When Used |
|---------|-------------|-----|-----------|
| Logistics UI | `NEXT_PUBLIC_LOGISTICS_UI_URL` | `logistics.codevertexitsolutions.com` | Rider role redirect, rider onboarding |
| Cafe Website | `NEXT_PUBLIC_CAFE_WEBSITE_URL` | `theurbanloftcafe.com` | Staff/admin role redirect |
| Auth Service | `NEXT_PUBLIC_AUTH_SERVICE_URL` | `sso.codevertexitsolutions.com` | OAuth callbacks |

All redirects preserve `tenant_slug` in the URL and include `return_url` for navigation back.

---

## Environment Variables

| Variable | Example | Required | Purpose |
|----------|---------|----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://orderingapi.codevertexitsolutions.com` | Yes | Ordering backend |
| `NEXT_PUBLIC_AUTH_SERVICE_URL` | `https://sso.codevertexitsolutions.com` | Yes | OAuth redirects |
| `NEXT_PUBLIC_LOGISTICS_UI_URL` | `https://logistics.codevertexitsolutions.com` | Yes | Rider redirects |
| `NEXT_PUBLIC_CAFE_WEBSITE_URL` | `https://theurbanloftcafe.com` | Yes | Staff redirects |
| `NEXT_PUBLIC_VAPID_KEY` | `BEl62i...` | Yes | Web Push subscription |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | `pk.eyJ...` | No | Map display (tracking page) |
| `NEXT_PUBLIC_DEFAULT_TENANT` | `urban-loft` | No | Fallback tenant slug |

---

## Error Handling Strategy

### Global Error Boundary

Wraps the entire app. On unhandled error: shows "Something went wrong" with "Reload" button. Logs error to console (production: forward to error tracking service).

### API Error Handling

The `baseapi` interceptor transforms backend errors into a consistent shape:

```typescript
interface ApiError {
  code: string;        // e.g. "VALIDATION_ERROR"
  message: string;     // human-readable
  details?: Array<{ field: string; message: string }>;
  status: number;
}
```

Components use this to:

- Show field-level validation errors on forms
- Show toast notifications for server errors
- Redirect to auth on 401 after failed refresh
- Show "Service unavailable" banner on 503

### Offline Detection

Network status monitored via `navigator.onLine` and `online`/`offline` events. When offline:

- Show amber banner at top
- Disable order submission
- Serve cached menu data
- Queue cart mutations for sync on reconnect

---

## Data Flow Summary

```
┌─────────────┐     baseapi (Axios)      ┌──────────────────┐
│  Ordering    │ ───────────────────────► │  Ordering Backend │
│  Frontend    │ ◄─────────────────────── │  (Go / chi)       │
│  (Next.js)   │                          └──────┬───────────┘
│              │                                  │
│  TanStack    │                          ┌──────▼───────────┐
│  Query +     │                          │  Auth Service     │
│  Zustand     │                          │  (JWT / JWKS)     │
│              │                          ├──────────────────┤
│  Service     │                          │  Treasury         │
│  Worker      │                          │  (M-Pesa / Cards) │
│  (Workbox)   │                          ├──────────────────┤
└──────────────┘                          │  Logistics        │
                                          │  (Delivery tasks) │
                                          ├──────────────────┤
                                          │  Inventory        │
                                          │  (Stock checks)   │
                                          ├──────────────────┤
                                          │  Notifications    │
                                          │  (SMS / Push)     │
                                          └──────────────────┘
```

The frontend only talks to the ordering backend. The backend handles all cross-service communication.
