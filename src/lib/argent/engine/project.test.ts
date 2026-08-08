import { describe, expect, test } from 'vitest';
import { project } from './project';
import type { EngineInputs } from './types';

// A James-shaped baseline: born 1987, federal service since 2009, at the
// pay cap, sensible balances. Individual tests override knobs.
function baseInputs(overrides?: Partial<EngineInputs['knobs']>): EngineInputs {
	return {
		birthDate: '1987-02-25',
		currentYear: 2026,
		job: {
			salaryCents: 195_200_00,
			serviceStartDate: '2009-05-15',
			tspTraditionalPct: 0.05,
			tspRothPct: 0.05,
			fersContributionPct: 0.008,
			employerHealthCents: 15_000_00,
			employeeHealthCents: 6_000_00,
		},
		buckets: {
			cashCents: 0,
			taxableCents: 200_000_00,
			taxableBasisCents: 140_000_00,
			deferredCents: 500_000_00,
			rothCents: 200_000_00,
			rothBasisCents: 120_000_00,
		},
		expenses: [
			{ name: 'Housing', annualCents: 30_000_00, applies: 'always' as const },
			{ name: 'Food', annualCents: 12_000_00, applies: 'always' as const },
		],
		earningsHistory: Array.from({ length: 18 }, (_, i) => ({
			year: 2009 + i,
			earningsCents: Math.min(80_000_00 + i * 8_000_00, 176_100_00),
		})),
		knobs: {
			inflationPct: 0.025,
			nominalReturnPct: 0.06,
			wageGrowthPct: 0.025,
			retirementAge: 57,
			ssClaimingAge: 67,
			stateTaxPct: 0,
			endAge: 95,
			...overrides,
		},
	};
}

describe('project — structure', () => {
	test('rows run from current year to end age', () => {
		const p = project(baseInputs());
		expect(p.rows[0].year).toBe(2026);
		expect(p.rows[0].age).toBe(39);
		expect(p.rows.at(-1)?.age).toBe(95);
	});

	test('working flag flips at retirement age', () => {
		const p = project(baseInputs({ retirementAge: 57 }));
		const at56 = p.rows.find((r) => r.age === 56);
		const at57 = p.rows.find((r) => r.age === 57);
		expect(at56?.working).toBe(true);
		expect(at57?.working).toBe(false);
		expect(at57?.salaryCents).toBe(0);
	});
});

describe('project — working years', () => {
	test('total comp exceeds salary by employer health + TSP', () => {
		const p = project(baseInputs());
		const r = p.rows[0];
		expect(r.totalCompCents).toBe(
			r.salaryCents + 15_000_00 + r.employerTspCents,
		);
		// 10% elective → full 4% match + 1% automatic = 5% employer.
		expect(r.employerTspCents).toBe(Math.round(r.salaryCents * 0.05));
	});

	test('FICA and federal tax are paid while working', () => {
		const r = project(baseInputs()).rows[0];
		expect(r.ficaCents).toBeGreaterThan(0);
		expect(r.federalTaxCents).toBeGreaterThan(0);
	});

	test('TSP contributions land in the right buckets', () => {
		const rows = project(baseInputs()).rows;
		const r0 = rows[0];
		expect(r0.employeeTspTraditionalCents).toBeGreaterThan(0);
		expect(r0.employeeTspRothCents).toBeGreaterThan(0);
		// Roth basis grows by exactly the Roth contribution in surplus years.
		expect(r0.rothBasisCents).toBe(120_000_00 + r0.employeeTspRothCents);
	});
});

describe('project — retirement at 57 (MRA + 30)', () => {
	const p = project(baseInputs({ retirementAge: 57 }));

	test('immediate FERS annuity with SRS until 62', () => {
		expect(p.fers.immediate).toBe(true);
		expect(p.fers.srsEligible).toBe(true);
		const at58 = p.rows.find((r) => r.age === 58);
		const at62 = p.rows.find((r) => r.age === 62);
		expect(at58!.fersAnnuityCents).toBeGreaterThan(0);
		expect(at58!.srsCents).toBeGreaterThan(0);
		expect(at62!.srsCents).toBe(0);
	});

	test('social security starts at claiming age', () => {
		const at66 = p.rows.find((r) => r.age === 66);
		const at67 = p.rows.find((r) => r.age === 67);
		expect(at66!.ssBenefitCents).toBe(0);
		expect(at67!.ssBenefitCents).toBeGreaterThan(0);
	});

	test('no early-withdrawal penalties (age-55 rule)', () => {
		for (const r of p.rows) {
			expect(r.earlyWithdrawalPenaltyCents).toBe(0);
		}
	});
});

describe('project — retirement at 40 (deferred)', () => {
	const p = project(baseInputs({ retirementAge: 40 }));

	test('deferred annuity: nothing until 62, no SRS ever', () => {
		expect(p.fers.immediate).toBe(false);
		expect(p.fers.commencementAge).toBe(62);
		const at50 = p.rows.find((r) => r.age === 50);
		const at62 = p.rows.find((r) => r.age === 62);
		expect(at50!.fersAnnuityCents).toBe(0);
		expect(at50!.srsCents).toBe(0);
		expect(at62!.fersAnnuityCents).toBeGreaterThan(0);
		expect(p.rows.every((r) => r.srsCents === 0)).toBe(true);
	});

	test('gap years are funded taxable-first, then Roth basis / SEPP', () => {
		const at41 = p.rows.find((r) => r.age === 41);
		expect(at41!.withdrawalTaxableCents).toBeGreaterThan(0);
		expect(at41!.withdrawalDeferredCents).toBe(0);
	});

	test('SEPP activates when taxable + Roth basis run out, without penalties', () => {
		const seppYears = p.rows.filter((r) => r.seppPaymentCents > 0);
		expect(seppYears.length).toBeGreaterThan(0);
		expect(seppYears.every((r) => r.age < 60)).toBe(true);
		// The SEPP payment itself must not be penalized: any penalty must be
		// 10% of (deferred beyond the SEPP payment + Roth earnings), give or
		// take cents — the post-solve residue sweep withdraws its final cents
		// without re-solving taxes, so the penalty can trail by that much.
		for (const r of seppYears) {
			const penalized =
				Math.max(0, r.withdrawalDeferredCents - r.seppPaymentCents) +
				r.withdrawalRothEarningsCents;
			expect(
				Math.abs(r.earlyWithdrawalPenaltyCents - Math.round(penalized * 0.1)),
			).toBeLessThanOrEqual(50);
		}
	});

	test('high-3 is frozen: deferred annuity is unaffected by later inflation', () => {
		// Annuity at 62 = 1% × high3(nominal at separation) × service years.
		const expected = Math.round(0.01 * p.fers.high3Cents * p.fers.serviceYears);
		expect(p.fers.annualAnnuityAtCommencementCents).toBe(expected);
	});
});

describe('project — taxable-bucket taxation', () => {
	test('dividends are taxed annually while working (15% bracket)', () => {
		const p = project(baseInputs());
		const r = p.rows[0];
		// $200k bucket × 2% = $4k of dividends, on top of high ordinary income.
		expect(r.dividendsCents).toBe(4_000_00);
		expect(r.capitalGainsTaxCents).toBe(Math.round(4_000_00 * 0.15));
	});

	test('bridge-year gains largely fall in the 0% LTCG bracket', () => {
		// Retire at 40: taxable withdrawals with almost no ordinary income.
		const p = project(baseInputs({ retirementAge: 40 }));
		const at41 = p.rows.find((r) => r.age === 41);
		expect(at41!.withdrawalTaxableCents).toBeGreaterThan(0);
		// Realized gain + dividends stay under the (inflating) 0% breakpoint.
		expect(at41!.capitalGainsTaxCents).toBe(0);
	});

	test('taxable withdrawals consume basis proportionally', () => {
		const p = project(
			baseInputs({ retirementAge: 40, nominalReturnPct: 0, inflationPct: 0 }),
		);
		const before = p.rows.find((r) => r.age === 40);
		const after = p.rows.find((r) => r.age === 41);
		// Basis fraction is 0.7 (140k/200k) + dividends added as basis;
		// withdrawing must reduce basis by ~70% of the withdrawal.
		expect(after!.taxableBasisCents).toBeLessThan(before!.taxableBasisCents);
		expect(after!.taxableBasisCents).toBeGreaterThan(0);
	});

	test('surplus saved to taxable is new basis (no phantom gains)', () => {
		const p = project(
			baseInputs({ nominalReturnPct: 0, inflationPct: 0, wageGrowthPct: 0 }),
		);
		// Zero growth: surplus contributions add balance and basis equally,
		// and reinvested dividends add basis only — so the embedded gain can
		// only shrink from the initial 60k, never grow.
		let prevGain = 60_000_00;
		for (const r of p.rows.slice(0, 5)) {
			const gain = r.taxableCents - r.taxableBasisCents;
			expect(gain).toBeLessThanOrEqual(prevGain);
			expect(gain).toBeGreaterThanOrEqual(0);
			prevGain = gain;
		}
	});
});

describe('project — cash bucket', () => {
	const withCash = (knobs?: Partial<EngineInputs['knobs']>) => {
		const inputs = baseInputs(knobs);
		inputs.buckets.cashCents = 50_000_00;
		return inputs;
	};

	test('cash earns inflation + 1% real; interest is ordinary income', () => {
		const p = project(withCash({ inflationPct: 0.025 }));
		const r1 = p.rows[1];
		const expectedRate = 1.025 * 1.01 - 1;
		expect(r1.cashInterestCents).toBe(Math.round(50_000_00 * expectedRate));
	});

	test('zero inflation → cash earns exactly the 1% real return', () => {
		const p = project(withCash({ inflationPct: 0 }));
		expect(p.rows[1].cashInterestCents).toBe(Math.round(50_000_00 * 0.01));
	});

	test('deficits exhaust cash before touching taxable investments', () => {
		const p = project(withCash({ retirementAge: 40 }));
		const at40 = p.rows.find((r) => r.age === 40);
		expect(at40!.withdrawalCashCents).toBeGreaterThan(0);
		// Taxable is only tapped once cash is fully drained.
		if (at40!.withdrawalTaxableCents > 0) {
			expect(at40!.cashCents).toBe(0);
		}
	});

	test('cash counts in net worth', () => {
		const base = project(baseInputs()).rows[0].netWorthCents;
		const plus = project(withCash()).rows[0].netWorthCents;
		expect(plus - base).toBe(50_000_00);
	});
});

describe('project — shortfall means empty buckets', () => {
	test('no phantom cent-level shortfall while buckets hold money', () => {
		// Large taxable bucket + gap years before the deferred annuity: the
		// dividend-tax rounding used to leave a cents-sized residue that was
		// reported as a shortfall despite millions still invested.
		const inputs = baseInputs({ retirementAge: 54 });
		inputs.buckets.taxableCents = 5_000_000_00;
		inputs.buckets.taxableBasisCents = 3_500_000_00;
		const p = project(inputs);
		expect(p.firstShortfallAge).toBeNull();
		for (const r of p.rows) {
			expect(r.shortfallCents).toBe(0);
		}
	});
});

describe('project — investment growth (economic income)', () => {
	test('year 0 accrues no growth; year 1 growth covers all buckets', () => {
		const inputs = baseInputs();
		inputs.buckets.cashCents = 50_000_00;
		const p = project(inputs);
		expect(p.rows[0].investmentGrowthCents).toBe(0);
		const r0 = p.rows[0];
		const r1 = p.rows[1];
		const invested0 = r0.taxableCents + r0.deferredCents + r0.rothCents;
		// Start-of-year-1 balances are r0's end-of-year balances; invested
		// buckets grow at the nominal return, cash at inflation + 1% real.
		const expected =
			Math.round(r0.taxableCents * 0.06) +
			Math.round(r0.deferredCents * 0.06) +
			Math.round(r0.rothCents * 0.06) +
			r1.cashInterestCents;
		expect(Math.abs(r1.investmentGrowthCents - expected)).toBeLessThanOrEqual(
			2,
		);
		expect(r1.investmentGrowthCents).toBeGreaterThan(
			Math.round(invested0 * 0.059),
		);
	});
});

describe('project — wage growth tracking', () => {
	test('null wage growth resolves to the inflation rate', () => {
		const tracked = project(
			baseInputs({ wageGrowthPct: null, inflationPct: 0.03 }),
		);
		const explicit = project(
			baseInputs({ wageGrowthPct: 0.03, inflationPct: 0.03 }),
		);
		expect(tracked.rows[5].salaryCents).toBe(explicit.rows[5].salaryCents);
	});
});

describe('project — gross-frame health line', () => {
	test('working: full premium expense vs employer-share subsidy → out-of-pocket = employee share', () => {
		const p = project(baseInputs());
		const r = p.rows[0];
		expect(r.healthInKindCents).toBe(15_000_00);
		expect(r.healthExpenseCents).toBe(21_000_00); // both shares
		expect(r.expensesByCategory['Health care (insured)']).toBe(21_000_00);
	});

	test('deferred gap: full premium as private-coverage proxy, no subsidy', () => {
		const p = project(baseInputs({ retirementAge: 40, inflationPct: 0 }));
		const at50 = p.rows.find((r) => r.age === 50);
		expect(at50!.healthExpenseCents).toBe(21_000_00);
		expect(at50!.healthInKindCents).toBe(0);
	});

	test('Medicare without FEHB: subsidy + Part B + medigap/Part D premiums', () => {
		const p = project(baseInputs({ retirementAge: 40, inflationPct: 0 }));
		const at66 = p.rows.find((r) => r.age === 66);
		expect(at66!.healthExpenseCents).toBe(10_000_00 + 2_435_00 + 2_600_00);
		expect(at66!.healthInKindCents).toBe(10_000_00);
	});

	test('FEHB annuitant on Medicare: both coverages, both subsidies', () => {
		const p = project(baseInputs({ retirementAge: 57, inflationPct: 0 }));
		const at66 = p.rows.find((r) => r.age === 66);
		expect(at66!.healthExpenseCents).toBe(21_000_00 + 2_435_00 + 10_000_00);
		expect(at66!.healthInKindCents).toBe(15_000_00 + 10_000_00);
	});

	test('immediate retiree keeps FEHB, then stacks Medicare at 65', () => {
		const p = project(baseInputs({ retirementAge: 57 }));
		const at60 = p.rows.find((r) => r.age === 60);
		const at65 = p.rows.find((r) => r.age === 65);
		expect(at60!.healthInKindCents).toBeGreaterThan(0);
		expect(at65!.healthInKindCents).toBeGreaterThan(at60!.healthInKindCents);
	});

	test('deferred separation has a gap: nothing until Medicare', () => {
		const p = project(baseInputs({ retirementAge: 40 }));
		const at50 = p.rows.find((r) => r.age === 50);
		const at64 = p.rows.find((r) => r.age === 64);
		const at65 = p.rows.find((r) => r.age === 65);
		expect(at50!.healthInKindCents).toBe(0);
		expect(at64!.healthInKindCents).toBe(0);
		expect(at65!.healthInKindCents).toBeGreaterThan(0);
	});

	test('subsidy and expense cancel: cash flow nets to true out-of-pocket', () => {
		// Zero inflation/growth working year: net cash flow must equal
		// salary − TSP − FERS − employee health share − user expenses − taxes,
		// i.e. the gross health pair nets out exactly.
		const p = project(
			baseInputs({ inflationPct: 0, nominalReturnPct: 0, wageGrowthPct: 0 }),
		);
		const r = p.rows[0];
		const expected =
			r.salaryCents -
			r.employeeTspTraditionalCents -
			r.employeeTspRothCents -
			r.fersContributionCents -
			6_000_00 - // employee FEHB share
			(30_000_00 + 12_000_00) - // user expense rows
			(r.federalTaxCents +
				r.capitalGainsTaxCents +
				r.stateTaxCents +
				r.ficaCents);
		expect(r.netCashFlowCents).toBe(expected);
	});
});

describe('project — economics sanity', () => {
	test('higher returns → more terminal wealth', () => {
		const low = project(baseInputs({ nominalReturnPct: 0.04 }));
		const high = project(baseInputs({ nominalReturnPct: 0.08 }));
		expect(high.rows.at(-1)!.netWorthCents).toBeGreaterThan(
			low.rows.at(-1)!.netWorthCents,
		);
	});

	test('retiring later → more terminal wealth', () => {
		const early = project(baseInputs({ retirementAge: 45 }));
		const late = project(baseInputs({ retirementAge: 60 }));
		expect(late.rows.at(-1)!.netWorthCents).toBeGreaterThan(
			early.rows.at(-1)!.netWorthCents,
		);
	});

	test('real net worth ≤ nominal net worth in future years', () => {
		const p = project(baseInputs());
		for (const r of p.rows.slice(1)) {
			expect(r.netWorthRealCents).toBeLessThanOrEqual(r.netWorthCents);
		}
	});

	test('balances never go negative; shortfalls are flagged instead', () => {
		// Absurd spending forces exhaustion.
		const inputs = baseInputs({ retirementAge: 40 });
		inputs.expenses.push({
			name: 'Yacht',
			annualCents: 400_000_00,
			applies: 'always',
		});
		const p = project(inputs);
		for (const r of p.rows) {
			expect(r.taxableCents).toBeGreaterThanOrEqual(0);
			expect(r.deferredCents).toBeGreaterThanOrEqual(0);
			expect(r.rothCents).toBeGreaterThanOrEqual(0);
		}
		expect(p.firstShortfallAge).not.toBeNull();
	});

	test('bucket conservation: net worth reflects flows (no money invented)', () => {
		const p = project(
			baseInputs({ nominalReturnPct: 0, inflationPct: 0, wageGrowthPct: 0 }),
		);
		for (let i = 1; i < p.rows.length; i++) {
			const prev = p.rows[i - 1];
			const r = p.rows[i];
			const inflows =
				r.employeeTspTraditionalCents +
				r.employeeTspRothCents +
				r.employerTspCents;
			// With zero growth, net worth change = TSP contributions + net cash
			// flow (surplus saved, deficits withdrawn) — unless a shortfall
			// truncated the draw.
			if (r.shortfallCents === 0) {
				expect(
					Math.abs(
						r.netWorthCents -
							(prev.netWorthCents + inflows + r.netCashFlowCents),
					),
				).toBeLessThan(10);
			}
		}
	});
});
