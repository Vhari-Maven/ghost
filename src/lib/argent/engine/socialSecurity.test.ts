import { describe, expect, test } from 'vitest';
import { claimingFactor, piaTodayMonthlyCents } from './socialSecurity';

describe('claimingFactor', () => {
	test('at FRA (67) → 1.0', () => {
		expect(claimingFactor(67)).toBeCloseTo(1, 10);
	});

	test('at 62 → 70% (36 × 5/9% + 24 × 5/12%)', () => {
		expect(claimingFactor(62)).toBeCloseTo(0.7, 10);
	});

	test('at 70 → 124%', () => {
		expect(claimingFactor(70)).toBeCloseTo(1.24, 10);
	});

	test('at 64 → 80%', () => {
		expect(claimingFactor(64)).toBeCloseTo(1 - 36 * (5 / 900), 10);
	});
});

describe('piaTodayMonthlyCents', () => {
	test('zero history and no future work → zero PIA', () => {
		const pia = piaTodayMonthlyCents({
			earningsHistory: [],
			currentYear: 2026,
			currentSalaryCents: 0,
			wageGrowthRate: 0.025,
			wageIndexRate: 0.025,
			separationYear: 2026,
		});
		expect(pia).toBe(0);
	});

	test('bend-point math: AIME entirely in the 90% band', () => {
		// One year of $12,000 → AIME = 12,000/420 months ≈ $28.57 → 90%.
		const pia = piaTodayMonthlyCents({
			earningsHistory: [{ year: 2026, earningsCents: 12_000_00 }],
			currentYear: 2026,
			currentSalaryCents: 0,
			wageGrowthRate: 0,
			wageIndexRate: 0,
			separationYear: 2026,
		});
		expect(pia).toBe(Math.round((12_000_00 / 420) * 0.9));
	});

	test('past earnings are indexed upward', () => {
		const flat = piaTodayMonthlyCents({
			earningsHistory: [{ year: 2016, earningsCents: 50_000_00 }],
			currentYear: 2026,
			currentSalaryCents: 0,
			wageGrowthRate: 0,
			wageIndexRate: 0,
			separationYear: 2026,
		});
		const indexed = piaTodayMonthlyCents({
			earningsHistory: [{ year: 2016, earningsCents: 50_000_00 }],
			currentYear: 2026,
			currentSalaryCents: 0,
			wageGrowthRate: 0,
			wageIndexRate: 0.03,
			separationYear: 2026,
		});
		expect(indexed).toBeGreaterThan(flat);
	});

	test('working longer raises the PIA', () => {
		const base = {
			earningsHistory: [{ year: 2026, earningsCents: 150_000_00 }],
			currentYear: 2026,
			currentSalaryCents: 150_000_00,
			wageGrowthRate: 0.025,
			wageIndexRate: 0.025,
		};
		const early = piaTodayMonthlyCents({ ...base, separationYear: 2027 });
		const late = piaTodayMonthlyCents({ ...base, separationYear: 2040 });
		expect(late).toBeGreaterThan(early);
	});

	test('a realistic full-cap career lands in a plausible PIA range', () => {
		// 35 years at the wage base → AIME ≈ wage base / 12 → PIA well above
		// bend 1, below the cap-ish. Sanity band: $3,000–$5,500/mo today.
		const history = Array.from({ length: 35 }, (_, i) => ({
			year: 1992 + i,
			earningsCents: 184_500_00,
		}));
		const pia = piaTodayMonthlyCents({
			earningsHistory: history,
			currentYear: 2026,
			currentSalaryCents: 0,
			wageGrowthRate: 0,
			wageIndexRate: 0, // no indexing: treat all years as today's dollars
			separationYear: 2026,
		});
		expect(pia).toBeGreaterThan(3_000_00);
		expect(pia).toBeLessThan(5_500_00);
	});
});
