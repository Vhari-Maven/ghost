<script lang="ts">
  import { getAllTermPatterns, getGlossaryTerm } from '$lib/data/glossary';

  let { text }: { text: string } = $props();

  // Build regex pattern from all glossary terms
  const patterns = getAllTermPatterns();
  const regexPattern = patterns
    .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape special chars
    .join('|');
  const regex = new RegExp(`\\b(${regexPattern})\\b`, 'gi');

  // Parse text into segments (plain text and glossary terms)
  interface Segment {
    type: 'text' | 'term';
    content: string;
    definition?: string;
  }

  const segments = $derived.by(() => {
    const result: Segment[] = [];
    let lastIndex = 0;
    let match;

    // Reset regex state
    regex.lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        result.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }

      // Add the matched term
      const term = getGlossaryTerm(match[0]);
      if (term) {
        result.push({
          type: 'term',
          content: match[0],
          definition: term.definition
        });
      } else {
        result.push({
          type: 'text',
          content: match[0]
        });
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      result.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    return result;
  });

  // Tooltip state
  let activeTooltip = $state<string | null>(null);
  let tooltipPosition = $state({ x: 0, y: 0 });

  function showTooltip(event: MouseEvent, definition: string) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    tooltipPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top
    };
    activeTooltip = definition;
  }

  function hideTooltip() {
    activeTooltip = null;
  }
</script>

<span class="glossary-text">
  {#each segments as segment}
    {#if segment.type === 'term'}
      <button
        type="button"
        class="glossary-term"
        onmouseenter={(e) => showTooltip(e, segment.definition!)}
        onmouseleave={hideTooltip}
        onfocus={(e) => showTooltip(e as unknown as MouseEvent, segment.definition!)}
        onblur={hideTooltip}
      >{segment.content}</button>
    {:else}
      {segment.content}
    {/if}
  {/each}
</span>

{#if activeTooltip}
  <div
    class="glossary-tooltip"
    style="left: {tooltipPosition.x}px; top: {tooltipPosition.y}px;"
  >
    {activeTooltip}
  </div>
{/if}

<style>
  .glossary-text {
    display: inline;
  }

  .glossary-term {
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

  .glossary-term:hover {
    color: var(--color-accent);
  }

  .glossary-tooltip {
    position: fixed;
    transform: translate(-50%, -100%) translateY(-8px);
    background: var(--color-surface);
    border: 1px solid var(--color-accent);
    color: var(--color-text);
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.8125rem;
    max-width: 280px;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    pointer-events: none;
    animation: tooltip-in 0.15s ease;
  }

  .glossary-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: var(--color-accent);
  }

  @keyframes tooltip-in {
    from {
      opacity: 0;
      transform: translate(-50%, -100%) translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -100%) translateY(-8px);
    }
  }
</style>
