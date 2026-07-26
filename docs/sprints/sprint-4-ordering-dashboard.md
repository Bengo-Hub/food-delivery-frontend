# Sprint 4 - Cafe Dashboard

**Duration**: Weeks 8-9  
**Status**: ⏳ Not Started

---

## Overview

Sprint 4 focuses on building the cafe administrator dashboard with order management, kitchen display, menu management, and operations analytics.

---

## Objectives

1. Order queue management
2. Kitchen display mode
3. Menu management UI
4. Operations analytics
5. Staff management
6. Settings and configuration

---

## Technology Stack

### Dashboard Framework
- **Charts**: Recharts or Chart.js
- **Tables**: TanStack Table
- **Data Grid**: Advanced data grid for orders

### Real-Time Updates
- **WebSocket**: Live order updates
- **SSE**: Server-Sent Events for status changes
- **Polling**: Fallback for order status

### State Management
- **Server State**: TanStack Query
- **Client State**: Zustand
- **Form State**: React Hook Form

---

## User Stories

### US-F4.1: Order Queue
**As a** cafe administrator  
**I want** to manage the order queue  
**So that** I can process orders efficiently

**Acceptance Criteria**:
- [ ] Order list with filters
- [ ] Order status updates
- [ ] Order assignment
- [ ] Order cancellation
- [ ] Real-time updates
- [ ] Search and filtering

### US-F4.2: Kitchen Display
**As a** kitchen staff  
**I want** a kitchen display system  
**So that** I can see orders to prepare

**Acceptance Criteria**:
- [ ] Kitchen display mode
- [ ] Order grouping by station
- [ ] Prep time tracking
- [ ] Order completion marking
- [ ] Large screen optimization

### US-F4.3: Menu Management
**As a** cafe administrator  
**I want** to manage the menu  
**So that** I can update offerings

**Acceptance Criteria**:
- [ ] Menu item CRUD
- [ ] Category management
- [ ] Image upload
- [ ] Pricing management
- [ ] Availability toggling
- [ ] Bulk operations

### US-F4.4: Operations Analytics
**As a** cafe administrator  
**I want** to view operations analytics  
**So that** I can make data-driven decisions

**Acceptance Criteria**:
- [ ] Revenue charts
- [ ] Order volume charts
- [ ] Popular items analysis
- [ ] Peak hours analysis
- [ ] Performance metrics
- [ ] Export functionality

### US-F4.5: Staff Management
**As a** cafe administrator  
**I want** to manage staff  
**So that** I can control access

**Acceptance Criteria**:
- [ ] Staff list
- [ ] Staff invitation
- [ ] Role assignment
- [ ] Permission management
- [ ] Staff activity logs

### US-F4.6: Settings
**As a** cafe administrator  
**I want** to configure cafe settings  
**So that** I can customize operations

**Acceptance Criteria**:
- [ ] Cafe profile settings
- [ ] Operating hours
- [ ] Delivery settings
- [ ] Notification settings
- [ ] Integration settings

---

## Component Structure

### Dashboard Pages

**Dashboard** (`src/app/dashboard/staff/page.tsx`):
- Main dashboard overview
- Key metrics display
- Quick actions

**Order Management** (`src/app/dashboard/orders/page.tsx`):
- Order queue
- Order filters
- Order actions

**Kitchen Display** (`src/app/dashboard/kitchen/page.tsx`):
- Kitchen display mode
- Order grouping
- Prep tracking

**Menu Management** (`src/app/dashboard/menu/page.tsx`):
- Menu item list
- Category management
- Item editor

**Analytics** (`src/app/dashboard/analytics/page.tsx`):
- Analytics charts
- Reports
- Export options

**Settings** (`src/app/dashboard/settings/page.tsx`):
- Cafe settings
- Staff management
- Integrations

### Dashboard Components

**Order Components** (`src/components/dashboard/orders/`):
- `order-queue.tsx` - Order list
- `order-card.tsx` - Order card component
- `order-filters.tsx` - Filter component
- `order-actions.tsx` - Action buttons

**Kitchen Components** (`src/components/dashboard/kitchen/`):
- `kitchen-display.tsx` - Kitchen display
- `kitchen-ticket.tsx` - Kitchen ticket
- `prep-timer.tsx` - Prep time tracker

**Menu Components** (`src/components/dashboard/menu/`):
- `menu-editor.tsx` - Menu item editor
- `category-manager.tsx` - Category management
- `image-uploader.tsx` - Image upload

**Analytics Components** (`src/components/dashboard/analytics/`):
- `revenue-chart.tsx` - Revenue chart
- `order-volume-chart.tsx` - Order volume chart
- `popular-items.tsx` - Popular items list

---

## State Management

### Dashboard Store (Zustand)

**State**:
- `selectedCafe` - Currently selected cafe
- `orderFilters` - Active order filters
- `kitchenMode` - Kitchen display mode
- `refreshInterval` - Auto-refresh interval

**Actions**:
- `setCafe` - Select cafe
- `setFilters` - Set order filters
- `toggleKitchenMode` - Toggle kitchen display
- `setRefreshInterval` - Set auto-refresh

---

## API Integration

### Order Management API

**Endpoints**:
- `GET /api/v1/{tenant}/orders` - List orders
- `GET /api/v1/{tenant}/orders/{id}` - Get order details
- `PUT /api/v1/{tenant}/orders/{id}/status` - Update status
- `POST /api/v1/{tenant}/orders/{id}/cancel` - Cancel order

**TanStack Query Hooks**:
- `useOrders` - Fetch orders
- `useUpdateOrderStatus` - Update status mutation
- `useCancelOrder` - Cancel order mutation

### Menu Management API

**Endpoints**:
- `GET /api/v1/{tenant}/catalog/items` - List items
- `POST /api/v1/{tenant}/catalog/items` - Create item
- `PUT /api/v1/{tenant}/catalog/items/{id}` - Update item
- `DELETE /api/v1/{tenant}/catalog/items/{id}` - Delete item

**TanStack Query Hooks**:
- `useMenuItems` - Fetch items
- `useCreateMenuItem` - Create item mutation
- `useUpdateMenuItem` - Update item mutation
- `useDeleteMenuItem` - Delete item mutation

### Analytics API

**Endpoints**:
- `GET /api/v1/{tenant}/analytics/revenue` - Revenue data
- `GET /api/v1/{tenant}/analytics/orders` - Order analytics
- `GET /api/v1/{tenant}/analytics/items` - Item analytics

**TanStack Query Hooks**:
- `useRevenueAnalytics` - Fetch revenue data
- `useOrderAnalytics` - Fetch order analytics
- `useItemAnalytics` - Fetch item analytics

### Superset Integration

**Dashboard Embedding** (Comprehensive Implementation):
- **Component**: `SupersetDashboard` - React component for embedding dashboards
- **Hook**: `useSupersetAuth` - Custom hook for guest token management
- **Guest Token Management**: Automatic refresh every 4 minutes (before 5-min expiry)
- **Row-Level Security**: Tenant-based data isolation via RLS clauses
- **Dashboard Modules**: orders, revenue, customers, operations, subscription
- **Security**: All Superset operations proxied through backend, no direct frontend access
- **Error Handling**: Comprehensive error boundaries with retry logic
- **Loading States**: Skeleton loaders and loading indicators
- **Responsive Design**: Adaptive height and mobile optimization

**Implementation Files**:
- `src/components/dashboard/analytics/superset-dashboard.tsx` - Main dashboard component
- `src/components/dashboard/analytics/dashboard-list.tsx` - Dashboard hub component
- `src/hooks/use-superset-auth.ts` - Authentication hook
- `src/app/dashboard/analytics/page.tsx` - Analytics hub page
- `src/app/dashboard/analytics/[module]/page.tsx` - Individual dashboard pages

**Dependencies**:
- `@superset-ui/embedded-sdk` - Official Superset embedding SDK
- Backend analytics API at `/api/v1/{tenant}/analytics/dashboards`
- Superset instance at `https://superset.codevertexafrica.com`

**Documentation**:
- See [Superset Integration Guide](../superset-integration.md) for detailed implementation

---

## Testing Strategy

### Unit Tests
- Dashboard component tests
- Order management tests
- Menu editor tests
- Analytics chart tests

### Integration Tests
- End-to-end order management flow
- Menu management flow
- Analytics dashboard flow
- Settings configuration flow

---

## Deliverables

- [ ] Order queue management
- [ ] Kitchen display mode
- [ ] Menu management UI
- [ ] Operations analytics
- [ ] Staff management
- [ ] Settings and configuration
- [ ] Real-time updates
- [ ] Superset dashboard integration
- [ ] Responsive design
- [ ] Unit tests
- [ ] Integration tests

---

## Dependencies

- Backend order management API (Sprint 3)
- Backend menu management API (Sprint 2)
- Backend analytics API (Sprint 7)
- Superset integration (Sprint 7)

---

## Next Steps

- Post-launch optimizations
- Feature enhancements
- User feedback integration
- Performance improvements

