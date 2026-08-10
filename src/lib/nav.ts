export interface Module {
  href: string;
  label: string;
  icon: string;
  description: string;
}

// Single source of truth for the app's modules — drives the desktop sidebar,
// the mobile bottom tab bar (via MOBILE_TABS), and the home page grid.
export const MODULES: Module[] = [
  {
    href: '/morning',
    label: 'Morning',
    icon: '/icon-morning.svg',
    description: 'Track your weight, walks, and morning routine.'
  },
  {
    href: '/exercise',
    label: 'Exercise',
    icon: '/icon-exercise.svg',
    description: '7-day workout rotation with detailed exercise guides.'
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: '/icon-analytics.svg',
    description: 'Progress charts for workouts, walks, and health data.'
  },
  {
    href: '/meal-prep',
    label: 'Meal Prep',
    icon: '/icon-meal-prep.svg',
    description: 'Heart-healthy weekly meal plan and grocery list.'
  },
  {
    href: '/shopping',
    label: 'Shopping',
    icon: '/icon-shopping.svg',
    description: 'Kanban-style shopping list with drag-and-drop.'
  },
  {
    href: '/games',
    label: 'Games',
    icon: '/icon-games.svg',
    description: 'Tier list for ranking your video game collection.'
  },
  {
    href: '/media',
    label: 'Media',
    icon: '/icon-media.svg',
    description: 'Tier list for ranking TV series and movies.'
  },
  {
    href: '/tasks',
    label: 'Tasks',
    icon: '/icon-tasks.svg',
    description: 'Kanban-style task management with drag-and-drop.'
  },
  {
    href: '/retirement',
    label: 'Retirement',
    icon: '/icon-retirement.svg',
    description: 'Retirement projections powered by the Argent engine.'
  }
];

// Daily-driver modules pinned to the mobile bottom tab bar (plus Home).
// Everything else is reachable from the home grid.
export const MOBILE_TABS = ['/morning', '/exercise', '/tasks'];

export function isActive(href: string, currentPath: string): boolean {
  if (href === '/') return currentPath === '/';
  return currentPath.startsWith(href);
}
