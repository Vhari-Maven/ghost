import { describe, expect, test } from 'vitest';
import { parseBalancesCsv, suggestKind } from './balances';

// Synthetic fixture with \r\n endings (as real exports have), aliases, a
// shared suffix across two distinct accounts, and a liability.
const FIXTURE = [
	'Date,Balance,Account',
	'2026-01-01,100.00,Checking (...1111)',
	'2026-01-01,900.00,Share Savings (...1111)', // same suffix, different account
	'2026-01-01,5000.00,ONLINE SAVINGS (...2222)',
	'2026-01-01,5000.00,360 Performance Savings (...2222)', // alias of the above
	'2026-01-01,70000.00,Thrift Savings Plan - Civilian (...Thrift Savings Plan - Civilian)',
	'2026-01-01,-250.00,Rewards Card (...3333)',
	'2026-01-02,110.00,Checking (...1111)',
	'2026-01-02,900.00,Share Savings (...1111)',
	'2026-01-02,5100.00,ONLINE SAVINGS (...2222)',
	'2026-01-02,5100.00,360 Performance Savings (...2222)',
	'2026-01-02,71000.00,Thrift Savings Plan - Civilian (...Thrift Savings Plan - Civilian)',
	'2026-01-02,-260.00,Rewards Card (...3333)',
	'2026-01-02,42000.00,Jane Q Doe - Roth IRA Brokerage Account - ****4444 (...4444)',
].join('\r\n');

describe('parseBalancesCsv', () => {
	const p = parseBalancesCsv(FIXTURE);

	test('takes the latest balance per account', () => {
		const checking = p.accounts.find((a) => a.name === 'Checking');
		expect(checking?.balanceCents).toBe(110_00);
		expect(checking?.lastDate).toBe('2026-01-02');
	});

	test('same suffix with different balances stays two accounts, with a warning', () => {
		const names = p.accounts.filter((a) => a.rawName.includes('(...1111)'));
		expect(names.length).toBe(2);
		expect(p.warnings.some((w) => w.includes('(...1111)'))).toBe(true);
	});

	test('aliases (same suffix, same balance) dedupe to the longest name', () => {
		const aliases = p.accounts.filter((a) => a.rawName.includes('(...2222)'));
		expect(aliases.length).toBe(1);
		expect(aliases[0].name).toBe('360 Performance Savings');
		expect(aliases[0].balanceCents).toBe(5_100_00);
	});

	test('liabilities are skipped, not imported', () => {
		expect(p.accounts.some((a) => a.name.includes('Rewards'))).toBe(false);
		expect(p.skipped.some((a) => a.name.includes('Rewards'))).toBe(true);
	});

	test('as-of date is the newest in the file; accounts sorted by balance', () => {
		expect(p.asOfDate).toBe('2026-01-02');
		const balances = p.accounts.map((a) => a.balanceCents);
		expect(balances).toEqual([...balances].sort((a, b) => b - a));
	});

	test('suffix is stripped from display names', () => {
		expect(p.accounts.every((a) => !a.name.includes('(...'))).toBe(true);
	});

	test('kind suggestions', () => {
		const byName = new Map(p.accounts.map((a) => [a.name, a.suggestedKind]));
		expect(byName.get('Thrift Savings Plan - Civilian')).toBe(
			'tsp-traditional',
		);
		expect(
			byName.get('Jane Q Doe - Roth IRA Brokerage Account - ****4444'),
		).toBe('ira-roth');
		expect(byName.get('Checking')).toBe('cash');
	});

	test('garbage input yields a warning, not a throw', () => {
		const bad = parseBalancesCsv('this,is,not\na,balances,file');
		expect(bad.accounts).toEqual([]);
		expect(bad.warnings.length).toBeGreaterThan(0);
	});
});

describe('suggestKind', () => {
	test('common shapes', () => {
		expect(suggestKind('Thrift Savings Plan - Civilian')).toBe(
			'tsp-traditional',
		);
		expect(suggestKind('Roth IRA Brokerage Account')).toBe('ira-roth');
		expect(suggestKind('Traditional IRA')).toBe('ira-traditional');
		expect(suggestKind('Brokerage Account - ****9187')).toBe('taxable');
		expect(suggestKind('Free Easy Checking')).toBe('cash');
		expect(suggestKind('Mystery Holdings')).toBe('taxable');
	});
});
