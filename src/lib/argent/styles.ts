// Shared Tailwind class strings for the /retirement pages (ghost design
// language — see DESIGN.md). Centralized so the four pages can't drift.
//
// Two input treatments: `input` is for controls sitting directly on the page;
// `inputOnCard` is for controls inside a surface-colored card or table, where
// it swaps to the page background so the field still reads as recessed.

export const input =
	'bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-2.5 py-1.5 text-[var(--color-text)] outline-none focus:border-[var(--color-accent)] transition-colors';

export const inputOnCard =
	'bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text)] outline-none focus:border-[var(--color-accent)] transition-colors';

export const btn =
	'px-3 py-1.5 bg-[var(--color-accent)] text-white rounded text-sm font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

// Label wrapper for a stacked field-name + control pair.
export const field = 'flex flex-col gap-1 text-sm text-[var(--color-text-muted)]';

export const th = 'text-left py-2 px-3 text-[var(--color-text-muted)] font-medium';
export const td = 'py-2 px-3';

// Dense variants for the wide year-by-year projection table.
export const thDense =
	'text-left py-1.5 px-2.5 text-[var(--color-text-muted)] font-medium whitespace-nowrap';
export const tdDense = 'py-1.5 px-2.5 whitespace-nowrap';

export const num = 'text-right tabular-nums';

export const bodyRow = 'border-b border-[var(--color-border)] last:border-b-0';

export const banner =
	'py-3 px-4 bg-[var(--color-surface)] border border-[var(--color-border)] border-l-2 border-l-[var(--color-accent)] rounded-lg mb-4 text-sm flex flex-col gap-1';
