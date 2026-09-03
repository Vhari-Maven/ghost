<script lang="ts">
  import { onMount } from 'svelte';
  import { TILE_SIZE, buildGraph } from '$lib/circuit/tile';
  import { walk, startNodes, nearestNode, type Pos, type Target } from '$lib/circuit/walk';

  // Pulses ride the actual traces of the tiled background. The body background
  // is `background-attachment: fixed` with its tile origin at the viewport
  // corner, so world coords = tile index * TILE_SIZE + node coords.
  const graph = buildGraph();
  const starts = startNodes(graph);

  interface Pulse {
    id: number;
    path: string;
    length: number;
    duration: number;
    opacity: number;
  }

  let activePulses = $state<Pulse[]>([]);
  let pulseId = 0;

  const SPEED = 420; // px per second
  const DASH = 60; // visible length of the travelling pulse, px

  /** Random start node in a tile within the middle third of the viewport. */
  function randomStart(): Pos {
    const x = window.innerWidth * (0.33 + Math.random() * 0.34);
    const y = window.innerHeight * (0.33 + Math.random() * 0.34);
    return {
      tx: Math.floor(x / TILE_SIZE),
      ty: Math.floor(y / TILE_SIZE),
      node: starts[Math.floor(Math.random() * starts.length)],
    };
  }

  function addPulse(start: Pos, target: Target, opacity: number) {
    const { path, length } = walk(graph, start, target, {
      width: window.innerWidth,
      height: window.innerHeight,
    });
    if (length < 40) return;
    const id = pulseId++;
    const duration = Math.min(4.5, Math.max(1.2, length / SPEED)) * (0.9 + Math.random() * 0.2);
    activePulses = [...activePulses, { id, path, length, duration, opacity }];
    setTimeout(() => {
      activePulses = activePulses.filter((p) => p.id !== id);
    }, duration * 1000 + 500);
  }

  // Single ambient pulse toward a random edge
  function triggerPulse() {
    addPulse(randomStart(), Math.floor(Math.random() * 4), 0.4 + Math.random() * 0.3);
  }

  // Signature pulse: three traces from the node nearest the cursor, aimed at
  // the far side of the viewport (e.g. from the top-left icon: right-middle,
  // bottom-middle, bottom-right) so none of them exit right away.
  function triggerSignaturePulse(x: number, y: number) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const start = nearestNode(starts, x, y);
    const opacity = 0.5 + Math.random() * 0.2;
    const farX = x < w / 2 ? w : 0;
    const farY = y < h / 2 ? h : 0;
    const jitter = () => (Math.random() - 0.5) * 0.3; // ±15% of the viewport
    const targets: Array<[number, number]> = [
      [farX, h * (0.5 + jitter())],
      [w * (0.5 + jitter()), farY],
      [farX, farY],
    ];
    for (const [tx, ty] of targets) addPulse(start, [tx - x, ty - y], opacity);
  }

  function scheduleNextPulse() {
    const delay = 15000 + Math.random() * 15000;
    setTimeout(() => {
      triggerPulse();
      scheduleNextPulse();
    }, delay);
  }

  function handleManualTrigger(event: CustomEvent<{ x?: number; y?: number }>) {
    const { x, y } = event.detail || {};
    if (x !== undefined && y !== undefined) {
      triggerSignaturePulse(x, y);
    } else {
      triggerPulse();
    }
  }

  onMount(() => {
    window.addEventListener('circuit-pulse', handleManualTrigger as EventListener);
    setTimeout(() => triggerPulse(), 2000);
    scheduleNextPulse();
    return () => {
      window.removeEventListener('circuit-pulse', handleManualTrigger as EventListener);
    };
  });
</script>

<svg
  class="fixed inset-0 w-full h-full pointer-events-none z-0"
  xmlns="http://www.w3.org/2000/svg"
>
  <defs>
    <filter id="pulse-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  {#each activePulses as pulse (pulse.id)}
    <path
      d={pulse.path}
      fill="none"
      stroke="#06b6d4"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      filter="url(#pulse-glow)"
      class="circuit-pulse"
      style="--duration: {pulse.duration}s; --opacity: {pulse.opacity}; --travel: {pulse.length + DASH}px; stroke-dasharray: {DASH} {pulse.length + DASH}"
    />
  {/each}
</svg>

<style>
  .circuit-pulse {
    /* Start with the dash fully hidden before the path start; the offset
       then slides the dash along the full path length and off the end. */
    stroke-dashoffset: 60;
    animation: pulse-travel var(--duration) linear forwards;
  }

  @keyframes pulse-travel {
    0% {
      stroke-dashoffset: 60px;
      opacity: 0;
    }
    8% {
      opacity: var(--opacity, 0.5);
    }
    90% {
      opacity: var(--opacity, 0.5);
    }
    100% {
      stroke-dashoffset: calc(-1 * var(--travel));
      opacity: 0;
    }
  }
</style>
