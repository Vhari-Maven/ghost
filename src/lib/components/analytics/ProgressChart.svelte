<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import type { ExerciseProgressSeries } from '$lib/services/analytics';

  // Register Chart.js components
  Chart.register(...registerables);

  let { data }: { data: ExerciseProgressSeries } = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  // Format date for display (Jan 15)
  function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Create chart configuration
  function getChartConfig() {
    const labels = data.dataPoints.map(p => formatDate(p.date));
    const weights = data.dataPoints.map(p => p.maxWeight);
    const volumes = data.dataPoints.map(p => p.totalVolume);

    return {
      type: 'line' as const,
      data: {
        labels,
        datasets: [
          {
            label: 'Max Weight (lbs)',
            data: weights,
            borderColor: 'rgb(6, 182, 212)', // cyan-500
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
            fill: true,
            tension: 0.3,
            yAxisID: 'y'
          },
          {
            label: 'Volume (lbs)',
            data: volumes,
            borderColor: 'rgb(34, 197, 94)', // green-500
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: false,
            tension: 0.3,
            yAxisID: 'y1',
            borderDash: [5, 5]
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
        plugins: {
          legend: {
            position: 'top' as const,
            labels: {
              color: 'rgb(107, 133, 137)', // --color-text-muted
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: 'rgb(15, 23, 25)', // --color-surface
            titleColor: 'rgb(229, 234, 235)', // --color-text
            bodyColor: 'rgb(107, 133, 137)', // --color-text-muted
            borderColor: 'rgb(30, 45, 48)', // --color-border
            borderWidth: 1,
            padding: 12,
            displayColors: true
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(30, 45, 48, 0.5)' // --color-border with opacity
            },
            ticks: {
              color: 'rgb(107, 133, 137)' // --color-text-muted
            }
          },
          y: {
            type: 'linear' as const,
            display: true,
            position: 'left' as const,
            title: {
              display: true,
              text: 'Weight (lbs)',
              color: 'rgb(6, 182, 212)'
            },
            grid: {
              color: 'rgba(30, 45, 48, 0.5)'
            },
            ticks: {
              color: 'rgb(107, 133, 137)'
            }
          },
          y1: {
            type: 'linear' as const,
            display: true,
            position: 'right' as const,
            title: {
              display: true,
              text: 'Volume (lbs)',
              color: 'rgb(34, 197, 94)'
            },
            grid: {
              drawOnChartArea: false
            },
            ticks: {
              color: 'rgb(107, 133, 137)'
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
    No data available for this exercise
  </div>
{/if}
