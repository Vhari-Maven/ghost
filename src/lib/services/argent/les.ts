// DFAS civilian Leave & Earnings Statement (LES) import.
//
// `parseLesText` is a pure function over the PDF's extracted text so it can
// be unit-tested without a PDF; `parseLesPdf` wraps text extraction.

import { extractText, getDocumentProxy } from 'unpdf';

// Federal pay: 26 pay periods per year.
const PAY_PERIODS_PER_YEAR = 26;

const FERS_KNOWN_RATES = [0.008, 0.031, 0.044];

export interface ParsedLes {
	// Job-screen fields
	salaryCents: number | null; // adjusted basic pay (annual)
	serviceStartDate: string | null; // ISO, from SCD Leave
	tspTraditionalPct: number | null; // fraction of salary
	tspRothPct: number | null;
	fersContributionPct: number | null;
	employerHealthCents: number | null; // annualized FEHB paid by government
	employeeHealthCents: number | null; // annualized FEHB deduction
	// Context for the review banner
	payPeriodEnd: string | null; // ISO
	gradeStep: string | null; // e.g. "GS 15 07"
	warnings: string[];
}

function money(s: string): number {
	return Math.round(Number(s.replace(/,/g, '')) * 100);
}

function usDateToIso(s: string): string | null {
	const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
	return m ? `${m[3]}-${m[1]}-${m[2]}` : null;
}

const MONEY = String.raw`([\d,]+\.\d{2})`;

export function parseLesText(text: string): ParsedLes {
	const warnings: string[] = [];
	const find = (re: RegExp): RegExpMatchArray | null => text.match(re);

	// Field 7: "Basic Pay + Locality/Market Adj = Adjusted Basic Pay" followed
	// by three amounts; the third is the annual adjusted basic pay.
	let salaryCents: number | null = null;
	const basicPay = find(
		new RegExp(String.raw`Adjusted Basic Pay\s+${MONEY}\s+${MONEY}\s+${MONEY}`),
	);
	if (basicPay) {
		salaryCents = money(basicPay[3]);
		const sum = money(basicPay[1]) + money(basicPay[2]);
		if (Math.abs(sum - salaryCents) > 100) {
			warnings.push('Basic + locality pay did not sum to adjusted basic pay.');
		}
	} else {
		warnings.push('Could not find adjusted basic pay.');
	}

	// Field 11: SCD Leave — the service computation date.
	const scd = find(/SCD Leave\s+(\d{2}\/\d{2}\/\d{4})/);
	const serviceStartDate = scd ? usDateToIso(scd[1]) : null;
	if (!serviceStartDate)
		warnings.push('Could not find SCD (service start date).');

	// Field 4: pay plan / grade / step.
	const grade = find(/Pay Plan\/Grade\/Step\s+([A-Z]{2})\s+(\d{2})\s+(\d{2})/);
	const gradeStep = grade
		? `${grade[1]}-${grade[2]} step ${Number(grade[3])}`
		: null;

	// Field 1: pay period end.
	const ppe = find(/Pay Period End\s+(\d{2}\/\d{2}\/\d{4})/);
	const payPeriodEnd = ppe ? usDateToIso(ppe[1]) : null;

	// Current gross pay for the period — the denominator for contribution rates.
	const gross = find(new RegExp(String.raw`GROSS PAY\s+${MONEY}`));
	const grossCents = gross ? money(gross[1]) : null;
	if (grossCents == null) warnings.push('Could not find current gross pay.');

	// The FEHB amount appears twice: as an employee deduction (before the
	// "BENEFITS PAID BY GOVERNMENT" section) and as the employer share (after).
	const benefitsIdx = text.search(/BENEFITS PAID BY GOVERNMENT/i);
	const deductionsText = benefitsIdx >= 0 ? text.slice(0, benefitsIdx) : text;
	const benefitsText = benefitsIdx >= 0 ? text.slice(benefitsIdx) : '';

	// Annualized amounts are stored penny-free (nearest dollar).
	const annualize = (perPeriodCents: number) =>
		Math.round((perPeriodCents * PAY_PERIODS_PER_YEAR) / 100) * 100;

	const fehbDeduction = deductionsText.match(
		new RegExp(String.raw`FEHB\s+\d*\s*${MONEY}\s+${MONEY}`),
	);
	const employeeHealthCents = fehbDeduction
		? annualize(money(fehbDeduction[1]))
		: null;
	if (employeeHealthCents == null)
		warnings.push('Could not find employee FEHB deduction.');

	const fehbEmployer = benefitsText.match(
		new RegExp(String.raw`FEHB\s+${MONEY}\s+${MONEY}`),
	);
	const employerHealthCents = fehbEmployer
		? annualize(money(fehbEmployer[1]))
		: null;
	if (employerHealthCents == null)
		warnings.push('Could not find employer FEHB contribution.');

	// FERS employee deduction → snap the per-period rate to a known cohort rate.
	let fersContributionPct: number | null = null;
	const fers = deductionsText.match(
		new RegExp(String.raw`RETIRE,\s*FERS\s+[A-Z]*\s*${MONEY}\s+${MONEY}`),
	);
	if (fers && grossCents) {
		const rate = money(fers[1]) / grossCents;
		fersContributionPct = FERS_KNOWN_RATES.reduce((best, r) =>
			Math.abs(r - rate) < Math.abs(best - rate) ? r : best,
		);
		if (Math.abs(fersContributionPct - rate) > 0.002) {
			warnings.push(
				`FERS deduction rate ${(rate * 100).toFixed(2)}% did not match a known cohort rate; nearest used.`,
			);
		}
	} else {
		warnings.push('Could not find FERS deduction.');
	}

	// TSP: Roth shows as a "ROTH DED" deduction; traditional TSP shows in the
	// "TAX DEFERRED WAGES" summary row (absent/blank when not contributing).
	let tspRothPct: number | null = null;
	const roth = deductionsText.match(
		new RegExp(String.raw`ROTH DED\s+${MONEY}\s+${MONEY}`),
	);
	if (roth && grossCents) {
		tspRothPct = money(roth[1]) / grossCents;
	} else {
		tspRothPct = 0;
	}

	let tspTraditionalPct: number | null = null;
	const deferred = find(
		new RegExp(String.raw`TAX DEFERRED WAGES\s+${MONEY}\s+${MONEY}`),
	);
	if (deferred && grossCents) {
		tspTraditionalPct = money(deferred[1]) / grossCents;
	} else {
		tspTraditionalPct = 0;
	}

	// Round the derived fractions to something a human can read on the form.
	const round4 = (v: number | null) =>
		v == null ? null : Math.round(v * 10000) / 10000;

	return {
		salaryCents,
		serviceStartDate,
		tspTraditionalPct: round4(tspTraditionalPct),
		tspRothPct: round4(tspRothPct),
		fersContributionPct,
		employerHealthCents,
		employeeHealthCents,
		payPeriodEnd,
		gradeStep,
		warnings,
	};
}

export async function parseLesPdf(data: Uint8Array): Promise<ParsedLes> {
	const pdf = await getDocumentProxy(data);
	const { text } = await extractText(pdf, { mergePages: true });
	return parseLesText(text);
}
