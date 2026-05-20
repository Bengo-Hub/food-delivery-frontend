'use client';

import { useDiningModeStore } from '@/store/dining-mode';

// Maps outlet use_case to the modules visible in the ordering-frontend UI.
// Add new module keys here when new use-case-specific pages are built.
const USE_CASE_MODULES: Record<string, string[]> = {
  hospitality:   ['catalog', 'cart', 'checkout', 'orders', 'tables', 'reservations', 'group_orders', 'loyalty'],
  quick_service: ['catalog', 'cart', 'checkout', 'orders', 'group_orders'],
  retail:        ['catalog', 'cart', 'checkout', 'orders', 'loyalty'],
  pharmacy:      ['catalog', 'cart', 'checkout', 'orders'],
  services:      ['catalog', 'cart', 'checkout', 'orders', 'reservations', 'appointments'],
  delivery:      ['catalog', 'cart', 'checkout', 'orders', 'delivery'],
};

/**
 * Returns whether the given module key is accessible for the current outlet's use_case.
 * Use this to conditionally render use-case-specific UI elements.
 *
 * @example
 * const { hasModule } = useModuleAccess();
 * if (!hasModule('tables')) return null;
 */
export function useModuleAccess() {
  const tenantUseCase = useDiningModeStore((s) => s.tenantUseCase);

  function hasModule(key: string): boolean {
    const uc = tenantUseCase ?? 'hospitality';
    const modules = USE_CASE_MODULES[uc] ?? USE_CASE_MODULES.hospitality;
    return modules.includes(key);
  }

  return { hasModule, useCase: tenantUseCase };
}
