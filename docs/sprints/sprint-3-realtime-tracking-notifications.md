# Sprint 3 - Real-Time Tracking & Notifications

**Duration**: Weeks 6-7  
**Status**: ⏳ Not Started

---

## Overview

Sprint 3 focuses on implementing real-time order tracking, WebSocket integration for live updates, and notification preferences management.

---

## Objectives

1. Live order status timeline
2. WebSocket integration
3. Notification preferences
4. Service worker push support
5. Delivery tracking with map
6. Driver location updates

---

## Technology Stack

### Real-Time Communication
- **WebSocket**: Real-time order updates
- **SSE**: Server-Sent Events for notifications
- **Libraries**: Native WebSocket API or Socket.io client

### Notifications
- **Service Worker**: Push notifications
- **PWA**: Progressive Web App features
- **Browser APIs**: Notification API, Push API

### Maps
- **Maps**: Leaflet with React Leaflet
- **Real-Time Updates**: WebSocket location stream
- **Routing**: Mapbox Directions API

---

## User Stories

### US-F3.1: Order Tracking
**As a** customer  
**I want** to track my order in real-time  
**So that** I know when it will arrive

**Acceptance Criteria**:
- [ ] Order status timeline
- [ ] Real-time status updates
- [ ] ETA display
- [ ] Status change notifications
- [ ] Order history

### US-F3.2: Live Driver Tracking
**As a** customer  
**I want** to see my driver's location  
**So that** I can track delivery progress

**Acceptance Criteria**:
- [ ] Map display with driver location (from logistics-service WebSocket stream)
- [ ] Real-time location updates (consume logistics-service location stream)
- [ ] Route visualization (using logistics-service route data)
- [ ] ETA calculation (from logistics-service)
- [ ] Driver information display (query logistics-service API: `GET /v1/{tenant}/fleet-members/{id}`)
- **Note**: All driver/rider data comes from logistics-service, not ordering-backend

### US-F3.3: WebSocket Integration
**As a** customer  
**I want** real-time updates  
**So that** I see changes immediately

**Acceptance Criteria**:
- [ ] WebSocket connection management
- [ ] Automatic reconnection
- [ ] Message handling
- [ ] Connection status indicator
- [ ] Error handling

### US-F3.4: Push Notifications
**As a** customer  
**I want** push notifications  
**So that** I'm notified of order updates

**Acceptance Criteria**:
- [ ] Service worker registration
- [ ] Push notification subscription
- [ ] Notification display
- [ ] Notification click handling
- [ ] Notification preferences

### US-F3.5: Notification Preferences
**As a** user  
**I want** to manage notification preferences  
**So that** I receive only relevant notifications

**Acceptance Criteria**:
- [ ] Preference management UI
- [ ] Channel selection (email, SMS, push)
- [ ] Event type subscriptions
- [ ] Preference persistence
- [ ] Preference sync

---

## Component Structure

### Tracking Components

**Order Tracking Page** (`src/app/orders/[id]/track/page.tsx`):
- Order status timeline
- Map with driver location
- Order details
- Contact driver button

**Tracking Components** (`src/components/tracking/`):
- `order-timeline.tsx` - Status timeline component
- `driver-map.tsx` - Map with driver location
- `eta-display.tsx` - ETA display component
- `driver-info.tsx` - Driver information card

**Notification Components** (`src/components/notifications/`):
- `notification-center.tsx` - Notification list
- `notification-item.tsx` - Individual notification
- `notification-preferences.tsx` - Preferences management

---

## State Management

### Tracking Store (Zustand)

**State**:
- `activeOrders` - Active orders being tracked
- `driverLocations` - Driver location map
- `orderStatuses` - Order status map
- `websocketConnected` - WebSocket connection status

**Actions**:
- `addOrder` - Start tracking order
- `updateOrderStatus` - Update order status
- `updateDriverLocation` - Update driver location
- `setWebSocketStatus` - Set connection status

### Notification Store (Zustand)

**State**:
- `notifications` - Notification list
- `unreadCount` - Unread notification count
- `preferences` - Notification preferences

**Actions**:
- `addNotification` - Add notification
- `markAsRead` - Mark notification as read
- `clearNotifications` - Clear all notifications
- `updatePreferences` - Update preferences

---

## API Integration

### WebSocket Connection

**Connection**:
- `ws://api.example.com/ws/orders/{id}/tracking` - Order tracking stream
- `ws://api.example.com/ws/notifications` - Notification stream

**Message Types**:
- `order.status.changed` - Order status update
- `driver.location.updated` - Driver location update
- `order.eta.updated` - ETA update
- `notification.new` - New notification

### Order Tracking API

**Endpoints**:
- `GET /api/v1/{tenant}/orders/{id}` - Get order details
- `GET /api/v1/{tenant}/orders/{id}/tracking` - Get tracking data

**TanStack Query Hooks**:
- `useOrder` - Fetch order details
- `useOrderTracking` - Fetch tracking data

### Notification API

**Endpoints**:
- `GET /api/v1/{tenant}/notifications` - List notifications
- `PUT /api/v1/{tenant}/notifications/{id}/read` - Mark as read
- `GET /api/v1/{tenant}/notification-preferences` - Get preferences
- `PUT /api/v1/{tenant}/notification-preferences` - Update preferences

**TanStack Query Hooks**:
- `useNotifications` - Fetch notifications
- `useMarkAsRead` - Mark as read mutation
- `useNotificationPreferences` - Fetch preferences
- `useUpdatePreferences` - Update preferences mutation

---

## Service Worker

### Registration

**Service Worker Setup**:
- Register service worker on app load
- Handle service worker updates
- Manage push subscription

### Push Notifications

**Push Subscription**:
- Request notification permission
- Subscribe to push service
- Send subscription to backend
- Handle push messages

### Background Sync

**Background Tasks**:
- Sync failed API requests
- Cache order data
- Offline support

---

## Testing Strategy

### Unit Tests
- WebSocket client tests
- Notification component tests
- Tracking component tests
- Service worker tests

### Integration Tests
- End-to-end tracking flow
- WebSocket connection and reconnection
- Push notification flow
- Notification preferences flow

---

## Deliverables

- [ ] Live order status timeline
- [ ] WebSocket integration
- [ ] Driver location tracking
- [ ] Map integration with real-time updates
- [ ] Push notification support
- [ ] Service worker implementation
- [ ] Notification preferences UI
- [ ] Notification center
- [ ] Error handling and reconnection
- [ ] Unit tests
- [ ] Integration tests

---

## Dependencies

- Backend order tracking API (Sprint 5)
- Backend WebSocket support
- Backend notification API (Sprint 6)
- Logistics service for driver tracking (all driver/rider data from logistics-service, ordering-backend only provides order context)

---

## Next Steps

- Sprint 4: Cafe Dashboard
  - Order queue management
  - Kitchen display mode
  - Menu management
  - Operations analytics

