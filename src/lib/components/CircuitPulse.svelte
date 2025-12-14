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

  // Generate a circuit path from a point toward a specific edge
  // edge: 0=top, 1=right, 2=bottom, 3=left
  function generatePathToEdge(
    startX: number,
    startY: number,
    edge: number,
    targetPoint: number // where on the edge to aim (0-1)
  ): string {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const height = typeof window !== 'undefined' ? window.innerHeight : 1080;

    // Calculate the target point on the edge
    let targetX: number;
    let targetY: number;
    if (edge === 0) {
      // Top edge
      targetX = targetPoint * width;
      targetY = -20;
    } else if (edge === 1) {
      // Right edge
      targetX = width + 20;
      targetY = targetPoint * height;
    } else if (edge === 2) {
      // Bottom edge
      targetX = targetPoint * width;
      targetY = height + 20;
    } else {
      // Left edge
      targetX = -20;
      targetY = targetPoint * height;
    }

    // Build path with circuit-style 90° turns
    const points: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];

    let currentX = startX;
    let currentY = startY;

    // Generate 2-4 segments toward the target
    const segments = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < segments; i++) {
      const isLastSegment = i === segments - 1;
      const progress = (i + 1) / segments;

      // Calculate intermediate target (interpolate toward final target with some randomness)
      const intermediateX = currentX + (targetX - currentX) * (0.3 + Math.random() * 0.4);
      const intermediateY = currentY + (targetY - currentY) * (0.3 + Math.random() * 0.4);

      // Add some perpendicular drift for visual interest
      const drift = (Math.random() - 0.5) * 80;

      if (isLastSegment) {
        // Final segment: go straight to target with one turn
        if (edge === 0 || edge === 2) {
          // Vertical edges: go horizontal first, then vertical
          currentX = targetX;
          points.push({ x: currentX, y: currentY });
          currentY = targetY;
          points.push({ x: currentX, y: currentY });
        } else {
          // Horizontal edges: go vertical first, then horizontal
          currentY = targetY;
          points.push({ x: currentX, y: currentY });
          currentX = targetX;
          points.push({ x: currentX, y: currentY });
        }
      } else {
        // Intermediate segment: circuit-style turns
        if (Math.random() > 0.5) {
          // Horizontal first
          currentX = intermediateX + (edge === 0 || edge === 2 ? drift : 0);
          points.push({ x: currentX, y: currentY });
          currentY = intermediateY + (edge === 1 || edge === 3 ? drift : 0);
          points.push({ x: currentX, y: currentY });
        } else {
          // Vertical first
          currentY = intermediateY + (edge === 1 || edge === 3 ? drift : 0);
          points.push({ x: currentX, y: currentY });
          currentX = intermediateX + (edge === 0 || edge === 2 ? drift : 0);
          points.push({ x: currentX, y: currentY });
        }
      }
    }

    // Convert to SVG path
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');
  }

  // Generate a random path from center-ish toward a random edge (for ambient pulses)
  function generateRandomPath(fromX?: number, fromY?: number): string {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const height = typeof window !== 'undefined' ? window.innerHeight : 1080;

    const startX = fromX ?? width * (0.33 + Math.random() * 0.34);
    const startY = fromY ?? height * (0.33 + Math.random() * 0.34);
    const edge = Math.floor(Math.random() * 4);
    const targetPoint = Math.random();

    return generatePathToEdge(startX, startY, edge, targetPoint);
  }

  // Single ambient pulse (random direction)
  function triggerPulse(fromX?: number, fromY?: number) {
    const id = pulseId++;
    const path = generateRandomPath(fromX, fromY);
    const duration = 1.5 + Math.random() * 1; // 1.5-2.5 seconds
    const opacity = 0.4 + Math.random() * 0.3; // 0.4-0.7

    activePulses = [...activePulses, { id, path, duration, opacity }];

    // Remove pulse after animation completes
    setTimeout(() => {
      activePulses = activePulses.filter((p) => p.id !== id);
    }, duration * 1000 + 500);
  }

  // Signature pulse: four traces from cursor to each edge
  function triggerSignaturePulse(fromX: number, fromY: number) {
    const baseDuration = 1.2 + Math.random() * 0.5; // 1.2-1.7 seconds
    const baseOpacity = 0.5 + Math.random() * 0.2; // 0.5-0.7

    // Fire four pulses, one to each edge
    for (let edge = 0; edge < 4; edge++) {
      const id = pulseId++;
      // Random target point on each edge (0-1)
      const targetPoint = 0.2 + Math.random() * 0.6; // Bias toward middle
      const path = generatePathToEdge(fromX, fromY, edge, targetPoint);
      // Slight variation in timing for organic feel
      const duration = baseDuration + Math.random() * 0.3;
      const opacity = baseOpacity;

      activePulses = [...activePulses, { id, path, duration, opacity }];

      // Remove pulse after animation completes
      setTimeout(() => {
        activePulses = activePulses.filter((p) => p.id !== id);
      }, duration * 1000 + 500);
    }
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
  // If coordinates provided, use signature pulse (four directions)
  // Otherwise use single ambient pulse
  function handleManualTrigger(event: CustomEvent<{ x?: number; y?: number }>) {
    const { x, y } = event.detail || {};
    if (x !== undefined && y !== undefined) {
      triggerSignaturePulse(x, y);
    } else {
      triggerPulse();
    }
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
