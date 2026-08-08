// Balance-history CSV import (aggregator export: Date,Balance,Account).
//
// The file is a daily snapshot series per account; we want the latest
// balance for each real account. Two quirks handled here, both observed in
// real exports:
// - the same account can appear under multiple display names (aliases) with
//   an identical balance series — dedupe;
// - different accounts at one institution can share the (...XXXX) suffix
//   (a member number), so the suffix alone is not an identity key. We key
//   on suffix + latest balance: same suffix and same balance = alias.

import type { AccountKind } from '$lib/db/schema';

export interface ParsedAccount {
	name: string; // display name, suffix stripped
	rawName: string;
	balanceCents: number;
	lastDate: string; // ISO
	suggestedKind: AccountKind;
}

export interface ParsedBalances {
	asOfDate: string | null; // newest date in the file
	accounts: ParsedAccount[]; // importable, sorted by balance desc
	skipped: ParsedAccount[]; // zero or negative balances (liabilities etc.)
	warnings: string[];
}

export function suggestKind(name: string): AccountKind {
	if (/thrift savings|\btsp\b/i.test(name)) return 'tsp-traditional';
	if (/roth/i.test(name)) return 'ira-roth';
	if (/\bira\b/i.test(name)) return 'ira-traditional';
	if (/brokerage|invest/i.test(name)) return 'taxable';
	if (/checking|savings|banking|share|cash|money market/i.test(name))
		return 'cash';
	return 'taxable';
}

function cleanName(rawName: string): string {
	return rawName
		.replace(/\s*\(\.\.\.[^)]*\)\s*$/, '')
		.replace(/\s+/g, ' ')
		.trim();
}

export function parseBalancesCsv(text: string): ParsedBalances {
	const warnings: string[] = [];
	const lines = text.replace(/\r/g, '').trim().split('\n');

	const header = lines[0]?.toLowerCase() ?? '';
	if (
		!(
			header.includes('date') &&
			header.includes('balance') &&
			header.includes('account')
		)
	) {
		return {
			asOfDate: null,
			accounts: [],
			skipped: [],
			warnings: [
				'Not a recognized balances CSV (expected Date,Balance,Account header).',
			],
		};
	}

	// Latest row per raw account name.
	const latestByName = new Map<
		string,
		{ date: string; balanceCents: number }
	>();
	let badRows = 0;
	for (const line of lines.slice(1)) {
		if (line === '') continue;
		const m = line.match(/^(\d{4}-\d{2}-\d{2}),(-?[\d.]+),(.+)$/);
		if (!m) {
			badRows++;
			continue;
		}
		const [, date, balance, rawName] = m;
		const prev = latestByName.get(rawName);
		if (!prev || date >= prev.date) {
			// Stored penny-free: round to the nearest dollar.
			latestByName.set(rawName, {
				date,
				balanceCents: Math.round(Number(balance)) * 100,
			});
		}
	}
	if (badRows > 0) warnings.push(`${badRows} unparseable row(s) skipped.`);

	// Dedupe aliases: same (...XXXX) suffix + same latest balance = one account.
	// Keep the alias with the longest (most descriptive) name.
	const byIdentity = new Map<
		string,
		{ rawName: string; date: string; balanceCents: number }
	>();
	for (const [rawName, { date, balanceCents }] of latestByName) {
		const suffix = rawName.match(/\(\.\.\.([^)]*)\)\s*$/)?.[1] ?? rawName;
		const identity = `${suffix}|${balanceCents}`;
		const existing = byIdentity.get(identity);
		if (!existing || rawName.length > existing.rawName.length) {
			byIdentity.set(identity, { rawName, date, balanceCents });
		}
	}

	const all: ParsedAccount[] = [...byIdentity.values()]
		.map(({ rawName, date, balanceCents }) => ({
			name: cleanName(rawName),
			rawName,
			balanceCents,
			lastDate: date,
			suggestedKind: suggestKind(rawName),
		}))
		.sort((a, b) => b.balanceCents - a.balanceCents);

	const accounts = all.filter((a) => a.balanceCents > 0);
	const skipped = all.filter((a) => a.balanceCents <= 0);

	const asOfDate = all.reduce<string | null>(
		(max, a) => (max === null || a.lastDate > max ? a.lastDate : max),
		null,
	);

	const stale = accounts.filter(
		(a) => asOfDate !== null && a.lastDate < asOfDate,
	);
	for (const s of stale) {
		warnings.push(
			`"${s.name}" last updated ${s.lastDate} (older than the rest of the file).`,
		);
	}

	// Same suffix surviving dedupe = either two real accounts sharing a
	// member number, or one account seen through two connections whose
	// balances drifted. Only a human can tell — flag it.
	const bySuffix = new Map<string, ParsedAccount[]>();
	for (const a of accounts) {
		const suffix = a.rawName.match(/\(\.\.\.([^)]*)\)\s*$/)?.[1] ?? a.rawName;
		bySuffix.set(suffix, [...(bySuffix.get(suffix) ?? []), a]);
	}
	for (const [suffix, group] of bySuffix) {
		if (group.length > 1) {
			warnings.push(
				`(...${suffix}) appears ${group.length}× (${group.map((g) => g.name).join(' / ')}) — ` +
					'possibly the same account via two connections; uncheck one if so.',
			);
		}
	}

	return { asOfDate, accounts, skipped, warnings };
}
