import { SEPP_MAX_RATE, SINGLE_LIFE_EXPECTANCY } from './constants';

/**
 * Annual SEPP (72(t)) payment via the fixed amortization method: the
 * deferred balance amortized over single-life expectancy at
 * min(SEPP_MAX_RATE, assumedRate). Fixed in nominal terms once started.
 */
export function seppAnnualPaymentCents(
	deferredBalanceCents: number,
	startAge: number,
	assumedRate: number,
): number {
	if (deferredBalanceCents <= 0) return 0;
	const lifeExpectancy =
		SINGLE_LIFE_EXPECTANCY[Math.min(59, Math.max(40, Math.floor(startAge)))];
	const r = Math.min(SEPP_MAX_RATE, Math.max(0.001, assumedRate));
	const n = lifeExpectancy;
	const payment = (deferredBalanceCents * r) / (1 - (1 + r) ** -n);
	return Math.round(payment);
}
