/**
 * Build an org-scoped route path.
 * e.g., orgRoute("urban-loft", "/menu") → "/urban-loft/menu"
 */
export function orgRoute(orgSlug: string, path: string): string {
  return `/${orgSlug}${path.startsWith("/") ? path : `/${path}`}`;
}
