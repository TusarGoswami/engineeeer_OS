import { queryClient } from '../app/queryClient.js';

/**
 * Invalidates all React Query caches that reflect user progress, streaks,
 * dashboard telemetry, and profile card snapshots after completing an activity.
 */
export function invalidateProgressQueries(client = queryClient) {
  if (!client) return;
  client.invalidateQueries({ queryKey: ['dashboard-summary'] });
  client.invalidateQueries({ queryKey: ['dashboard-today'] });
  client.invalidateQueries({ queryKey: ['dashboard-heatmap'] });
  client.invalidateQueries({ queryKey: ['owner-profile'] });
}
