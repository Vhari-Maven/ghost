// All money in integer cents (nominal unless noted), all rates as decimal
// fractions (0.03 = 3%).

export interface JobInputs {
	salaryCents: number;
	serviceStartDate: string; // ISO YYYY-MM-DD
	tspTraditionalPct: number;
	tspRothPct: number;
	fersContributionPct: number;
	employerHealthCents: number;
	employeeHealthCents: number;
}

export interface BucketBalances {
	// HYSA/checking — earns inflation + CASH_REAL_RETURN, interest taxed as
	// ordinary income; drawn first in deficits.
	cashCents: number;
	// Invested taxable (brokerage) only — grows at the return knob.
	taxableCents: number;
	// Cost basis of the invested taxable bucket.
	taxableBasisCents: number;
	deferredCents: number;
	rothCents: number;
	rothBasisCents: number;
}

export interface ExpenseInput {
	name: string;
	annualCents: number; // today's dollars
	applies: 'always' | 'working' | 'retirement';
}

export interface EarningsYearInput {
	year: number;
	earningsCents: number;
}

export interface Knobs {
	inflationPct: number;
	nominalReturnPct: number;
	// null = track the inflation assumption
	wageGrowthPct: number | null;
	retirementAge: number; // age at separation; last working year is age retirementAge - 1
	ssClaimingAge: number;
	stateTaxPct: number;
	endAge: number;
}

export interface EngineInputs {
	birthDate: string; // ISO YYYY-MM-DD
	currentYear: number;
	job: JobInputs;
	buckets: BucketBalances;
	expenses: ExpenseInput[];
	earningsHistory: EarningsYearInput[];
	knobs: Knobs;
}

export interface YearRow {
	year: number;
	age: number; // age attained during the calendar year
	working: boolean;

	// Income (gross, nominal)
	salaryCents: number;
	totalCompCents: number; // salary + employer health + employer TSP (working years)
	fersAnnuityCents: number;
	srsCents: number;
	ssBenefitCents: number;

	// Gross-frame health accounting, split care-vs-coverage. The engine
	// prices only the INSURED portion of care: healthExpenseCents is the cost
	// of that care as priced by the coverage financing it (FEHB premium under
	// 65; Medicare cost plus supplemental coverage from 65), and
	// healthInKindCents is the share someone else pays (employer share,
	// Medicare net subsidy). Uninsured care (copays, dental) is the user's
	// own expense row, identical in every phase. Both engine lines enter
	// income and expenses together, so cash flow nets to premiums actually
	// paid. Neither subsidy is taxed.
	healthExpenseCents: number;
	healthInKindCents: number;

	// Payroll deductions (working years)
	employeeTspTraditionalCents: number;
	employeeTspRothCents: number;
	employerTspCents: number;
	fersContributionCents: number;
	employeeHealthCents: number;

	// Withdrawals by source
	withdrawalCashCents: number;
	withdrawalTaxableCents: number;
	withdrawalRothBasisCents: number;
	withdrawalDeferredCents: number;
	withdrawalRothEarningsCents: number;
	seppPaymentCents: number; // portion of deferred withdrawal mandated by an active SEPP

	// Taxes
	federalTaxCents: number;
	// LTCG on realized gains from taxable withdrawals + qualified dividends.
	capitalGainsTaxCents: number;
	stateTaxCents: number;
	ficaCents: number;
	earlyWithdrawalPenaltyCents: number;
	dividendsCents: number;
	cashInterestCents: number;
	// Nominal growth on start-of-year balances across all buckets (including
	// cash interest). Economic income: accrues whether or not it's withdrawn.
	investmentGrowthCents: number;

	// Spending
	expensesCents: number; // nominal
	expensesByCategory: Record<string, number>;

	// Flows and balances (end of year, nominal)
	netCashFlowCents: number; // after-tax income − expenses (before withdrawals)
	cashCents: number;
	taxableCents: number;
	taxableBasisCents: number;
	deferredCents: number;
	rothCents: number;
	rothBasisCents: number;
	netWorthCents: number;
	netWorthRealCents: number; // deflated to today's dollars
	shortfallCents: number; // unmet spending after all buckets exhausted (0 if funded)
}

export interface FersDetermination {
	eligible: boolean; // any annuity at all (5+ years of service)
	immediate: boolean; // unreduced immediate annuity at separation
	commencementAge: number;
	multiplier: number;
	serviceYears: number;
	high3Cents: number; // nominal at separation
	annualAnnuityAtCommencementCents: number; // nominal, before COLA
	srsEligible: boolean;
	srsAnnualCents: number; // nominal at separation
}

export interface Projection {
	rows: YearRow[];
	fers: FersDetermination;
	ssMonthlyAtClaimTodayCents: number; // claimed benefit in today's dollars
	firstShortfallAge: number | null;
}
