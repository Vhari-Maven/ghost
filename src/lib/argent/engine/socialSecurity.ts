import {
	AIME_YEARS,
	FULL_RETIREMENT_AGE,
	PIA_BEND_1_CENTS,
	PIA_BEND_2_CENTS,
	PIA_RATES,
	SS_DELAYED_CREDIT_PER_MONTH,
	SS_EARLY_REDUCTION_BEYOND,
	SS_EARLY_REDUCTION_FIRST_36,
	SS_WAGE_BASE_CENTS,
} from './constants';
import type { EarningsYearInput } from './types';

/**
 * PIA in today's dollars, computed from the covered-earnings record plus
 * projected earnings through separation.
 *
 * Simplification (documented in SPEC.md): instead of the official AWI
 * indexing to the age-60 year, all earnings are indexed to *today* using
 * `wageIndexRate` as a uniform wage-growth proxy, and today's bend points
 * are applied. The result is a today's-dollars PIA that the projection
 * COLA-inflates forward.
 */
export function piaTodayMonthlyCents(args: {
	earningsHistory: EarningsYearInput[];
	currentYear: number;
	currentSalaryCents: number;
	wageGrowthRate: number; // projected salary growth until separation
	wageIndexRate: number; // indexing proxy for past earnings
	separationYear: number;
}): number {
	const {
		earningsHistory,
		currentYear,
		currentSalaryCents,
		wageGrowthRate,
		wageIndexRate,
		separationYear,
	} = args;

	const indexed: number[] = [];

	// Past (and current-year) covered earnings from the SSA record, indexed
	// to today. SSA amounts are already capped at each year's wage base.
	for (const { year, earningsCents } of earningsHistory) {
		if (year > currentYear) continue;
		const factor = (1 + wageIndexRate) ** (currentYear - year);
		indexed.push(earningsCents * factor);
	}

	// Projected years from next year through the final working year
	// (separation year is not worked — see retirement-age convention).
	for (let year = currentYear + 1; year < separationYear; year++) {
		const salary =
			currentSalaryCents * (1 + wageGrowthRate) ** (year - currentYear);
		const capped = Math.min(
			salary,
			SS_WAGE_BASE_CENTS * (1 + wageIndexRate) ** (year - currentYear),
		);
		// Deflate back to today with the same index → in today's terms a
		// projected year contributes salary deflated by wage growth vs index.
		indexed.push(capped / (1 + wageIndexRate) ** (year - currentYear));
	}

	indexed.sort((a, b) => b - a);
	const top = indexed.slice(0, AIME_YEARS);
	const totalCents = top.reduce((s, x) => s + x, 0);
	const aimeMonthlyCents = totalCents / (AIME_YEARS * 12);

	let pia = 0;
	pia += Math.min(aimeMonthlyCents, PIA_BEND_1_CENTS) * PIA_RATES[0];
	if (aimeMonthlyCents > PIA_BEND_1_CENTS) {
		pia +=
			(Math.min(aimeMonthlyCents, PIA_BEND_2_CENTS) - PIA_BEND_1_CENTS) *
			PIA_RATES[1];
	}
	if (aimeMonthlyCents > PIA_BEND_2_CENTS) {
		pia += (aimeMonthlyCents - PIA_BEND_2_CENTS) * PIA_RATES[2];
	}
	return Math.round(pia);
}

/** Multiplier applied to PIA for claiming at `claimAge` (FRA 67). */
export function claimingFactor(claimAge: number): number {
	const monthsFromFra = Math.round((claimAge - FULL_RETIREMENT_AGE) * 12);
	if (monthsFromFra === 0) return 1;
	if (monthsFromFra < 0) {
		const early = -monthsFromFra;
		const first36 = Math.min(early, 36);
		const beyond = Math.max(0, early - 36);
		return (
			1 -
			first36 * SS_EARLY_REDUCTION_FIRST_36 -
			beyond * SS_EARLY_REDUCTION_BEYOND
		);
	}
	return 1 + monthsFromFra * SS_DELAYED_CREDIT_PER_MONTH;
}
