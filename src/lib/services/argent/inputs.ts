import { eq } from 'drizzle-orm';
import type { EngineInputs } from '$lib/argent/engine/types';
import { db } from '$lib/db';
import {
	type Account,
	type Assumptions,
	accounts,
	assumptions,
	earningsHistory,
	expenses,
	job,
} from '$lib/db/schema';

// Singleton rows are created with sensible defaults on first access so the
// forms always have something to edit.

const JOB_DEFAULTS = {
	id: 1,
	salaryCents: 195_200_00, // ~GS pay cap; edit on the Job screen
	serviceStartDate: '2009-05-01',
	tspTraditionalPct: 0.05,
	tspRothPct: 0.05,
	fersContributionPct: 0.008, // pre-2013 cohort
	employerHealthCents: 8_000_00,
	employeeHealthCents: 2_400_00,
};

const ASSUMPTIONS_DEFAULTS = {
	id: 1,
	birthDate: '1987-02-25',
	inflationPct: 0.03,
	nominalReturnPct: 0.1,
	wageGrowthPct: null,
	retirementAge: 57,
	ssClaimingAge: 67,
	stateTaxPct: 0.06,
	endAge: 85,
};

export function getJob() {
	const row = db.select().from(job).where(eq(job.id, 1)).get();
	if (row) return row;
	return db.insert(job).values(JOB_DEFAULTS).returning().get();
}

export function getAssumptions(): Assumptions {
	const row = db.select().from(assumptions).where(eq(assumptions.id, 1)).get();
	if (row) return row;
	return db.insert(assumptions).values(ASSUMPTIONS_DEFAULTS).returning().get();
}

export function bucketsFromAccounts(rows: Account[]) {
	let cashCents = 0;
	let taxableCents = 0;
	let taxableBasisCents = 0;
	let deferredCents = 0;
	let rothCents = 0;
	let rothBasisCents = 0;
	for (const a of rows) {
		switch (a.kind) {
			case 'tsp-traditional':
			case 'ira-traditional':
				deferredCents += a.balanceCents;
				break;
			case 'tsp-roth':
			case 'ira-roth':
				rothCents += a.balanceCents;
				rothBasisCents += a.rothBasisCents ?? 0;
				break;
			case 'taxable':
				taxableCents += a.balanceCents;
				// Missing basis = assume no embedded gains (until entered).
				taxableBasisCents += a.costBasisCents ?? a.balanceCents;
				break;
			default:
				cashCents += a.balanceCents;
		}
	}
	return {
		cashCents,
		taxableCents,
		taxableBasisCents,
		deferredCents,
		rothCents,
		rothBasisCents,
	};
}

export function getEngineInputs(): EngineInputs {
	const jobRow = getJob();
	const assumptionsRow = getAssumptions();
	const accountRows = db.select().from(accounts).all();
	const expenseRows = db.select().from(expenses).all();
	const earningsRows = db.select().from(earningsHistory).all();

	return {
		birthDate: assumptionsRow.birthDate,
		currentYear: new Date().getFullYear(),
		job: {
			salaryCents: jobRow.salaryCents,
			serviceStartDate: jobRow.serviceStartDate,
			tspTraditionalPct: jobRow.tspTraditionalPct,
			tspRothPct: jobRow.tspRothPct,
			fersContributionPct: jobRow.fersContributionPct,
			employerHealthCents: jobRow.employerHealthCents,
			employeeHealthCents: jobRow.employeeHealthCents,
		},
		buckets: bucketsFromAccounts(accountRows),
		expenses: expenseRows.map((e) => ({
			name: e.name,
			annualCents: e.annualCents,
			applies: e.applies,
		})),
		earningsHistory: earningsRows.map((r) => ({
			year: r.year,
			earningsCents: r.earningsCents,
		})),
		knobs: {
			inflationPct: assumptionsRow.inflationPct,
			nominalReturnPct: assumptionsRow.nominalReturnPct,
			wageGrowthPct: assumptionsRow.wageGrowthPct,
			retirementAge: assumptionsRow.retirementAge,
			ssClaimingAge: assumptionsRow.ssClaimingAge,
			stateTaxPct: assumptionsRow.stateTaxPct,
			endAge: assumptionsRow.endAge,
		},
	};
}
