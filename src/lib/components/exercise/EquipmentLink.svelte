<script lang="ts">
  import { getEquipmentPhoto } from '$lib/data/equipment';

  let { name }: { name: string } = $props();

  const photo = $derived(getEquipmentPhoto(name));

  // Tooltip state
  let showTooltip = $state(false);
  let tooltipPosition = $state({ x: 0, y: 0 });

  function handleMouseEnter(event: MouseEvent) {
    if (!photo) return;
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    tooltipPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top
    };
    showTooltip = true;
  }

  function handleMouseLeave() {
    showTooltip = false;
  }
</script>

{#if photo}
  <button
    type="button"
    class="equipment-link"
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
    onfocus={(e) => handleMouseEnter(e as unknown as MouseEvent)}
    onblur={handleMouseLeave}
  >
    {name}
  </button>
{:else}
  <span>{name}</span>
{/if}

{#if showTooltip && photo}
  <div
    class="equipment-tooltip"
    style="left: {tooltipPosition.x}px; top: {tooltipPosition.y}px;"
  >
    <img src={photo} alt={name} class="equipment-image" />
    <span class="equipment-name">{name}</span>
  </div>
{/if}

<style>
  .equipment-link {
    color: inherit;
    background: none;
    font: inherit;
    text-decoration: underline;
    text-decoration-style: dashed;
    text-decoration-color: var(--color-accent);
    text-underline-offset: 2px;
    cursor: help;
    transition: color 0.15s ease;
  }

  .equipment-link:hover {
    color: var(--color-accent);
  }

  .equipment-tooltip {
    position: fixed;
    transform: translate(-50%, -100%) translateY(-12px);
    background: var(--color-surface);
    border: 1px solid var(--color-accent);
    border-radius: 8px;
    padding: 8px;
    z-index: 1000;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    pointer-events: none;
    animation: tooltip-in 0.15s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .equipment-image {
    width: 240px;
    height: auto;
    max-height: 280px;
    object-fit: contain;
    border-radius: 4px;
  }

  .equipment-name {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-align: center;
  }

  .equipment-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 8px solid transparent;
    border-top-color: var(--color-accent);
  }

  @keyframes tooltip-in {
    from {
      opacity: 0;
      transform: translate(-50%, -100%) translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -100%) translateY(-12px);
    }
  }
</style>
