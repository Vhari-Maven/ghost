import {
	ADDITIONAL_MEDICARE_RATE,
	ADDITIONAL_MEDICARE_THRESHOLD_CENTS,
	FEDERAL_BRACKETS,
	LTCG_BRACKETS,
	MEDICARE_TAX_RATE,
	SS_TAX_RATE,
	SS_TAXABILITY_THRESHOLD_1_CENTS,
	SS_TAXABILITY_THRESHOLD_2_CENTS,
	SS_WAGE_BASE_CENTS,
	STANDARD_DEDUCTION_CENTS,
} from './constants';

// Bracket thresholds, the standard deduction, and the SS wage base are
// indexed forward from the constants year by `inflationFactor` (cumulative
// inflation since the constants year, 1.0 = today).

export function standardDeductionCents(inflationFactor: number): number {
	return Math.round(STANDARD_DEDUCTION_CENTS * inflationFactor);
}

/** Federal income tax on `taxableCents` (already net of the standard deduction). */
export function federalTaxCents(
	taxableCents: number,
	inflationFactor: number,
): number {
	if (taxableCents <= 0) return 0;
	let tax = 0;
	for (let i = 0; i < FEDERAL_BRACKETS.length; i++) {
		const lower = FEDERAL_BRACKETS[i].overCents * inflationFactor;
		const upper =
			i + 1 < FEDERAL_BRACKETS.length
				? FEDERAL_BRACKETS[i + 1].overCents * inflationFactor
				: Number.POSITIVE_INFINITY;
		if (taxableCents <= lower) break;
		tax += (Math.min(taxableCents, upper) - lower) * FEDERAL_BRACKETS[i].rate;
	}
	return Math.round(tax);
}

/** FICA (employee side) on wages. */
export function ficaCents(wageCents: number, inflationFactor: number): number {
	if (wageCents <= 0) return 0;
	const wageBase = SS_WAGE_BASE_CENTS * inflationFactor;
	const ss = Math.min(wageCents, wageBase) * SS_TAX_RATE;
	const medicare = wageCents * MEDICARE_TAX_RATE;
	// The additional-Medicare threshold is fixed in law, not indexed.
	const additional =
		Math.max(0, wageCents - ADDITIONAL_MEDICARE_THRESHOLD_CENTS) *
		ADDITIONAL_MEDICARE_RATE;
	return Math.round(ss + medicare + additional);
}

/**
 * Long-term capital gains + qualified dividends tax. Gains stack on top of
 * ordinary taxable income: each dollar of gain is taxed at the LTCG rate of
 * the total-income bracket it lands in. `ordinaryTaxableCents` is ordinary
 * income after the standard deduction (≥ 0).
 */
export function capitalGainsTaxCents(
	gainsCents: number,
	ordinaryTaxableCents: number,
	inflationFactor: number,
): number {
	if (gainsCents <= 0) return 0;
	const start = Math.max(0, ordinaryTaxableCents);
	const end = start + gainsCents;
	let tax = 0;
	for (let i = 0; i < LTCG_BRACKETS.length; i++) {
		const lower = LTCG_BRACKETS[i].overCents * inflationFactor;
		const upper =
			i + 1 < LTCG_BRACKETS.length
				? LTCG_BRACKETS[i + 1].overCents * inflationFactor
				: Number.POSITIVE_INFINITY;
		const from = Math.max(start, lower);
		const to = Math.min(end, upper);
		if (to > from) tax += (to - from) * LTCG_BRACKETS[i].rate;
	}
	return Math.round(tax);
}

/**
 * Taxable portion of Social Security benefits via the provisional-income
 * rules (single filer). Thresholds are fixed in law, not indexed.
 */
export function taxableSocialSecurityCents(
	ssBenefitCents: number,
	otherIncomeCents: number,
): number {
	if (ssBenefitCents <= 0) return 0;
	const provisional = otherIncomeCents + ssBenefitCents / 2;
	const t1 = SS_TAXABILITY_THRESHOLD_1_CENTS;
	const t2 = SS_TAXABILITY_THRESHOLD_2_CENTS;
	if (provisional <= t1) return 0;
	if (provisional <= t2) {
		return Math.round(Math.min(ssBenefitCents / 2, (provisional - t1) / 2));
	}
	const tier1 = Math.min(ssBenefitCents / 2, (t2 - t1) / 2);
	return Math.round(
		Math.min(0.85 * ssBenefitCents, 0.85 * (provisional - t2) + tier1),
	);
}
