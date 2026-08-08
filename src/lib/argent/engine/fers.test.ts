import { describe, expect, test } from 'vitest';
import { determineFers, dietCola } from './fers';

describe('dietCola', () => {
	test('CPI at or below 2% passes through', () => {
		expect(dietCola(0.015)).toBeCloseTo(0.015, 10);
	});
	test('CPI between 2% and 3% → 2%', () => {
		expect(dietCola(0.027)).toBeCloseTo(0.02, 10);
	});
	test('CPI above 3% → CPI − 1%', () => {
		expect(dietCola(0.05)).toBeCloseTo(0.04, 10);
	});
});

describe('determineFers', () => {
	const base = {
		high3Cents: 200_000_00,
		ssMonthlyAt62TodayCents: 2_000_00,
		inflationFactorAtSeparation: 1,
	};

	test('separation at 40 with 18 years → deferred at 62, 1.0%, no SRS', () => {
		const d = determineFers({ ...base, separationAge: 40, serviceYears: 18 });
		expect(d.eligible).toBe(true);
		expect(d.immediate).toBe(false);
		expect(d.commencementAge).toBe(62);
		expect(d.multiplier).toBe(0.01);
		expect(d.srsEligible).toBe(false);
		expect(d.annualAnnuityAtCommencementCents).toBe(
			Math.round(0.01 * 200_000_00 * 18),
		);
	});

	test('MRA + 30 → immediate with SRS', () => {
		const d = determineFers({ ...base, separationAge: 57, serviceYears: 35 });
		expect(d.immediate).toBe(true);
		expect(d.commencementAge).toBe(57);
		expect(d.multiplier).toBe(0.01);
		expect(d.srsEligible).toBe(true);
		// SRS = 2,000 × 12 × 35/40
		expect(d.srsAnnualCents).toBe(Math.round(2_000_00 * 12 * (35 / 40)));
	});

	test('62 with 20+ years → 1.1% multiplier, no SRS', () => {
		const d = determineFers({ ...base, separationAge: 62, serviceYears: 25 });
		expect(d.immediate).toBe(true);
		expect(d.multiplier).toBe(0.011);
		expect(d.srsEligible).toBe(false);
	});

	test('MRA+10 window (57 with 18 years) → deferred to 62, not reduced-immediate', () => {
		const d = determineFers({ ...base, separationAge: 57, serviceYears: 18 });
		expect(d.immediate).toBe(false);
		expect(d.commencementAge).toBe(62);
		expect(d.srsEligible).toBe(false);
	});

	test('under 5 years of service → no annuity', () => {
		const d = determineFers({ ...base, separationAge: 30, serviceYears: 4 });
		expect(d.eligible).toBe(false);
		expect(d.annualAnnuityAtCommencementCents).toBe(0);
	});
});
