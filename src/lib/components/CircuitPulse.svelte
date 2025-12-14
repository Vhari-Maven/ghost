<script lang="ts">
  import { onMount } from 'svelte';

  // Track active pulses
  let activePulses = $state<Array<{
    id: number;
    path: string;
    duration: number;
    opacity: number;
  }>>([]);

  let pulseId = 0;

  // Generate a random circuit path from center-ish toward an edge
  function generatePath(fromX?: number, fromY?: number): string {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const height = typeof window !== 'undefined' ? window.innerHeight : 1080;

    // Start from provided coordinates or somewhere in the center third of the screen
    const startX = fromX ?? width * (0.33 + Math.random() * 0.34);
    const startY = fromY ?? height * (0.33 + Math.random() * 0.34);

    // Pick a random edge to head toward (0=top, 1=right, 2=bottom, 3=left)
    const edge = Math.floor(Math.random() * 4);

    // Build path with circuit-style 45° and 90° turns
    const points: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];

    let currentX = startX;
    let currentY = startY;

    // Generate 3-6 segments toward the edge
    const segments = 3 + Math.floor(Math.random() * 4);

    for (let i = 0; i < segments; i++) {
      const isLastSegment = i === segments - 1;
      const segmentLength = 50 + Math.random() * 150;

      // Bias direction toward target edge
      let dx = 0;
      let dy = 0;

      if (edge === 0) {
        // Top
        dy = -segmentLength;
        dx = (Math.random() - 0.5) * segmentLength * 0.5;
      } else if (edge === 1) {
        // Right
        dx = segmentLength;
        dy = (Math.random() - 0.5) * segmentLength * 0.5;
      } else if (edge === 2) {
        // Bottom
        dy = segmentLength;
        dx = (Math.random() - 0.5) * segmentLength * 0.5;
      } else {
        // Left
        dx = -segmentLength;
        dy = (Math.random() - 0.5) * segmentLength * 0.5;
      }

      // Circuit-style: first go horizontal, then vertical (or vice versa)
      if (Math.random() > 0.5) {
        // Horizontal first
        if (Math.abs(dx) > 10) {
          currentX += dx;
          points.push({ x: currentX, y: currentY });
        }
        if (Math.abs(dy) > 10) {
          currentY += dy;
          points.push({ x: currentX, y: currentY });
        }
      } else {
        // Vertical first
        if (Math.abs(dy) > 10) {
          currentY += dy;
          points.push({ x: currentX, y: currentY });
        }
        if (Math.abs(dx) > 10) {
          currentX += dx;
          points.push({ x: currentX, y: currentY });
        }
      }

      // On last segment, extend to edge
      if (isLastSegment) {
        if (edge === 0) currentY = -20;
        else if (edge === 1) currentX = width + 20;
        else if (edge === 2) currentY = height + 20;
        else currentX = -20;
        points.push({ x: currentX, y: currentY });
      }
    }

    // Convert to SVG path
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');
  }

  function triggerPulse(fromX?: number, fromY?: number) {
    const id = pulseId++;
    const path = generatePath(fromX, fromY);
    const duration = 1.5 + Math.random() * 1; // 1.5-2.5 seconds
    const opacity = 0.4 + Math.random() * 0.3; // 0.4-0.7

    activePulses = [...activePulses, { id, path, duration, opacity }];

    // Remove pulse after animation completes
    setTimeout(() => {
      activePulses = activePulses.filter((p) => p.id !== id);
    }, duration * 1000 + 500);
  }

  function scheduleNextPulse() {
    // Random delay between 15-30 seconds
    const delay = 15000 + Math.random() * 15000;
    setTimeout(() => {
      triggerPulse();
      scheduleNextPulse();
    }, delay);
  }

  // Allow external triggering via custom event
  function handleManualTrigger(event: CustomEvent<{ x?: number; y?: number }>) {
    const { x, y } = event.detail || {};
    triggerPulse(x, y);
  }

  onMount(() => {
    // Listen for manual trigger events
    window.addEventListener('circuit-pulse', handleManualTrigger as EventListener);

    // Start first pulse after a short delay
    setTimeout(() => triggerPulse(), 2000);
    // Schedule recurring pulses
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
    <!-- Glow filter for the pulse -->
    <filter id="pulse-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  {#each activePulses as pulse (pulse.id)}
    <!-- The trace path -->
    <path
      d={pulse.path}
      fill="none"
      stroke="#06b6d4"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity={pulse.opacity}
      filter="url(#pulse-glow)"
      class="circuit-pulse"
      style="--duration: {pulse.duration}s"
    />
  {/each}
</svg>

<style>
  .circuit-pulse {
    stroke-dasharray: 100 1000;
    stroke-dashoffset: 0;
    animation: pulse-travel var(--duration) ease-out forwards;
  }

  @keyframes pulse-travel {
    0% {
      stroke-dashoffset: 0;
      opacity: 0;
    }
    5% {
      opacity: var(--opacity, 0.5);
    }
    90% {
      opacity: var(--opacity, 0.5);
    }
    100% {
      stroke-dashoffset: -1500;
      opacity: 0;
    }
  }
</style>
