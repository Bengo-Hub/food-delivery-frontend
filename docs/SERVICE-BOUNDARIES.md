# Ordering Service Frontend - Service Boundaries

**Date**: December 2025  
**Purpose**: Clarify what functionality belongs to the ordering frontend versus other microservices.

---

## What This Frontend Handles (Ordering Service Scope)

### ✅ Customer-Facing Online Ordering
- **Menu Browsing**: Browse catalog, filter by category/dietary preferences, search items
  - **Route**: `/menu?item_id={id}&action={add-to-cart|view|whitelist}&tenant={tenant_slug}`
  - **Integration**: Handles incoming redirects from `cafe-website` to perform immediate actions on items.
- **Shopping Cart**: Add items, modify quantities, apply modifiers/variants
- **Checkout**: Delivery address selection, payment method selection, order placement
- **Order Tracking**: Real-time order status updates, delivery tracking with map integration
  - **Route**: `/track?id={order_id}&tenant={tenant_slug}`
  - **Source**: Accepts redirects from `cafe-website` and other services.
  - **Live Tracking**: Pulls live driver coordinates from `logistics-service` via WebSocket/API when order is in delivery stage.
- **Customer Account**: Profile management, saved addresses, payment methods, order history, loyalty points
- **Authentication**: Customer login/registration via auth-service SSO

- **App-First / Mobile-First Behaviour**: The ordering frontend is intentionally app-first — landing surfaces the item feed immediately (feed-first). On first access the app requests geolocation consent and sets a default outlet. Authentication is minimal and focused on customers; staff/riders are redirected to their owning services after auth.

### ✅ PWA Features
- **Installable**: Add to home screen on mobile and desktop
- **Offline Support**: Browse cached menu items, view cart offline
- **Push Notifications**: Order status updates, promotions, loyalty alerts
- **Fast Loading**: Optimized performance with code splitting and caching

---

## What This Frontend Does NOT Handle (Redirects to Other Services)

### ❌ Rider Dashboards & Management → **logistics-service**
- **Route**: `/dashboard/rider`
- **Redirects To**: `https://logistics.codevertexafrica.com/{tenant_slug}/dashboard`
- **Why**: All rider data (profiles, shifts, tasks, earnings) owned by logistics-service
- **Integration**: Ordering service only stores `rider_id` references for order assignments

> Note: Redirects preserve `tenant_slug` and a `return_url` so users may navigate back to ordering if needed. These redirects are intentional to enforce clear data ownership and to keep the ordering frontend focused on customer ordering flows.

### ❌ Rider Onboarding → **logistics-service**
- **Route**: `/riders/signup`
- **Redirects To**: `https://logistics.codevertexafrica.com/{tenant_slug}/riders/onboard`
- **Why**: Rider registration, KYC, vehicle management belong to logistics-service
- **Flow**: User redirected to logistics-service for complete onboarding

### ❌ Staff/Admin Dashboards → **cafe-website**
- **Route**: `/dashboard/staff`
- **Redirects To**: `https://theurbanloftcafe.com/{tenant_slug}/admin`
- **Why**: Operations management, analytics, staff administration belong to cafe-website
- **Integration**: Ordering service provides order APIs for admin dashboards

**Auth flow note**: After OAuth callback the ordering frontend inspects role claims; if the authenticated user has `staff` or `admin` roles they are redirected to `NEXT_PUBLIC_CAFE_WEBSITE_URL` (staff/admin UI). If the user has `rider` role they are redirected to `NEXT_PUBLIC_LOGISTICS_UI_URL`.

### ❌ POS Operations → **pos-service**
- **Not Implemented in This Frontend**
- **Why**: POS terminals, cash drawer, dine-in orders, pickup orders belong to pos-service
- **Integration**: Ordering service only handles online delivery/shipping orders

### ❌ Marketing/Content Pages → **cafe-website**
- **Removed Pages**: `/about`, `/contact`, `/cafes`, `/delivery`, `/loyalty` (marketing pages)
- **Why**: These are marketing/branding pages that belong to cafe-website
- **Remaining**: Only `/menu` and `/dashboard/customer` for ordering functionality

---

## Service Integration Patterns

### 1. **Logistics Service** (Rider & Delivery Management)
```typescript
// Redirect pattern for rider features
const logisticsUrl = `https://logistics.codevertexafrica.com/${tenantSlug}/dashboard?return_url=${returnUrl}`;
window.location.href = logisticsUrl;
```

Environment variables used for redirects (client):

- `NEXT_PUBLIC_LOGISTICS_UI_URL` — base URL for logistics UI (rider flows)
- `NEXT_PUBLIC_CAFE_WEBSITE_URL` — base URL for staff/admin UI
- `NEXT_PUBLIC_AUTH_SERVICE_URL` — base URL for SSO/OAuth provider

**What Ordering Service Does**:
- Creates delivery tasks via REST API: `POST /v1/{tenant}/tasks`
- References `rider_id` in order assignments (from logistics-service)
- Consumes `logistics.task.*` events for order status updates
- Displays live tracking via WebSocket from logistics-service (pulls coordinates using `order_id` or `task_id`)

**What Ordering Service Does NOT Do**:
- Store rider profiles or fleet data
- Manage rider shifts or availability
- Handle rider onboarding or KYC
- Display rider dashboards

### 2. **Cafe Website** (Staff/Admin Management)
```typescript
// Redirect pattern for staff/admin features
const adminUrl = `https://theurbanloftcafe.com/${tenantSlug}/admin?return_url=${returnUrl}`;
window.location.href = adminUrl;
```

**What Ordering Service Does**:
- Provides order APIs for admin dashboards
- Publishes `ordering.order.*` events for admin notifications
- Supports order management operations via REST API

**What Ordering Service Does NOT Do**:
- Display staff/admin dashboards
- Manage operations analytics
- Handle staff scheduling or management

### 3. **POS Service** (In-Store Operations)
**What Ordering Service Does**:
- Shares catalog data (read-only references to inventory SKUs)
- Separates online orders from POS orders

**What Ordering Service Does NOT Do**:
- Handle POS terminal operations
- Manage cash drawer or receipts
- Process dine-in or pickup orders

---

## Data Ownership Reference

| Entity | Owner Service | Ordering Service Stores |
|--------|---------------|-------------------------|
| **Riders/Drivers** | logistics-service | Only `rider_id` reference |
| **Fleet/Vehicles** | logistics-service | None (no references) |
| **Delivery Tasks** | logistics-service | Only `logistics_task_id` reference |
| **Rider Shifts** | logistics-service | None |
| **Staff Users** | auth-service + cafe-website | Only `user_id` reference |
| **POS Orders** | pos-service | None |
| **Dine-in Orders** | pos-service | None |
| **Online Orders** | **ordering-service** | **Full ownership** |
| **Shopping Cart** | **ordering-service** | **Full ownership** |
| **Menu/Catalog** | **ordering-service** | **Full ownership** (references inventory SKUs) |

---

## Navigation Flow Examples

### Customer Journey (Within Ordering Frontend)
```
Landing Page → Menu → Cart → Checkout → Order Confirmation → Order Tracking
                                                                    ↓
                                                            Customer Dashboard
```

### Rider Journey (Redirects to Logistics Service)
```
Customer signs up as rider → /riders/signup → Redirects to logistics-service
Rider logs in → /dashboard/rider → Redirects to logistics-service dashboard
```

### Staff Journey (Redirects to Cafe Website)
```
Staff logs in → /dashboard/staff → Redirects to cafe-website admin dashboard
```

---

## Implementation Notes

1. **Redirects**: All redirects preserve tenant context via `tenant_slug` and include `return_url` for smooth navigation back.
2. **Authentication**: All services share SSO via auth-service, so users maintain session across redirects.
3. **Data Access**: Ordering service queries other services via REST APIs when needed (e.g., rider details for display).
4. **Events**: Services communicate via NATS events for async operations (order status, delivery updates).

---

## References

- [Microservice Architecture](../../../docs/microservice-architecture.md)
- [Cross-Service Data Ownership](../../../docs/CROSS-SERVICE-DATA-OWNERSHIP.md)
- [Ordering Service Backend Plan](../ordering-backend/docs/plan.md)
- [Logistics Service Plan](../../../logistics-service/logistics-api/plan.md)
- [POS Service Plan](../../../pos-service/pos-api/plan.md)

