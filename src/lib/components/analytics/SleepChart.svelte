<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import type { SleepProgressSeries } from '$lib/services/analytics';

  // Register Chart.js components
  Chart.register(...registerables);

  let { data }: { data: SleepProgressSeries } = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  // Sleep stage colors
  const STAGE_COLORS = {
    deep: { bg: 'rgba(99, 102, 241, 0.8)', border: 'rgb(99, 102, 241)' }, // indigo
    rem: { bg: 'rgba(168, 85, 247, 0.8)', border: 'rgb(168, 85, 247)' }, // purple
    light: { bg: 'rgba(6, 182, 212, 0.8)', border: 'rgb(6, 182, 212)' }, // cyan
    awake: { bg: 'rgba(156, 163, 175, 0.8)', border: 'rgb(156, 163, 175)' } // gray
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

  // Compact format for bar labels (7:30)
  function formatMinutesCompact(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  }

  // Custom plugin to draw total sleep time above each bar
  const totalLabelPlugin = {
    id: 'totalLabel',
    afterDatasetsDraw(chart: Chart) {
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(3); // Get Awake dataset (index 3, the top of the stacked bars)

      ctx.save();
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillStyle = 'rgb(229, 234, 235)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';

      meta.data.forEach((bar, index) => {
        const point = data.dataPoints[index];
        if (point) {
          const total = point.duration;
          const label = formatMinutesCompact(total);
          ctx.fillText(label, bar.x, bar.y - 6);
        }
      });

      ctx.restore();
    }
  };

  // Create chart configuration
  function getChartConfig() {
    const labels = data.dataPoints.map(p => formatDate(p.date));

    return {
      type: 'bar' as const,
      data: {
        labels,
        datasets: [
          {
            label: 'Deep',
            data: data.dataPoints.map(p => p.deep),
            backgroundColor: STAGE_COLORS.deep.bg,
            borderColor: STAGE_COLORS.deep.border,
            borderWidth: 1
          },
          {
            label: 'REM',
            data: data.dataPoints.map(p => p.rem),
            backgroundColor: STAGE_COLORS.rem.bg,
            borderColor: STAGE_COLORS.rem.border,
            borderWidth: 1
          },
          {
            label: 'Light',
            data: data.dataPoints.map(p => p.light),
            backgroundColor: STAGE_COLORS.light.bg,
            borderColor: STAGE_COLORS.light.border,
            borderWidth: 1
          },
          {
            label: 'Awake',
            data: data.dataPoints.map(p => p.awake),
            backgroundColor: STAGE_COLORS.awake.bg,
            borderColor: STAGE_COLORS.awake.border,
            borderWidth: 1
          },
          {
            label: '7-Day Avg',
            type: 'line' as const,
            data: data.dataPoints.map(p => p.movingAvg7Day ?? null),
            borderColor: 'rgb(250, 204, 21)', // yellow
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
            stack: undefined // Don't stack with bars
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 20 // Room for total sleep labels above bars
          }
        },
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
            beginAtZero: true,
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
                  const lines = [
                    `Total Sleep: ${formatMinutes(point.duration)}`,
                    `Deep Sleep: ${point.deepPercent}%`
                  ];
                  if (point.efficiency) {
                    lines.push(`Efficiency: ${point.efficiency}%`);
                  }
                  if (point.movingAvg7Day) {
                    lines.push(`7-Day Avg: ${formatMinutes(point.movingAvg7Day)}`);
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

    chart = new Chart(canvas, {
      ...getChartConfig(),
      plugins: [totalLabelPlugin]
    });
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
    No sleep data available
  </div>
{/if}
