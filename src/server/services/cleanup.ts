import { dbRun } from '../database/init';

export function startCleanupScheduler(): void {
  const intervalHours = parseInt(process.env.CLEANUP_INTERVAL_HOURS || '6');
  const intervalMs = intervalHours * 60 * 60 * 1000; // Convert to milliseconds

  console.log(`🧹 Starting cleanup scheduler (every ${intervalHours} hours)`);

  // Run cleanup immediately on startup
  performCleanup().catch(console.error);

  // Schedule periodic cleanup
  setInterval(() => {
    performCleanup().catch(console.error);
  }, intervalMs);
}

async function performCleanup(): Promise<void> {
  try {
    console.log('🧹 Starting database cleanup...');

    // Clean up expired scans
    const scansResult = await dbRun(
      'DELETE FROM scans WHERE expires_at < NOW()'
    );

    // Clean up expired ad drafts
    const draftsResult = await dbRun(
      'DELETE FROM ad_drafts WHERE expires_at < NOW()'
    );

    console.log(`✅ Cleanup completed: ${scansResult.changes} scans, ${draftsResult.changes} drafts removed`);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Manual cleanup function for testing
export async function runCleanup(): Promise<{ scansRemoved: number; draftsRemoved: number }> {
  const scansResult = await dbRun(
    'DELETE FROM scans WHERE expires_at < NOW()'
  );

  const draftsResult = await dbRun(
    'DELETE FROM ad_drafts WHERE expires_at < NOW()'
  );

  return {
    scansRemoved: scansResult.changes,
    draftsRemoved: draftsResult.changes,
  };
}