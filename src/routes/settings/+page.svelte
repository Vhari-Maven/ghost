<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { enhance } from '$app/forms';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let syncing = $state(false);
  let backfilling = $state(false);

  function formatDate(timestamp: number | null): string {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  }

  function formatLastSync(isoString: string | null): string {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString();
  }
</script>

<svelte:head>
  <title>Settings | Ghost</title>
</svelte:head>

<div class="space-y-8">
  <!-- Header -->
  <div class="flex items-center gap-3">
    <div class="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
      <svg class="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </div>
    <h1 class="text-2xl font-bold text-[var(--color-text)]">Settings</h1>
  </div>

  <!-- Success/Error Messages -->
  {#if data.message.success}
    <div class="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
      {data.message.success}
    </div>
  {/if}

  {#if data.message.error}
    <div class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
      {data.message.error}
    </div>
  {/if}

  {#if form?.message}
    <div class="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
      {form.message}
    </div>
  {/if}

  {#if form?.error}
    <div class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
      {form.error}
    </div>
  {/if}

  <!-- Fitbit Integration -->
  <section class="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg">
    <div class="flex items-center gap-3 mb-6">
      <div class="w-8 h-8 rounded-lg bg-[#00B0B9]/20 flex items-center justify-center">
        <!-- Fitbit-ish icon (heart with pulse) -->
        <svg class="w-5 h-5 text-[#00B0B9]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>
      <h2 class="text-lg font-semibold text-[var(--color-text)]">Fitbit Integration</h2>
    </div>

    {#if data.fitbit.connected}
      <!-- Connected State -->
      <div class="space-y-4">
        <div class="flex items-center gap-2 text-green-400">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span class="font-medium">Connected</span>
          {#if data.fitbit.userId}
            <span class="text-[var(--color-text-muted)]">({data.fitbit.userId})</span>
          {/if}
        </div>

        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-[var(--color-text-muted)]">Last synced:</span>
            <span class="ml-2 text-[var(--color-text)]">{formatLastSync(data.fitbit.lastSync)}</span>
          </div>
          <div>
            <span class="text-[var(--color-text-muted)]">Token expires:</span>
            <span class="ml-2 text-[var(--color-text)]">{formatDate(data.fitbit.expiresAt)}</span>
          </div>
        </div>

        <div class="flex flex-wrap gap-3 pt-4 border-t border-[var(--color-border)]">
          <!-- Sync Now -->
          <form method="POST" action="?/syncNow" use:enhance={() => {
            syncing = true;
            return async ({ update }) => {
              await update();
              syncing = false;
            };
          }}>
            <button
              type="submit"
              disabled={syncing}
              class="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-bg)] font-medium rounded-lg
                     hover:bg-[var(--color-accent)]/80 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors flex items-center gap-2"
            >
              {#if syncing}
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing...
              {:else}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync Now
              {/if}
            </button>
          </form>

          <!-- Backfill -->
          <form method="POST" action="?/backfill" use:enhance={() => {
            backfilling = true;
            return async ({ update }) => {
              await update();
              backfilling = false;
            };
          }} class="flex items-center gap-2">
            <select
              name="days"
              class="px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg
                     text-[var(--color-text)] text-sm hover:border-[var(--color-border-hover)]
                     focus:border-[var(--color-accent)] focus:outline-none"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30" selected>Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button
              type="submit"
              disabled={backfilling}
              class="px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]
                     font-medium rounded-lg hover:border-[var(--color-accent)] disabled:opacity-50
                     disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {#if backfilling}
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Backfilling...
              {:else}
                Backfill
              {/if}
            </button>
          </form>

          <!-- Disconnect -->
          <form method="POST" action="?/disconnect" use:enhance>
            <button
              type="submit"
              class="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400
                     font-medium rounded-lg hover:bg-red-500/20 transition-colors"
            >
              Disconnect
            </button>
          </form>
        </div>
      </div>
    {:else}
      <!-- Disconnected State -->
      <div class="space-y-4">
        <p class="text-[var(--color-text-muted)]">
          Connect your Fitbit account to sync heart rate, sleep, and activity data from your Pixel Watch.
        </p>

        <div class="text-sm text-[var(--color-text-muted)]">
          <p class="font-medium text-[var(--color-text)] mb-2">Data we'll sync:</p>
          <ul class="list-disc list-inside space-y-1">
            <li>Heart rate zones (time in each zone)</li>
            <li>Sleep duration and stages (deep, light, REM)</li>
            <li>Calories burned</li>
          </ul>
        </div>

        <a
          href="/api/fitbit/authorize"
          class="inline-flex items-center gap-2 px-6 py-3 bg-[#00B0B9] text-white font-medium rounded-lg
                 hover:bg-[#00B0B9]/80 transition-colors"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          Connect Fitbit
        </a>
      </div>
    {/if}
  </section>

  <!-- Sync Schedule Info -->
  <section class="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg">
    <h2 class="text-lg font-semibold text-[var(--color-text)] mb-4">Automatic Sync</h2>
    <p class="text-[var(--color-text-muted)]">
      When connected, Fitbit data syncs automatically every day at <span class="text-[var(--color-text)] font-medium">12:00 PM Eastern</span>.
    </p>
  </section>
</div>
