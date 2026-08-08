import { describe, expect, test } from 'vitest';
import { seppAnnualPaymentCents } from './sepp';

describe('seppAnnualPaymentCents', () => {
	test('zero balance → zero payment', () => {
		expect(seppAnnualPaymentCents(0, 45, 0.05)).toBe(0);
	});

	test('amortization at age 40, 5%: $1M over 45.7 years', () => {
		const p = seppAnnualPaymentCents(1_000_000_00, 40, 0.07);
		// rate capped at 5%; P = B·r/(1−(1+r)^−n)
		const expected = (1_000_000_00 * 0.05) / (1 - 1.05 ** -45.7);
		expect(p).toBe(Math.round(expected));
		// Roughly 5.6% of the balance — sanity band.
		expect(p).toBeGreaterThan(5_000_000);
		expect(p).toBeLessThan(6_500_000);
	});

	test('older start age → shorter horizon → larger payment', () => {
		const at40 = seppAnnualPaymentCents(1_000_000_00, 40, 0.05);
		const at55 = seppAnnualPaymentCents(1_000_000_00, 55, 0.05);
		expect(at55).toBeGreaterThan(at40);
	});

	test('rate is capped at 5%', () => {
		expect(seppAnnualPaymentCents(1_000_000_00, 45, 0.2)).toBe(
			seppAnnualPaymentCents(1_000_000_00, 45, 0.05),
		);
	});
});
