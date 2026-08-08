import {
	FERS_DEFERRED_COMMENCEMENT_AGE,
	FERS_MRA,
	FERS_MULTIPLIER,
	FERS_MULTIPLIER_62_20,
	SRS_SERVICE_DENOMINATOR,
} from './constants';
import type { FersDetermination } from './types';

/**
 * FERS "diet COLA" for one year, given the inflation assumption:
 * CPI ≤ 2% → CPI; 2–3% → 2%; > 3% → CPI − 1%.
 */
export function dietCola(inflationRate: number): number {
	if (inflationRate <= 0.02) return Math.max(0, inflationRate);
	if (inflationRate <= 0.03) return 0.02;
	return inflationRate - 0.01;
}

/**
 * Determine the FERS annuity from separation age + service.
 *
 * - Immediate unreduced: MRA+30, 60+20, or 62+5 → starts at separation;
 *   1.1% multiplier if 62+ with 20+ years; SRS payable until 62.
 * - Otherwise (incl. the MRA+10 window — we always defer, see SPEC.md):
 *   deferred annuity commencing at 62 with 5+ years, 1.0% multiplier,
 *   high-3 frozen in nominal terms at separation, no SRS.
 */
export function determineFers(args: {
	separationAge: number;
	serviceYears: number;
	high3Cents: number; // nominal average of final 3 years of salary
	ssMonthlyAt62TodayCents: number; // for SRS approximation, today's dollars
	inflationFactorAtSeparation: number; // to express SRS nominally at separation
}): FersDetermination {
	const { separationAge, serviceYears, high3Cents, ssMonthlyAt62TodayCents } =
		args;

	const eligible = serviceYears >= 5;
	const immediate =
		(separationAge >= FERS_MRA && serviceYears >= 30) ||
		(separationAge >= 60 && serviceYears >= 20) ||
		(separationAge >= 62 && serviceYears >= 5);

	const multiplier =
		immediate && separationAge >= 62 && serviceYears >= 20
			? FERS_MULTIPLIER_62_20
			: FERS_MULTIPLIER;

	const commencementAge = immediate
		? separationAge
		: Math.max(FERS_DEFERRED_COMMENCEMENT_AGE, separationAge);

	const annualAnnuityAtCommencementCents = eligible
		? Math.round(multiplier * high3Cents * serviceYears)
		: 0;

	const srsEligible = immediate && separationAge < 62;
	const srsAnnualCents = srsEligible
		? Math.round(
				((ssMonthlyAt62TodayCents * 12 * serviceYears) /
					SRS_SERVICE_DENOMINATOR) *
					args.inflationFactorAtSeparation,
			)
		: 0;

	return {
		eligible,
		immediate,
		commencementAge,
		multiplier,
		serviceYears,
		high3Cents,
		annualAnnuityAtCommencementCents,
		srsEligible,
		srsAnnualCents,
	};
}
