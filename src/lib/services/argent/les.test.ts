import { describe, expect, test } from 'vitest';
import { parseLesText } from './les';

// Synthetic DFAS-shaped extraction text — structure mirrors a real civilian
// LES, numbers are fake. Gross per period 6,000.00; FERS 0.8% = 48.00;
// Roth TSP 10% = 600.00; traditional TSP 5% = 300.00.
const FIXTURE = `DEPARTMENT OF DEFENSE
CIVILIAN LEAVE AND EARNINGS STATEMENT LES
1. Pay Period End 07/25/2026 2. Pay Date 07/31/2026
3. Name DOE JANE Q 4. Pay Plan/Grade/Step GS 14 03
5. Hourly/Daily Rate 75.00 6. Basic OT Rate 75.00
7. Basic Pay + Locality/Market Adj = Adjusted Basic Pay 120,000.00 36,000.00 156,000.00
8. Soc Sec No ***-**-1234 9. Locality % 30.00 10. FLSA Category E
11. SCD Leave 03/15/2012 12. Max Leave Carry Over 240
17. Tax Marital Status Exemptions Add'l FED S 0 0 MD S 0 0
21. Current Year to Date
GROSS PAY 6,000.00 78,000.00
TAXABLE WAGES 5,500.00 71,500.00
NONTAXABLE WAGES 150.00 1,950.00
TAX DEFERRED WAGES 300.00 3,900.00
DEDUCTIONS 2,000.00 26,000.00
NET PAY 4,000.00 52,000.00
CURRENT EARNINGS
REGULAR PAY 80.00 6,000.00
DEDUCTIONS
ALLOTMENT,SV (3) 100.00 1,300.00 FEHB 104 150.00 1,950.00
MEDICARE 87.00 1,131.00 OASDI 372.00 4,836.00
RETIRE, FERS K 48.00 624.00 TAX, FEDERAL 900.00 11,700.00
TAX, STATE MD 275.00 3,575.00 ROTH DED 600.00 7,800.00
LEAVE
BENEFITS PAID BY GOVERNMENT FOR YOU
FEHB 250.00 3,250.00 MEDICARE 87.00 1,131.00
OASDI 372.00 4,836.00 RETIRE, FERS 1,100.00 14,300.00
TSP BASIC 60.00 780.00 TSP MATCHING 240.00 3,120.00
REMARKS
PRETAX FEHB EXCLUSION $ 150.00`;

describe('parseLesText', () => {
	const p = parseLesText(FIXTURE);

	test('parses cleanly with no warnings', () => {
		expect(p.warnings).toEqual([]);
	});

	test('salary is the adjusted basic pay (third amount)', () => {
		expect(p.salaryCents).toBe(156_000_00);
	});

	test('service start date from SCD Leave', () => {
		expect(p.serviceStartDate).toBe('2012-03-15');
	});

	test('FERS rate snaps to the known cohort rate', () => {
		expect(p.fersContributionPct).toBe(0.008);
	});

	test('Roth TSP percent from ROTH DED / gross', () => {
		expect(p.tspRothPct).toBeCloseTo(0.1, 4);
	});

	test('traditional TSP percent from tax-deferred wages / gross', () => {
		expect(p.tspTraditionalPct).toBeCloseTo(0.05, 4);
	});

	test('FEHB: deduction row is employee, benefits row is employer, annualized ×26', () => {
		expect(p.employeeHealthCents).toBe(150_00 * 26);
		expect(p.employerHealthCents).toBe(250_00 * 26);
	});

	test('context fields', () => {
		expect(p.gradeStep).toBe('GS-14 step 3');
		expect(p.payPeriodEnd).toBe('2026-07-25');
	});
});

describe('parseLesText — degraded input', () => {
	test('missing sections produce warnings, not throws', () => {
		const p = parseLesText('not an LES at all');
		expect(p.salaryCents).toBeNull();
		expect(p.serviceStartDate).toBeNull();
		expect(p.warnings.length).toBeGreaterThan(0);
	});

	test('no ROTH DED row means zero Roth percent', () => {
		const p = parseLesText(FIXTURE.replace(/ROTH DED [\d,.]+ [\d,.]+/, ''));
		expect(p.tspRothPct).toBe(0);
	});

	test('blank tax-deferred wages means zero traditional percent', () => {
		const p = parseLesText(
			FIXTURE.replace(
				/TAX DEFERRED WAGES [\d,.]+ [\d,.]+/,
				'TAX DEFERRED WAGES',
			),
		);
		expect(p.tspTraditionalPct).toBe(0);
	});
});
