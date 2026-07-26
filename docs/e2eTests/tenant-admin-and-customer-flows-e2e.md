# Tenant Admin and Customer Flows E2E

**Last updated:** March 2026  
**Specs:** [TRINITY-AUTHORIZATION-PATTERN.md](../../../shared-docs/TRINITY-AUTHORIZATION-PATTERN.md), [sso-integration-guide.md](../../../shared-docs/sso-integration-guide.md)  
**Status:** Documented; E2E specs to be extended

## Overview

Validates that tenant admin and customer roles see the correct dashboard and sidebar/nav items after SSO login on ordering-frontend. Tenant admin: org settings, subscription, staff; customer: menu, order history, profile only.

## Preconditions

- Ordering-frontend deployed at `ordering.codevertexafrica.com`
- Seeded users: tenant admin `admin@theurbanloftcafe.com`, customer (or demo user with member role)
- Auth-api and subscription-api reachable

## Planned Scenarios

### Tenant admin

- Log in via SSO from ordering-frontend (tenant `urban-loft`)
- After callback, assert redirect to dashboard or admin area
- Assert sidebar/nav shows: configuration, outlets, staff, analytics (where implemented)
- Assert admin-only routes are accessible (not 403)

### Customer

- Log in via SSO as customer/member
- Assert redirect to customer-facing dashboard (menu/orders), not admin console
- Assert admin-only nav items are absent

## Test File

To be added: `ordering-frontend/e2e/tenant-admin-customer-flows.spec.ts` (or merged into existing ordering specs with role-based projects).

## Current Status

- **Pass/Fail:** Not yet implemented; placeholder doc for backlog.
- **Notes:** Depends on stable SSO callback and subscription gating; implement after ordering-login-and-landing and subscription-api E2E are green.
