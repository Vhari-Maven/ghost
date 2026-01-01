import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import {
  isFitbitConnected,
  getFitbitTokenData,
  deleteFitbitToken,
  syncFitbitToday,
  syncFitbitDateRange,
  getLastSyncTime
} from '$lib/services/fitbit';
import { getLocalDateString } from '$lib/utils/date';

export const load: PageServerLoad = async ({ url }) => {
  const connected = await isFitbitConnected();
  const tokenData = connected ? await getFitbitTokenData() : null;
  const lastSync = await getLastSyncTime();

  // Check for URL params (success/error messages)
  const success = url.searchParams.get('success');
  const error = url.searchParams.get('error');

  return {
    fitbit: {
      connected,
      userId: tokenData?.userId || null,
      lastSync,
      expiresAt: tokenData?.expiresAt || null
    },
    message: {
      success: success === 'fitbit_connected' ? 'Fitbit connected successfully!' : null,
      error: error || null
    }
  };
};

export const actions: Actions = {
  disconnect: async () => {
    await deleteFitbitToken();
    return { success: true, message: 'Fitbit disconnected' };
  },

  syncNow: async () => {
    const connected = await isFitbitConnected();
    if (!connected) {
      return fail(400, { error: 'Fitbit not connected' });
    }

    const result = await syncFitbitToday();

    if (result.success) {
      return { success: true, message: `Synced data for ${result.date}` };
    } else {
      return fail(500, { error: result.error || 'Sync failed' });
    }
  },

  backfill: async ({ request }) => {
    const connected = await isFitbitConnected();
    if (!connected) {
      return fail(400, { error: 'Fitbit not connected' });
    }

    const formData = await request.formData();
    const days = parseInt(formData.get('days')?.toString() || '30', 10);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const results = await syncFitbitDateRange(
      getLocalDateString(startDate),
      getLocalDateString(endDate)
    );

    const successful = results.filter(r => r.success).length;
    return {
      success: true,
      message: `Synced ${successful} of ${results.length} days`
    };
  }
};
