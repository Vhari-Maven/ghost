import {
	CASH_REAL_RETURN,
	DIVIDEND_YIELD,
	EARLY_WITHDRAWAL_PENALTY_RATE,
	FERS_COLA_START_AGE,
	FERS_DEFERRED_COMMENCEMENT_AGE,
	MEDICARE_AGE,
	MEDICARE_NET_SUBSIDY_CENTS,
	MEDICARE_PARTB_PREMIUM_CENTS,
	MEDIGAP_PARTD_PREMIUM_CENTS,
	TSP_AGE_55_RULE_AGE,
	TSP_AUTOMATIC_PCT,
	TSP_DEFERRAL_LIMIT_CENTS,
	TSP_MATCH_FULL_PCT,
	TSP_MATCH_HALF_PCT,
} from './constants';
import { determineFers, dietCola } from './fers';
import { seppAnnualPaymentCents } from './sepp';
import { claimingFactor, piaTodayMonthlyCents } from './socialSecurity';
import {
	capitalGainsTaxCents,
	federalTaxCents,
	ficaCents,
	standardDeductionCents,
	taxableSocialSecurityCents,
} from './tax';
import type {
	EngineInputs,
	FersDetermination,
	Projection,
	YearRow,
} from './types';

// Age convention: `age` is the age attained during a calendar year
// (year − birth year). Working years are those with age < retirementAge;
// separation happens on the birthday in the year age === retirementAge.
// Penalty-free deferred access starts the year age 60 is attained (59½
// falls mid-year age 59; we round conservatively), or from separation if
// the TSP age-55 rule applies.

function birthYearOf(birthDate: string): number {
	return Number(birthDate.slice(0, 4));
}

function serviceYearsAt(
	serviceStartDate: string,
	birthDate: string,
	separationAge: number,
): number {
	const start = new Date(`${serviceStartDate}T00:00:00Z`).getTime();
	const birth = new Date(`${birthDate}T00:00:00Z`);
	const separation = Date.UTC(
		birth.getUTCFullYear() + separationAge,
		birth.getUTCMonth(),
		birth.getUTCDate(),
	);
	return Math.max(0, (separation - start) / (365.25 * 24 * 3600 * 1000));
}

export function project(inputs: EngineInputs): Projection {
	const { birthDate, currentYear, job, expenses, earningsHistory, knobs } =
		inputs;
	const {
		inflationPct: infl,
		nominalReturnPct: ret,
		retirementAge,
		ssClaimingAge,
		stateTaxPct,
		endAge,
	} = knobs;
	const wageGrowth = knobs.wageGrowthPct ?? infl;

	const birthYear = birthYearOf(birthDate);
	const separationYear = birthYear + retirementAge;
	const lastWorkingYear = separationYear - 1;

	const salaryInYear = (year: number): number =>
		Math.round(job.salaryCents * (1 + wageGrowth) ** (year - currentYear));

	// --- Social Security ---
	const piaToday = piaTodayMonthlyCents({
		earningsHistory,
		currentYear,
		currentSalaryCents: job.salaryCents,
		wageGrowthRate: wageGrowth,
		wageIndexRate: infl,
		separationYear,
	});
	const ssMonthlyAtClaimTodayCents = Math.round(
		piaToday * claimingFactor(ssClaimingAge),
	);
	const ssMonthlyAt62TodayCents = Math.round(piaToday * claimingFactor(62));

	// --- FERS determination (fixed once retirement age is chosen) ---
	const high3Years = [
		lastWorkingYear - 2,
		lastWorkingYear - 1,
		lastWorkingYear,
	];
	const high3Cents =
		lastWorkingYear >= currentYear
			? Math.round(
					high3Years
						.map((y) => salaryInYear(Math.max(y, currentYear)))
						.reduce((s, x) => s + x, 0) / 3,
				)
			: job.salaryCents;
	const fers: FersDetermination = determineFers({
		separationAge: retirementAge,
		serviceYears: serviceYearsAt(
			job.serviceStartDate,
			birthDate,
			retirementAge,
		),
		high3Cents,
		ssMonthlyAt62TodayCents,
		inflationFactorAtSeparation: (1 + infl) ** (separationYear - currentYear),
	});

	// --- Mutable projection state ---
	let cash = inputs.buckets.cashCents;
	let taxable = inputs.buckets.taxableCents;
	let taxableBasis = Math.min(inputs.buckets.taxableBasisCents, taxable);
	let deferred = inputs.buckets.deferredCents;
	let roth = inputs.buckets.rothCents;
	let rothBasis = Math.min(inputs.buckets.rothBasisCents, roth);

	let seppActive = false;
	let seppPayment = 0;
	let fersAnnuityCurrent = 0; // nominal annuity in pay, updated with COLA
	let firstShortfallAge: number | null = null;

	const penaltyFreeFromSeparation = retirementAge >= TSP_AGE_55_RULE_AGE;

	const rows: YearRow[] = [];

	for (let year = currentYear; year - birthYear <= endAge; year++) {
		const age = year - birthYear;
		const working = age < retirementAge && year >= currentYear;
		const yearsFromNow = year - currentYear;
		const inflationFactor = (1 + infl) ** yearsFromNow;

		// 1. Growth on start-of-year balances. Cash earns inflation + its
		// real-return assumption; that interest is ordinary income this year.
		let cashInterest = 0;
		let investmentGrowth = 0;
		if (yearsFromNow > 0) {
			const startInvested = taxable + deferred + roth;
			taxable = Math.round(taxable * (1 + ret));
			deferred = Math.round(deferred * (1 + ret));
			roth = Math.round(roth * (1 + ret));
			const cashRate = (1 + infl) * (1 + CASH_REAL_RETURN) - 1;
			cashInterest = Math.round(cash * cashRate);
			cash += cashInterest;
			investmentGrowth =
				taxable + deferred + roth - startInvested + cashInterest;
		}

		// 2. Wage income and payroll flows.
		let salary = 0;
		let employeeTspTraditional = 0;
		let employeeTspRoth = 0;
		let employerTsp = 0;
		let fersContribution = 0;
		let employeeHealth = 0;
		let totalComp = 0;
		let employerHealth = 0;

		if (working) {
			salary = salaryInYear(year);
			const electivePct = job.tspTraditionalPct + job.tspRothPct;
			const deferralLimit = TSP_DEFERRAL_LIMIT_CENTS * inflationFactor;
			const electiveRaw = salary * electivePct;
			const scale =
				electiveRaw > deferralLimit ? deferralLimit / electiveRaw : 1;
			employeeTspTraditional = Math.round(
				salary * job.tspTraditionalPct * scale,
			);
			employeeTspRoth = Math.round(salary * job.tspRothPct * scale);
			const matchPct =
				Math.min(electivePct, TSP_MATCH_FULL_PCT) +
				Math.min(
					Math.max(electivePct - TSP_MATCH_FULL_PCT, 0),
					TSP_MATCH_HALF_PCT,
				) *
					0.5;
			employerTsp = Math.round(salary * (TSP_AUTOMATIC_PCT + matchPct));
			fersContribution = Math.round(salary * job.fersContributionPct);
			employeeHealth = Math.round(job.employeeHealthCents * inflationFactor);
			employerHealth = Math.round(job.employerHealthCents * inflationFactor);
			totalComp = salary + employerHealth + employerTsp;
		}

		// 3. Retirement income.
		let fersAnnuity = 0;
		let srs = 0;

		if (!working && fers.eligible && age >= fers.commencementAge) {
			if (fersAnnuityCurrent === 0) {
				fersAnnuityCurrent = fers.annualAnnuityAtCommencementCents;
			} else if (age > FERS_COLA_START_AGE) {
				fersAnnuityCurrent = Math.round(
					fersAnnuityCurrent * (1 + dietCola(infl)),
				);
			}
			fersAnnuity = fersAnnuityCurrent;
		}
		if (
			fers.srsEligible &&
			!working &&
			age >= retirementAge &&
			age < FERS_DEFERRED_COMMENCEMENT_AGE
		) {
			srs = fers.srsAnnualCents;
		}

		let ssBenefit = 0;
		if (age >= ssClaimingAge) {
			ssBenefit = Math.round(ssMonthlyAtClaimTodayCents * 12 * inflationFactor);
		}

		// Gross-frame health line (engine-owned): the cost of CARE, priced by
		// the coverage that finances it, minus in-kind subsidies. Care that
		// insurance doesn't touch (copays, dental) is the user's own expense
		// row and applies identically in every phase — the engine only prices
		// the insured portion:
		// - under 65: FEHB premium is the price of the age-band's insured care
		//   (deferred gap uses it as a private-coverage proxy, unsubsidized)
		// - 65+: Medicare's cost (net program subsidy + Part B financing) plus
		//   supplemental coverage — FEHB if annuitant, else medigap/Part D
		// Subsidies (employer share, Medicare net subsidy) enter income
		// in-kind, so cash impact nets to premiums actually paid.
		const fehbFullPremium = Math.round(
			(job.employerHealthCents + job.employeeHealthCents) * inflationFactor,
		);
		const employerShare = Math.round(job.employerHealthCents * inflationFactor);
		const medicareSubsidy = Math.round(
			MEDICARE_NET_SUBSIDY_CENTS * inflationFactor,
		);
		const partB = Math.round(MEDICARE_PARTB_PREMIUM_CENTS * inflationFactor);
		const medigapPartD = Math.round(
			MEDIGAP_PARTD_PREMIUM_CENTS * inflationFactor,
		);
		const fehbCovered = working || fers.immediate;
		const onMedicare = age >= MEDICARE_AGE;

		const insuredCare = onMedicare
			? medicareSubsidy + partB + (fehbCovered ? fehbFullPremium : medigapPartD)
			: fehbFullPremium;
		const healthExpense = insuredCare;
		const healthSubsidy =
			(fehbCovered ? employerShare : 0) + (onMedicare ? medicareSubsidy : 0);

		// 4. Expenses.
		const expensesByCategory: Record<string, number> = {};
		let expensesTotal = 0;
		for (const e of expenses) {
			if (e.applies === 'working' && !working) continue;
			if (e.applies === 'retirement' && working) continue;
			const amount = Math.round(e.annualCents * (1 + infl) ** yearsFromNow);
			expensesByCategory[e.name] = (expensesByCategory[e.name] ?? 0) + amount;
			expensesTotal += amount;
		}
		expensesByCategory['Health care (insured)'] = healthExpense;
		expensesTotal += healthExpense;

		// Taxable-bucket inputs for the year: qualified dividends thrown off
		// by the balance (distributed as spendable cash — any unspent
		// remainder recycles into the bucket as new basis via the surplus
		// path below), and the unrealized-gain fraction that a withdrawal
		// would realize. Both fixed before the tax loop.
		const dividends = Math.round(taxable * DIVIDEND_YIELD);
		const gainFraction =
			taxable > 0 ? Math.min(1, Math.max(0, 1 - taxableBasis / taxable)) : 0;

		// 5. Solve withdrawals + taxes (fixed point), possibly activating SEPP.
		const penaltyFree = age >= 60 || (!working && penaltyFreeFromSeparation);
		const seppEligible =
			!working && !penaltyFree && age < 60 && deferred > 0 && !seppActive;

		const solve = (seppOn: boolean, seppAmt: number) => {
			const mandatoryDeferred = seppOn ? Math.min(seppAmt, deferred) : 0;
			let fed = 0;
			let capGains = 0;
			let state = 0;
			let fica = 0;
			let penalty = 0;
			let wCash = 0;
			let wTaxable = 0;
			let wRothBasis = 0;
			let wDeferred = mandatoryDeferred;
			let wRothEarnings = 0;

			for (let iter = 0; iter < 40; iter++) {
				const grossCash =
					salary -
					employeeTspTraditional -
					employeeTspRoth -
					fersContribution +
					healthSubsidy +
					fersAnnuity +
					srs +
					ssBenefit +
					dividends +
					mandatoryDeferred;
				const need =
					expensesTotal + fed + capGains + state + fica + penalty - grossCash;

				wCash = 0;
				wTaxable = 0;
				wRothBasis = 0;
				wDeferred = mandatoryDeferred;
				wRothEarnings = 0;
				if (need > 0) {
					let remaining = need;
					wCash = Math.min(remaining, cash);
					remaining -= wCash;
					// Dividends are distributed this year, so only the rest of
					// the bucket is available to sell.
					wTaxable = Math.min(remaining, taxable - dividends);
					remaining -= wTaxable;
					wRothBasis = Math.min(remaining, rothBasis);
					remaining -= wRothBasis;
					const extraDeferred = Math.min(
						remaining,
						deferred - mandatoryDeferred,
					);
					wDeferred += extraDeferred;
					remaining -= extraDeferred;
					wRothEarnings = Math.min(remaining, roth - rothBasis);
					remaining -= wRothEarnings;
				}

				// Taxes on this year's income picture.
				const wageTaxable = Math.max(
					0,
					salary - employeeTspTraditional - employeeHealth,
				);
				const rothEarningsTaxable = age >= 60 ? 0 : wRothEarnings;
				const ordinaryIncome =
					wageTaxable +
					fersAnnuity +
					srs +
					wDeferred +
					rothEarningsTaxable +
					cashInterest;
				const taxableSs = taxableSocialSecurityCents(ssBenefit, ordinaryIncome);
				const taxableIncome = Math.max(
					0,
					ordinaryIncome + taxableSs - standardDeductionCents(inflationFactor),
				);
				const newFed = federalTaxCents(taxableIncome, inflationFactor);
				// LTCG on qualified dividends + the gain realized by this
				// year's taxable-bucket withdrawal, stacked on ordinary income.
				const ltcgIncome = dividends + Math.round(wTaxable * gainFraction);
				const newCapGains = capitalGainsTaxCents(
					ltcgIncome,
					taxableIncome,
					inflationFactor,
				);
				// Flat state rate hits ordinary income and gains alike.
				const newState = Math.round((taxableIncome + ltcgIncome) * stateTaxPct);
				const newFica = ficaCents(salary, inflationFactor);

				let newPenalty = 0;
				if (!penaltyFree) {
					const penalizedDeferred = Math.max(
						0,
						wDeferred - (seppOn ? seppAmt : 0),
					);
					newPenalty += Math.round(
						penalizedDeferred * EARLY_WITHDRAWAL_PENALTY_RATE,
					);
				}
				if (age < 60) {
					newPenalty += Math.round(
						wRothEarnings * EARLY_WITHDRAWAL_PENALTY_RATE,
					);
				}

				const done =
					Math.abs(newFed - fed) < 100 &&
					Math.abs(newCapGains - capGains) < 100 &&
					Math.abs(newState - state) < 100 &&
					Math.abs(newPenalty - penalty) < 100;
				fed = newFed;
				capGains = newCapGains;
				state = newState;
				fica = newFica;
				penalty = newPenalty;
				if (done) break;
			}

			return {
				fed,
				capGains,
				state,
				fica,
				penalty,
				wCash,
				wTaxable,
				wRothBasis,
				wDeferred,
				wRothEarnings,
				mandatoryDeferred,
			};
		};

		let result = solve(seppActive, seppPayment);

		// Activate a SEPP if the no-SEPP solution had to raid deferred money
		// with penalties while SEPP-eligible.
		if (seppEligible && result.wDeferred > 0 && result.penalty > 0) {
			seppActive = true;
			seppPayment = seppAnnualPaymentCents(deferred, age, ret);
			result = solve(true, seppPayment);
		}
		// SEPP ends once penalty-free age is reached.
		if (seppActive && penaltyFree) {
			seppActive = false;
			seppPayment = 0;
		}

		const { fed, capGains, state, fica, penalty } = result;
		let { wCash, wTaxable, wRothBasis, wDeferred, wRothEarnings } = result;

		const grossCashIncome =
			salary -
			employeeTspTraditional -
			employeeTspRoth -
			fersContribution +
			healthSubsidy +
			fersAnnuity +
			srs +
			ssBenefit +
			dividends;
		const totalTax = fed + capGains + state + fica + penalty;

		// The tax↔withdrawal fixed point only converges to within a few cents
		// (every tax function rounds independently). Sweep any leftover need
		// through the waterfall once more without re-solving taxes — cents
		// can't move a bracket — so a reported shortfall always means the
		// buckets are truly empty, never rounding residue.
		let residue =
			expensesTotal +
			totalTax -
			grossCashIncome -
			(wCash + wTaxable + wRothBasis + wDeferred + wRothEarnings);
		if (residue > 0) {
			const take = (available: number) => {
				const t = Math.min(residue, Math.max(0, available));
				residue -= t;
				return t;
			};
			wCash += take(cash - wCash);
			wTaxable += take(taxable - dividends - wTaxable);
			wRothBasis += take(rothBasis - wRothBasis);
			wDeferred += take(deferred - wDeferred);
			wRothEarnings += take(roth - rothBasis - wRothEarnings);
		}

		// 6. Apply flows to buckets. A taxable withdrawal consumes basis in
		// proportion to the basis fraction. Dividends leave the bucket as a
		// cash distribution (no basis consumed); whatever isn't spent comes
		// back as new basis through the surplus path below.
		deferred += employeeTspTraditional + employerTsp - wDeferred;
		roth += employeeTspRoth - wRothBasis - wRothEarnings;
		rothBasis += employeeTspRoth - wRothBasis;
		cash -= wCash;
		taxable -= wTaxable + dividends;
		taxableBasis -= Math.round(wTaxable * (1 - gainFraction));

		const netCashFlow = grossCashIncome - totalTax - expensesTotal;
		const totalWithdrawn =
			wCash + wTaxable + wRothBasis + wDeferred + wRothEarnings;
		// Cash surplus (income exceeding spending, plus any over-withdrawal
		// such as a mandatory SEPP payment in a year that didn't need it)
		// accumulates in the taxable bucket — as new basis.
		const surplus = Math.max(0, netCashFlow + totalWithdrawn);
		taxable += surplus;
		taxableBasis += surplus;

		const shortfall = Math.max(0, -(netCashFlow + totalWithdrawn));
		if (shortfall > 0 && firstShortfallAge === null) firstShortfallAge = age;

		cash = Math.max(0, cash);
		taxable = Math.max(0, taxable);
		taxableBasis = Math.max(0, Math.min(taxableBasis, taxable));
		deferred = Math.max(0, deferred);
		roth = Math.max(0, roth);
		rothBasis = Math.max(0, Math.min(rothBasis, roth));

		const netWorth = cash + taxable + deferred + roth;

		rows.push({
			year,
			age,
			working,
			salaryCents: salary,
			totalCompCents: totalComp,
			fersAnnuityCents: fersAnnuity,
			srsCents: srs,
			ssBenefitCents: ssBenefit,
			healthExpenseCents: healthExpense,
			healthInKindCents: healthSubsidy,
			employeeTspTraditionalCents: employeeTspTraditional,
			employeeTspRothCents: employeeTspRoth,
			employerTspCents: employerTsp,
			fersContributionCents: fersContribution,
			employeeHealthCents: employeeHealth,
			withdrawalCashCents: wCash,
			withdrawalTaxableCents: wTaxable,
			withdrawalRothBasisCents: wRothBasis,
			withdrawalDeferredCents: wDeferred,
			withdrawalRothEarningsCents: wRothEarnings,
			seppPaymentCents: seppActive ? seppPayment : 0,
			federalTaxCents: fed,
			capitalGainsTaxCents: capGains,
			stateTaxCents: state,
			ficaCents: fica,
			earlyWithdrawalPenaltyCents: penalty,
			dividendsCents: dividends,
			cashInterestCents: cashInterest,
			investmentGrowthCents: investmentGrowth,
			expensesCents: expensesTotal,
			expensesByCategory,
			netCashFlowCents: netCashFlow,
			cashCents: cash,
			taxableCents: taxable,
			taxableBasisCents: taxableBasis,
			deferredCents: deferred,
			rothCents: roth,
			rothBasisCents: rothBasis,
			netWorthCents: netWorth,
			netWorthRealCents: Math.round(netWorth / inflationFactor),
			shortfallCents: shortfall,
		});
	}

	return { rows, fers, ssMonthlyAtClaimTodayCents, firstShortfallAge };
}
