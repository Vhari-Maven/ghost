export function formatCents(cents: number): string {
	return (cents / 100).toLocaleString('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	});
}

export function formatPct(fraction: number): string {
	return `${(fraction * 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}%`;
}

/**
 * "1,234.56" (dollars) → 123400 cents. Returns null on garbage.
 * Amounts are stored penny-free: entry rounds to the nearest dollar.
 */
export function parseDollarsToCents(raw: string): number | null {
	const cleaned = raw.replace(/[$,\s]/g, '');
	if (cleaned === '') return null;
	const value = Number(cleaned);
	if (!Number.isFinite(value)) return null;
	return Math.round(value) * 100;
}

/** Cents → whole-dollar input text with thousands commas ("1,234"). */
export function centsToDollarsInput(cents: number): string {
	return Math.round(cents / 100).toLocaleString('en-US');
}

/** "2.5" (percent) → 0.025. Returns null on garbage. */
export function parsePctToFraction(raw: string): number | null {
	const cleaned = raw.replace(/[%\s]/g, '');
	if (cleaned === '') return null;
	const value = Number(cleaned);
	if (!Number.isFinite(value)) return null;
	return value / 100;
}
