// Versioned tax/benefit constants, 2026 baseline. All dollar figures in
// integer cents, all rates as decimal fractions. When a new year's figures
// are published (IRS revenue procedure, SSA fact sheet), update here.
// Verified 2026-08-07 against published 2026 figures (Rev. Proc. 2025-32
// brackets/deduction/LTCG, SSA wage base + bend points, TSP bulletin 25-3
// deferral limit, CMS Part B premium). Still estimates, not published
// figures: MEDICARE_NET_SUBSIDY, MEDICARE_SUPPLEMENTAL_OOP, DIVIDEND_YIELD,
// CASH_REAL_RETURN.

export const CONSTANTS_YEAR = 2026;

// --- Federal income tax, single filer (Rev. Proc. 2025-32) ---

export const STANDARD_DEDUCTION_CENTS = 16_100_00;

// Marginal brackets: tax `rate` applies to income above `overCents` up to
// the next bracket's threshold.
export const FEDERAL_BRACKETS: ReadonlyArray<{
	overCents: number;
	rate: number;
}> = [
	{ overCents: 0, rate: 0.1 },
	{ overCents: 12_400_00, rate: 0.12 },
	{ overCents: 50_400_00, rate: 0.22 },
	{ overCents: 105_700_00, rate: 0.24 },
	{ overCents: 201_775_00, rate: 0.32 },
	{ overCents: 256_225_00, rate: 0.35 },
	{ overCents: 640_600_00, rate: 0.37 },
];

// --- Long-term capital gains / qualified dividends, single filer ---
// Rate applies to gains stacked ON TOP of ordinary taxable income; the
// thresholds are total-taxable-income breakpoints (2026, verified).

export const LTCG_BRACKETS: ReadonlyArray<{ overCents: number; rate: number }> =
	[
		{ overCents: 0, rate: 0 },
		{ overCents: 49_450_00, rate: 0.15 },
		{ overCents: 545_500_00, rate: 0.2 },
	];

// Assumed qualified-dividend yield on the taxable bucket, taxed annually.
export const DIVIDEND_YIELD = 0.02;

// Cash (HYSA) earns this REAL return — nominal rate = inflation + this.
// Interest is ordinary income, taxed annually.
export const CASH_REAL_RETURN = 0.01;

// --- FICA ---

export const SS_WAGE_BASE_CENTS = 184_500_00;
export const SS_TAX_RATE = 0.062;
export const MEDICARE_TAX_RATE = 0.0145;
export const ADDITIONAL_MEDICARE_RATE = 0.009;
export const ADDITIONAL_MEDICARE_THRESHOLD_CENTS = 200_000_00;

// --- Social Security benefit formula (2026 fact sheet) ---

// PIA bend points (monthly AIME dollars, in cents).
export const PIA_BEND_1_CENTS = 1_286_00;
export const PIA_BEND_2_CENTS = 7_749_00;
export const PIA_RATES = [0.9, 0.32, 0.15] as const;

// Earnings years averaged into AIME.
export const AIME_YEARS = 35;

// Full retirement age is 67 for anyone born 1960+ (i.e., James).
export const FULL_RETIREMENT_AGE = 67;
export const SS_EARLIEST_CLAIM_AGE = 62;
export const SS_LATEST_CLAIM_AGE = 70;

// Early-claiming reduction: 5/9% per month for the first 36 months before
// FRA, 5/12% per month beyond. Delayed credits: 2/3% per month after FRA.
export const SS_EARLY_REDUCTION_FIRST_36 = 5 / 900;
export const SS_EARLY_REDUCTION_BEYOND = 5 / 1200;
export const SS_DELAYED_CREDIT_PER_MONTH = 2 / 300;

// Provisional-income thresholds for benefit taxability, single filer.
// Fixed in law — not inflation indexed.
export const SS_TAXABILITY_THRESHOLD_1_CENTS = 25_000_00;
export const SS_TAXABILITY_THRESHOLD_2_CENTS = 34_000_00;

// --- FERS ---

// Employee contribution rate by hire cohort (James: pre-2013 → 0.8%).
export const FERS_RATES_BY_COHORT = {
	'pre-2013': 0.008,
	'2013': 0.031, // FERS-RAE
	'post-2013': 0.044, // FERS-FRAE
} as const;

export const FERS_MULTIPLIER = 0.01;
export const FERS_MULTIPLIER_62_20 = 0.011;

// Minimum retirement age for anyone born 1970+ (i.e., James).
export const FERS_MRA = 57;

// Deferred annuities commence at 62 (we always defer past the MRA+10
// reduced-annuity option — see SPEC.md).
export const FERS_DEFERRED_COMMENCEMENT_AGE = 62;

// FERS retiree COLA begins at this age for regular retirees.
export const FERS_COLA_START_AGE = 62;

// SRS ≈ SS benefit at 62 × (service years / 40).
export const SRS_SERVICE_DENOMINATOR = 40;

// --- TSP ---

export const TSP_AUTOMATIC_PCT = 0.01;
// Match: 100% of first 3% of salary deferred, 50% of next 2%.
export const TSP_MATCH_FULL_PCT = 0.03;
export const TSP_MATCH_HALF_PCT = 0.02;
// 2026 elective deferral limit (catch-up contributions not modeled).
export const TSP_DEFERRAL_LIMIT_CENTS = 24_500_00;

// --- Medicare (in-kind benefit display) ---

export const MEDICARE_AGE = 65;
// Rough net annual value of Medicare to an enrollee in today's dollars:
// per-capita program spending minus enrollee premiums/cost-sharing.
// Verify/tune against current data.
export const MEDICARE_NET_SUBSIDY_CENTS = 10_000_00;
// Part B premium ($202.90/mo standard, 2026) and typical medigap + Part D
// premiums for a non-FEHB retiree (rough). Premiums only — out-of-pocket
// care spending is the user's own expense row, not an engine constant.
export const MEDICARE_PARTB_PREMIUM_CENTS = 2_435_00;
export const MEDIGAP_PARTD_PREMIUM_CENTS = 2_600_00;

// --- Early withdrawal ---

export const EARLY_WITHDRAWAL_PENALTY_RATE = 0.1;
export const PENALTY_FREE_AGE = 59.5;
// Separation in or after the year turning 55 → penalty-free TSP access.
export const TSP_AGE_55_RULE_AGE = 55;

// SEPP (72(t)) fixed-amortization: rate capped at 5% (or 120% of the federal
// mid-term rate if higher — we just use the cap).
export const SEPP_MAX_RATE = 0.05;
export const SEPP_END_AGE = 59.5;

// IRS Single Life Expectancy Table (2022-updated, Pub 590-B), ages relevant
// to SEPP start (must begin before 59.5).
export const SINGLE_LIFE_EXPECTANCY: Readonly<Record<number, number>> = {
	40: 45.7,
	41: 44.8,
	42: 43.8,
	43: 42.9,
	44: 41.9,
	45: 41.0,
	46: 40.0,
	47: 39.0,
	48: 38.1,
	49: 37.1,
	50: 36.2,
	51: 35.3,
	52: 34.3,
	53: 33.4,
	54: 32.5,
	55: 31.6,
	56: 30.6,
	57: 29.8,
	58: 28.9,
	59: 27.9,
};
