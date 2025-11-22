"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCleanupScheduler = startCleanupScheduler;
exports.runCleanup = runCleanup;
const init_1 = require("../database/init");
function startCleanupScheduler() {
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
async function performCleanup() {
    try {
        console.log('🧹 Starting database cleanup...');
        // Clean up expired scans
        const scansResult = await (0, init_1.dbRun)('DELETE FROM scans WHERE expires_at < NOW()');
        // Clean up expired ad drafts
        const draftsResult = await (0, init_1.dbRun)('DELETE FROM ad_drafts WHERE expires_at < NOW()');
        console.log(`✅ Cleanup completed: ${scansResult.changes} scans, ${draftsResult.changes} drafts removed`);
    }
    catch (error) {
        console.error('❌ Cleanup failed:', error);
    }
}
// Manual cleanup function for testing
async function runCleanup() {
    const scansResult = await (0, init_1.dbRun)('DELETE FROM scans WHERE expires_at < NOW()');
    const draftsResult = await (0, init_1.dbRun)('DELETE FROM ad_drafts WHERE expires_at < NOW()');
    return {
        scansRemoved: scansResult.changes,
        draftsRemoved: draftsResult.changes,
    };
}
