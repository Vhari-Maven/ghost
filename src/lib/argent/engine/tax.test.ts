import { describe, expect, test } from 'vitest';
import {
	capitalGainsTaxCents,
	federalTaxCents,
	ficaCents,
	taxableSocialSecurityCents,
} from './tax';

describe('federalTaxCents', () => {
	test('zero and negative taxable income owe nothing', () => {
		expect(federalTaxCents(0, 1)).toBe(0);
		expect(federalTaxCents(-5_000_00, 1)).toBe(0);
	});

	test('income inside the 10% bracket', () => {
		expect(federalTaxCents(10_000_00, 1)).toBe(1_000_00);
	});

	test('spans brackets: $60,000 taxable', () => {
		// 10% × 12,400 + 12% × (50,400−12,400) + 22% × (60,000−50,400)
		const expected = 1_240_00 + 4_560_00 + Math.round(9_600_00 * 0.22);
		expect(federalTaxCents(60_000_00, 1)).toBe(expected);
	});

	test('bracket thresholds shift with inflation', () => {
		// With 2× inflation, $24,800 is the top of the 10% bracket.
		expect(federalTaxCents(24_800_00, 2)).toBe(2_480_00);
	});
});

describe('ficaCents', () => {
	test('below wage base: 7.65%', () => {
		expect(ficaCents(100_000_00, 1)).toBe(Math.round(100_000_00 * 0.0765));
	});

	test('SS portion caps at the wage base', () => {
		const wage = 300_000_00;
		const expected =
			184_500_00 * 0.062 + wage * 0.0145 + (wage - 200_000_00) * 0.009;
		expect(ficaCents(wage, 1)).toBe(Math.round(expected));
	});

	test('no wages, no FICA', () => {
		expect(ficaCents(0, 1)).toBe(0);
	});
});

describe('capitalGainsTaxCents', () => {
	test('no gains → no tax', () => {
		expect(capitalGainsTaxCents(0, 100_000_00, 1)).toBe(0);
	});

	test('gains inside the 0% bracket (low ordinary income) are untaxed', () => {
		// $30k of gains on top of $10k ordinary — all under the $49,450 breakpoint.
		expect(capitalGainsTaxCents(30_000_00, 10_000_00, 1)).toBe(0);
	});

	test('gains straddling the 0/15% breakpoint are taxed only above it', () => {
		// $20k of gains starting at $40k ordinary: $9,450 at 0%, $10,550 at 15%.
		const expected = Math.round(10_550_00 * 0.15);
		expect(capitalGainsTaxCents(20_000_00, 40_000_00, 1)).toBe(expected);
	});

	test('high ordinary income pushes all gains to 15%', () => {
		expect(capitalGainsTaxCents(10_000_00, 150_000_00, 1)).toBe(
			Math.round(10_000_00 * 0.15),
		);
	});

	test('breakpoints index with inflation', () => {
		// At 2× inflation the 0% bracket extends to $98,900.
		expect(capitalGainsTaxCents(50_000_00, 20_000_00, 2)).toBe(0);
	});
});

describe('taxableSocialSecurityCents', () => {
	test('low provisional income → untaxed', () => {
		expect(taxableSocialSecurityCents(20_000_00, 10_000_00)).toBe(0);
	});

	test('middle tier → up to 50%', () => {
		// SS 20k, other 20k → provisional 30k → min(10k, (30k−25k)/2) = 2.5k
		expect(taxableSocialSecurityCents(20_000_00, 20_000_00)).toBe(2_500_00);
	});

	test('high income → capped at 85%', () => {
		expect(taxableSocialSecurityCents(30_000_00, 200_000_00)).toBe(
			Math.round(30_000_00 * 0.85),
		);
	});

	test('no benefit, nothing taxable', () => {
		expect(taxableSocialSecurityCents(0, 100_000_00)).toBe(0);
	});
});
