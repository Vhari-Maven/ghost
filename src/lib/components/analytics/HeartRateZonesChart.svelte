<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import type { HeartRateZonesSeries } from '$lib/services/analytics';

  // Register Chart.js components
  Chart.register(...registerables);

  let { data }: { data: HeartRateZonesSeries } = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  // Zone colors matching Fitbit's color scheme
  const ZONE_COLORS = {
    outOfRange: { bg: 'rgba(156, 163, 175, 0.8)', border: 'rgb(156, 163, 175)' }, // gray
    fatBurn: { bg: 'rgba(250, 204, 21, 0.8)', border: 'rgb(250, 204, 21)' }, // yellow
    cardio: { bg: 'rgba(249, 115, 22, 0.8)', border: 'rgb(249, 115, 22)' }, // orange
    peak: { bg: 'rgba(239, 68, 68, 0.8)', border: 'rgb(239, 68, 68)' } // red
  };

  // Format date for display (Jan 15)
  function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Format minutes as hours:minutes
  function formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  }

  // Create chart configuration
  function getChartConfig() {
    const labels = data.dataPoints.map(p => formatDate(p.date));

    return {
      type: 'bar' as const,
      data: {
        labels,
        datasets: [
          {
            label: 'Out of Range',
            data: data.dataPoints.map(p => p.outOfRange),
            backgroundColor: ZONE_COLORS.outOfRange.bg,
            borderColor: ZONE_COLORS.outOfRange.border,
            borderWidth: 1
          },
          {
            label: 'Fat Burn',
            data: data.dataPoints.map(p => p.fatBurn),
            backgroundColor: ZONE_COLORS.fatBurn.bg,
            borderColor: ZONE_COLORS.fatBurn.border,
            borderWidth: 1
          },
          {
            label: 'Cardio',
            data: data.dataPoints.map(p => p.cardio),
            backgroundColor: ZONE_COLORS.cardio.bg,
            borderColor: ZONE_COLORS.cardio.border,
            borderWidth: 1
          },
          {
            label: 'Peak',
            data: data.dataPoints.map(p => p.peak),
            backgroundColor: ZONE_COLORS.peak.bg,
            borderColor: ZONE_COLORS.peak.border,
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index' as const,
          intersect: false
        },
        scales: {
          x: {
            stacked: true,
            grid: {
              color: 'rgba(30, 45, 48, 0.5)'
            },
            ticks: {
              color: 'rgb(107, 133, 137)'
            }
          },
          y: {
            stacked: true,
            title: {
              display: true,
              text: 'Minutes',
              color: 'rgb(107, 133, 137)'
            },
            grid: {
              color: 'rgba(30, 45, 48, 0.5)'
            },
            ticks: {
              color: 'rgb(107, 133, 137)'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top' as const,
            labels: {
              color: 'rgb(107, 133, 137)',
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: 'rgb(15, 23, 25)',
            titleColor: 'rgb(229, 234, 235)',
            bodyColor: 'rgb(107, 133, 137)',
            borderColor: 'rgb(30, 45, 48)',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: function(context: any) {
                const value = context.parsed.y;
                return `${context.dataset.label}: ${formatMinutes(value)}`;
              },
              afterBody: function(tooltipItems: any[]) {
                const index = tooltipItems[0]?.dataIndex;
                if (index !== undefined) {
                  const point = data.dataPoints[index];
                  const activeMinutes = point.fatBurn + point.cardio + point.peak;
                  const lines = [`Active Time: ${formatMinutes(activeMinutes)}`];
                  if (point.restingHeartRate) {
                    lines.push(`Resting HR: ${point.restingHeartRate} bpm`);
                  }
                  return lines;
                }
                return [];
              }
            }
          }
        }
      }
    };
  }

  // Create or update chart
  function updateChart() {
    if (!canvas) return;

    if (chart) {
      chart.destroy();
    }

    chart = new Chart(canvas, getChartConfig());
  }

  onMount(() => {
    updateChart();
  });

  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
  });

  // Re-create chart when data changes
  $effect(() => {
    if (data && canvas) {
      updateChart();
    }
  });
</script>

<div class="h-64 md:h-80">
  <canvas bind:this={canvas}></canvas>
</div>

{#if data.dataPoints.length === 0}
  <div class="absolute inset-0 flex items-center justify-center text-[var(--color-text-muted)]">
    No heart rate data available
  </div>
{/if}
