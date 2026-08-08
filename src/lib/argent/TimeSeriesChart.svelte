<script lang="ts">
interface Series {
	name: string;
	// CSS custom property reference, e.g. 'var(--color-viz-1)'
	color: string;
	values: number[]; // cents, one per year
}

interface Props {
	title: string;
	years: number[];
	ages: number[];
	stacks: Series[];
	// Optional ink-colored overlay line (same units/axis as the stacks).
	overlay?: { name: string; values: number[] } | null;
	valueLabel?: string;
}

let {
	title,
	years,
	ages,
	stacks,
	overlay = null,
	valueLabel = '',
}: Props = $props();

const W = 760;
const H = 280;
const M = { top: 16, right: 56, bottom: 24, left: 56 };
const plotW = W - M.left - M.right;
const plotH = H - M.top - M.bottom;

let hoverIndex: number | null = $state(null);
let svgEl: SVGSVGElement | undefined = $state();

const maxValue = $derived.by(() => {
	let max = 0;
	for (let i = 0; i < years.length; i++) {
		let sum = 0;
		for (const s of stacks) sum += s.values[i] ?? 0;
		max = Math.max(max, sum, overlay?.values[i] ?? 0);
	}
	return max || 1;
});

// Nice-step axis: pick a 1/2/2.5/5 × 10^k step near maxValue/4, then take
// the ceiling in whole steps — keeps the data filling most of the plot
// instead of rounding the max itself (25.3M → step 10M → top 30M, not 50M).
const tickStep = $derived.by(() => {
	const rawStep = maxValue / 4;
	const mag = 10 ** Math.floor(Math.log10(rawStep));
	const norm = rawStep / mag;
	const m =
		norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
	return m * mag;
});

const niceMax = $derived(Math.ceil(maxValue / tickStep) * tickStep);

const ticks = $derived.by(() => {
	const out: number[] = [];
	for (let t = 0; t <= niceMax + tickStep / 2; t += tickStep) out.push(t);
	return out;
});

const x = (i: number) =>
	M.left + (years.length === 1 ? plotW / 2 : (i / (years.length - 1)) * plotW);
const y = (v: number) => M.top + plotH - (v / niceMax) * plotH;

// Cumulative stack tops: cumulative[k][i] = sum of series 0..k at year i.
const cumulative = $derived.by(() => {
	const out: number[][] = [];
	let prev = new Array(years.length).fill(0);
	for (const s of stacks) {
		const row = prev.map((p: number, i: number) => p + (s.values[i] ?? 0));
		out.push(row);
		prev = row;
	}
	return out;
});

function areaPath(lower: number[], upper: number[]): string {
	const top = upper
		.map(
			(v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`,
		)
		.join('');
	const bottom = [...lower.keys()]
		.reverse()
		.map((i) => `L${x(i).toFixed(1)},${y(lower[i]).toFixed(1)}`)
		.join('');
	return `${top}${bottom}Z`;
}

function linePath(values: number[]): string {
	return values
		.map(
			(v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`,
		)
		.join('');
}

const zeros = new Array(years.length).fill(0);

function compact(cents: number): string {
	const v = cents / 100;
	if (Math.abs(v) >= 1_000_000)
		return `$${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
	if (Math.abs(v) >= 1_000) return `$${Math.round(v / 1_000)}K`;
	return `$${Math.round(v)}`;
}

function full(cents: number): string {
	return (cents / 100).toLocaleString('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	});
}

function onPointerMove(e: PointerEvent) {
	if (!svgEl) return;
	const rect = svgEl.getBoundingClientRect();
	const px = ((e.clientX - rect.left) / rect.width) * W;
	const frac = Math.min(1, Math.max(0, (px - M.left) / plotW));
	hoverIndex = Math.round(frac * (years.length - 1));
}

function onKeyDown(e: KeyboardEvent) {
	if (e.key === 'ArrowRight') {
		hoverIndex = Math.min(years.length - 1, (hoverIndex ?? 0) + 1);
		e.preventDefault();
	} else if (e.key === 'ArrowLeft') {
		hoverIndex = Math.max(0, (hoverIndex ?? years.length - 1) - 1);
		e.preventDefault();
	} else if (e.key === 'Escape') {
		hoverIndex = null;
	}
}

const tooltipLeftPct = $derived(
	hoverIndex === null ? 0 : (x(hoverIndex) / W) * 100,
);
</script>

<figure class="chart">
	<figcaption>
		<span class="title">{title}</span>
		{#if valueLabel}<span class="value-label">{valueLabel}</span>{/if}
	</figcaption>

	{#if stacks.length > 1 || overlay}
		<div class="legend">
			{#each stacks as s (s.name)}
				<span class="key"><span class="swatch" style="background: {s.color}"></span>{s.name}</span>
			{/each}
			{#if overlay}
				<span class="key"><span class="line-key"></span>{overlay.name}</span>
			{/if}
		</div>
	{/if}

	<div class="plot">
		<svg
			bind:this={svgEl}
			viewBox="0 0 {W} {H}"
			role="application"
			aria-label={title}
			tabindex="0"
			onpointermove={onPointerMove}
			onpointerleave={() => (hoverIndex = null)}
			onkeydown={onKeyDown}
		>
			<!-- gridlines + y ticks -->
			{#each ticks as t (t)}
				<line class="grid" x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} />
				<text class="tick" x={M.left - 8} y={y(t) + 4} text-anchor="end">{compact(t)}</text>
			{/each}

			<!-- stacked areas, separated by a 2px surface gap -->
			{#each stacks as s, k (s.name)}
				<path
					d={areaPath(k === 0 ? zeros : cumulative[k - 1], cumulative[k])}
					fill={s.color}
					fill-opacity="0.82"
				/>
				<path d={linePath(cumulative[k])} fill="none" class="gap" />
			{/each}

			<!-- overlay line -->
			{#if overlay}
				<path d={linePath(overlay.values)} fill="none" class="overlay" />
			{/if}

			<!-- x axis: ages -->
			<line class="axis" x1={M.left} x2={W - M.right} y1={M.top + plotH} y2={M.top + plotH} />
			{#each years as _, i (i)}
				{#if ages[i] % 10 === 0}
					<text class="tick" x={x(i)} y={H - 6} text-anchor="middle">{ages[i]}</text>
				{/if}
			{/each}
			<text class="tick" x={M.left - 8} y={H - 6} text-anchor="end">age</text>

			<!-- end label: total at final year -->
			{#if stacks.length > 0 && years.length > 1}
				<text
					class="end-label"
					x={W - M.right + 6}
					y={y(cumulative[stacks.length - 1][years.length - 1]) + 4}
				>
					{compact(cumulative[stacks.length - 1][years.length - 1])}
				</text>
			{/if}

			<!-- crosshair -->
			{#if hoverIndex !== null}
				<line
					class="crosshair"
					x1={x(hoverIndex)}
					x2={x(hoverIndex)}
					y1={M.top}
					y2={M.top + plotH}
				/>
			{/if}
		</svg>

		{#if hoverIndex !== null}
			<div
				class="tooltip"
				style="left: {tooltipLeftPct}%; transform: translateX({tooltipLeftPct > 60 ? '-105%' : '8px'})"
			>
				<div class="tooltip-head">{years[hoverIndex]} · age {ages[hoverIndex]}</div>
				{#if overlay}
					<div class="row">
						<span class="line-key"></span>
						<span class="val">{full(overlay.values[hoverIndex] ?? 0)}</span>
						<span class="name">{overlay.name}</span>
					</div>
				{/if}
				{#each [...stacks].reverse() as s (s.name)}
					<div class="row">
						<span class="stroke" style="background: {s.color}"></span>
						<span class="val">{full(s.values[hoverIndex] ?? 0)}</span>
						<span class="name">{s.name}</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</figure>

<style>
	.chart {
		margin: 0;
		padding: 1rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
	}

	figcaption {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		margin-bottom: 0.25rem;
	}

	.title {
		font-weight: 600;
	}

	.value-label {
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.legend {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		margin-bottom: 0.25rem;
	}

	.key {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}

	.swatch {
		width: 10px;
		height: 10px;
		border-radius: 2px;
		display: inline-block;
	}

	.line-key {
		width: 14px;
		height: 0;
		border-top: 2px solid var(--color-text);
		display: inline-block;
	}

	.plot {
		position: relative;
	}

	svg {
		width: 100%;
		height: auto;
		display: block;
		outline: none;
		touch-action: none;
	}

	svg:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.grid {
		stroke: var(--color-border);
		stroke-width: 1;
	}

	.axis {
		stroke: var(--color-border-hover);
		stroke-width: 1;
	}

	.tick,
	.end-label {
		font-size: 11px;
		fill: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}

	.end-label {
		fill: var(--color-text);
		font-weight: 600;
	}

	.gap {
		stroke: var(--color-surface);
		stroke-width: 2;
	}

	.overlay {
		stroke: var(--color-text);
		stroke-width: 2;
		stroke-linejoin: round;
		stroke-linecap: round;
	}

	.crosshair {
		stroke: var(--color-text-muted);
		stroke-width: 1;
	}

	.tooltip {
		position: absolute;
		top: 8px;
		pointer-events: none;
		background: var(--color-bg);
		border: 1px solid var(--color-border-hover);
		border-radius: 0.4rem;
		padding: 0.5rem 0.65rem;
		font-size: 0.8rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
		white-space: nowrap;
		z-index: 2;
	}

	.tooltip-head {
		color: var(--color-text-muted);
		margin-bottom: 0.3rem;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		line-height: 1.5;
	}

	.stroke {
		width: 12px;
		height: 3px;
		border-radius: 1px;
		display: inline-block;
	}

	.val {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.name {
		color: var(--color-text-muted);
	}
</style>
