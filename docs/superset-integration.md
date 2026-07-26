# Ordering Frontend - Apache Superset Integration

## Overview

The Ordering Frontend integrates with the centralized Apache Superset instance for BI dashboards and analytics. Superset is deployed as a centralized service accessible to all Codevertex services.

**Superset URL**: `https://superset.codevertexafrica.com`

---

## Architecture

### Service Configuration

**Environment Variables**:
- `NEXT_PUBLIC_SUPERSET_URL` - Superset service URL (default: `https://superset.codevertexafrica.com`)
- `NEXT_PUBLIC_API_URL` - Ordering backend API URL

**Authentication**:
- All Superset operations are proxied through the ordering backend
- Frontend NEVER communicates directly with Superset
- Guest tokens generated server-side by backend for security
- JWT tokens passed to backend for user authentication

---

## Integration Methods

### 1. Backend API Client

The ordering frontend consumes analytics endpoints from the ordering backend, which handles all Superset communication.

**Base Configuration**:
- Base URL: `NEXT_PUBLIC_API_URL` (ordering backend)
- Authentication: Bearer token (JWT from auth-service)
- All Superset operations proxied through backend

**Key Frontend API Endpoints**:

**Dashboard Endpoints**:
- `GET /api/v1/{tenant}/analytics/dashboards` - List available dashboards
- `GET /api/v1/{tenant}/analytics/dashboards/{module}` - Get dashboard info
- `GET /api/v1/{tenant}/analytics/dashboards/{module}/embed` - Get embed URL with guest token
- `GET /api/v1/{tenant}/analytics/status` - Check analytics service status

**Dashboard Modules**:
- `orders` - Order Analytics Dashboard
- `revenue` - Revenue Dashboard
- `customers` - Customer Analytics Dashboard
- `operations` - Operations Dashboard
- `subscription` - Subscription Dashboard (if applicable)

---

## Frontend Implementation

### 2. Superset SDK Integration

**Install Dependencies**:
```bash
pnpm add @superset-ui/embedded-sdk
# or
pnpm add @superset-ui/embedded-sdk
```

### 3. React Components

#### SupersetDashboard Component

**Location**: `src/components/dashboard/analytics/superset-dashboard.tsx`

```typescript
'use client';

import { embedDashboard } from '@superset-ui/embedded-sdk';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/primitives/alert';

interface SupersetDashboardProps {
  module: 'orders' | 'revenue' | 'customers' | 'operations' | 'subscription';
  tenantId: string;
  height?: string;
  className?: string;
}

export function SupersetDashboard({
  module,
  tenantId,
  height = '800px',
  className = '',
}: SupersetDashboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);

  // Fetch embed URL with guest token from backend
  const { data: embedData, isLoading, error: fetchError } = useQuery({
    queryKey: ['dashboard-embed', tenantId, module],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/${tenantId}/analytics/dashboards/${module}/embed`,
        {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`, // From auth context
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard embed URL');
      }

      return response.json() as Promise<{
        module: string;
        url: string;
        token: string;
        expires_at: string;
      }>;
    },
    refetchInterval: 4 * 60 * 1000, // Refresh token every 4 minutes (before 5-minute expiry)
    staleTime: 3 * 60 * 1000, // Consider stale after 3 minutes
  });

  useEffect(() => {
    if (!embedData || !containerRef.current || isEmbedded) return;

    const embed = async () => {
      try {
        await embedDashboard({
          id: extractDashboardId(embedData.url), // Extract dashboard ID from URL
          supersetDomain: process.env.NEXT_PUBLIC_SUPERSET_URL!,
          mountPoint: containerRef.current!,
          fetchGuestToken: () => Promise.resolve(embedData.token),
          dashboardUiConfig: {
            hideTitle: false,
            hideChartControls: false,
            hideTab: false,
          },
        });
        setIsEmbedded(true);
        setError(null);
      } catch (err) {
        console.error('Failed to embed dashboard:', err);
        setError('Failed to load dashboard. Please try again.');
      }
    };

    embed();
  }, [embedData, isEmbedded]);

  // Handle errors
  if (fetchError || error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || 'Failed to load dashboard. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`superset-dashboard ${className}`}
      style={{ height }}
    />
  );
}

// Helper to extract dashboard ID from embed URL
function extractDashboardId(url: string): string {
  const match = url.match(/\/embedded\/(\d+)\//);
  return match ? match[1] : '';
}

// Helper to get access token (implement based on your auth setup)
function getAccessToken(): string {
  // TODO: Implement based on your auth context/store
  return localStorage.getItem('access_token') || '';
}
```

#### useSupersetAuth Hook

**Location**: `src/hooks/use-superset-auth.ts`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';

interface DashboardEmbedData {
  module: string;
  url: string;
  token: string;
  expires_at: string;
}

export function useSupersetAuth(tenantId: string, module: string) {
  return useQuery({
    queryKey: ['dashboard-embed', tenantId, module],
    queryFn: async (): Promise<DashboardEmbedData> => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/${tenantId}/analytics/dashboards/${module}/embed`,
        {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard embed URL');
      }

      return response.json();
    },
    refetchInterval: 4 * 60 * 1000, // Refresh every 4 minutes
    staleTime: 3 * 60 * 1000, // Consider stale after 3 minutes
  });
}

function getAccessToken(): string {
  // TODO: Implement based on your auth setup
  return localStorage.getItem('access_token') || '';
}
```

#### Dashboard List Component

**Location**: `src/components/dashboard/analytics/dashboard-list.tsx`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/primitives/card';
import { Button } from '@/components/primitives/button';
import { BarChart3, DollarSign, Users, Activity, CreditCard } from 'lucide-react';
import Link from 'next/link';

const DASHBOARD_ICONS = {
  orders: BarChart3,
  revenue: DollarSign,
  customers: Users,
  operations: Activity,
  subscription: CreditCard,
} as const;

interface Dashboard {
  id: number;
  module: string;
  title: string;
  description: string;
  url: string;
}

export function DashboardList({ tenantId }: { tenantId: string }) {
  const { data: dashboards, isLoading } = useQuery({
    queryKey: ['dashboards', tenantId],
    queryFn: async (): Promise<Dashboard[]> => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/${tenantId}/analytics/dashboards`,
        {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch dashboards');
      }

      return response.json();
    },
  });

  if (isLoading) {
    return <div>Loading dashboards...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {dashboards?.map((dashboard) => {
        const Icon = DASHBOARD_ICONS[dashboard.module as keyof typeof DASHBOARD_ICONS] || BarChart3;
        return (
          <Card key={dashboard.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                <CardTitle>{dashboard.title}</CardTitle>
              </div>
              <CardDescription>{dashboard.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={`/dashboard/analytics/${dashboard.module}`}>
                  View Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function getAccessToken(): string {
  return localStorage.getItem('access_token') || '';
}
```

---

## Page Implementation

### Analytics Dashboard Hub

**Location**: `src/app/dashboard/analytics/page.tsx`

```typescript
import { DashboardList } from '@/components/dashboard/analytics/dashboard-list';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics | Dashboard',
  description: 'View analytics dashboards and reports',
};

export default function AnalyticsPage() {
  // TODO: Get tenant ID from auth context/session
  const tenantId = 'your-tenant-id';

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          View comprehensive analytics dashboards for your ordering platform
        </p>
      </div>

      <DashboardList tenantId={tenantId} />
    </div>
  );
}
```

### Individual Dashboard Page

**Location**: `src/app/dashboard/analytics/[module]/page.tsx`

```typescript
import { SupersetDashboard } from '@/components/dashboard/analytics/superset-dashboard';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

const VALID_MODULES = ['orders', 'revenue', 'customers', 'operations', 'subscription'] as const;

type DashboardModule = typeof VALID_MODULES[number];

interface PageProps {
  params: {
    module: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const titles: Record<DashboardModule, string> = {
    orders: 'Order Analytics',
    revenue: 'Revenue Dashboard',
    customers: 'Customer Analytics',
    operations: 'Operations Dashboard',
    subscription: 'Subscription Dashboard',
  };

  return {
    title: `${titles[params.module as DashboardModule] || 'Analytics'} | Dashboard`,
  };
}

export default function DashboardModulePage({ params }: PageProps) {
  // Validate module
  if (!VALID_MODULES.includes(params.module as DashboardModule)) {
    notFound();
  }

  // TODO: Get tenant ID from auth context/session
  const tenantId = 'your-tenant-id';

  return (
    <div className="container mx-auto py-6">
      <SupersetDashboard
        module={params.module as DashboardModule}
        tenantId={tenantId}
        height="calc(100vh - 200px)"
        className="rounded-lg border shadow-sm"
      />
    </div>
  );
}
```

---

## Security Considerations

### Authentication & Authorization

- Frontend never receives Superset admin credentials
- Guest tokens generated server-side with Row-Level Security (RLS)
- Guest tokens expire after 5 minutes and are automatically refreshed
- JWT tokens validated by backend before issuing guest tokens
- All requests authenticated via Bearer token

### Data Privacy

- Row-Level Security (RLS) ensures tenant data isolation
- Each tenant sees only their own data via RLS clauses
- Sensitive data masked in dashboards
- No PII data exposed in embedded dashboards

### Content Security Policy (CSP)

Add Superset domain to CSP headers in `next.config.js`:

```javascript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      frame-src 'self' https://superset.codevertexafrica.com;
      connect-src 'self' https://superset.codevertexafrica.com ${process.env.NEXT_PUBLIC_API_URL};
    `.replace(/\s{2,}/g, ' ').trim()
  }
];
```

---

## Error Handling

### Frontend Error Handling

**Dashboard Load Failures**:
- Display user-friendly error message
- Provide retry button
- Log error for debugging

**Network Errors**:
- Automatic retry with exponential backoff via TanStack Query
- Fallback to error state after 3 retries

**Authentication Errors**:
- Redirect to login if token expired
- Refresh token automatically if available

**Example Error Boundary**:

```typescript
'use client';

import { Component, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/primitives/alert';
import { Button } from '@/components/primitives/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard. Please try again.
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="ml-4"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}
```

---

## Testing Strategy

### Unit Tests

**Component Tests** (`superset-dashboard.test.tsx`):
```typescript
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SupersetDashboard } from './superset-dashboard';

const queryClient = new QueryClient();

describe('SupersetDashboard', () => {
  it('renders loading state initially', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SupersetDashboard module="orders" tenantId="test-tenant" />
      </QueryClientProvider>
    );

    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('renders error state on fetch failure', async () => {
    // Mock failed API call
    // ... test implementation
  });
});
```

### Integration Tests

- Test full dashboard embedding flow
- Test token refresh mechanism
- Test error handling and retry logic

---

## Deliverables

- [x] Superset integration documentation
- [ ] SupersetDashboard React component
- [ ] useSupersetAuth custom hook
- [ ] Dashboard list component
- [ ] Analytics hub page
- [ ] Individual dashboard pages
- [ ] Error boundary implementation
- [ ] Unit tests for components
- [ ] Integration tests
- [ ] CSP configuration

---

## Dependencies

- Backend analytics API (Sprint 7 - ordering-backend)
- Superset instance (https://superset.codevertexafrica.com)
- @superset-ui/embedded-sdk package
- TanStack Query for data fetching
- Auth service for JWT tokens

---

## References

- [Apache Superset Embedded SDK](https://superset.apache.org/docs/installation/embedded-sdk)
- [Backend Superset Integration](../../ordering-backend/docs/superset-integration.md)
- [TruLoad Superset Integration](../../../TruLoad/truload-frontend/docs/integration.md)
