import cron from 'node-cron';
import { isFitbitConnected, syncFitbitToday } from './services/fitbit';

let initialized = false;

/**
 * Initialize the scheduler for automated tasks.
 * Should be called once on server startup.
 */
export function initScheduler(): void {
  if (initialized) {
    console.log('[Scheduler] Already initialized, skipping');
    return;
  }

  // Daily Fitbit sync at noon Eastern
  // Cron format: minute hour day month day-of-week
  cron.schedule('0 12 * * *', async () => {
    console.log('[Scheduler] Running daily Fitbit sync...');

    try {
      const connected = await isFitbitConnected();
      if (!connected) {
        console.log('[Scheduler] Fitbit not connected, skipping sync');
        return;
      }

      const result = await syncFitbitToday();

      if (result.success) {
        console.log(`[Scheduler] Fitbit sync completed for ${result.date}`);
      } else {
        console.error(`[Scheduler] Fitbit sync failed: ${result.error}`);
      }
    } catch (error) {
      console.error('[Scheduler] Fitbit sync error:', error);
    }
  }, {
    timezone: 'America/New_York'
  });

  initialized = true;
  console.log('[Scheduler] Initialized - Fitbit sync scheduled for 12:00 PM ET daily');
}
