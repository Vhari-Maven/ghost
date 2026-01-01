<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import type { MorningProgressSeries } from '$lib/services/analytics';

  // Register Chart.js components
  Chart.register(...registerables);

  let { data, showCumulative = false }: {
    data: MorningProgressSeries;
    showCumulative?: boolean;
  } = $props();

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
    const values = data.dataPoints.map(p => p.value);
    const cumulative = data.dataPoints.map(p => p.cumulative);

    const datasets: any[] = [
      {
        label: `Daily ${data.name} (${data.unit})`,
        data: values,
        borderColor: data.id === 'walking' ? 'rgb(34, 197, 94)' : 'rgb(6, 182, 212)', // green for walking, cyan for weight
        backgroundColor: data.id === 'walking' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(6, 182, 212, 0.1)',
        fill: true,
        tension: 0.3,
        yAxisID: 'y'
      }
    ];

    // Add cumulative line for walking
    if (showCumulative && data.id === 'walking') {
      datasets.push({
        label: `Total ${data.unit}`,
        data: cumulative,
        borderColor: 'rgb(168, 85, 247)', // purple
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: false,
        tension: 0.3,
        borderDash: [5, 5],
        yAxisID: 'y1'
      });
    }

    // Add 7-day moving average line for weight
    if (data.id === 'weight') {
      const movingAvgData = data.dataPoints.map(p => p.movingAvg7Day ?? null);
      datasets.push({
        label: '7-Day Avg',
        data: movingAvgData,
        borderColor: 'rgb(168, 85, 247)', // purple
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 0,
        yAxisID: 'y'
      });
    }

    const scales: any = {
      x: {
        grid: {
          color: 'rgba(30, 45, 48, 0.5)'
        },
        ticks: {
          color: 'rgb(107, 133, 137)'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: data.id === 'walking' ? 'Distance (miles)' : 'Weight (lbs)',
          color: data.id === 'walking' ? 'rgb(34, 197, 94)' : 'rgb(6, 182, 212)'
        },
        grid: {
          color: 'rgba(30, 45, 48, 0.5)'
        },
        ticks: {
          color: 'rgb(107, 133, 137)'
        }
      }
    };

    // Add second Y axis for cumulative (walking only)
    if (showCumulative && data.id === 'walking') {
      scales.y1 = {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Total Miles',
          color: 'rgb(168, 85, 247)'
        },
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          color: 'rgb(107, 133, 137)'
        }
      };
    }

    return {
      type: 'line' as const,
      data: {
        labels,
        datasets
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
            displayColors: true
          }
        },
        scales
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
    No data available
  </div>
{/if}
