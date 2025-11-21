/**
 * Export Worker
 * Background job processor for CSV/JSON export generation
 * Run with: pnpm tsx src/workers/exportWorker.ts
 */

import { getServiceClient } from '../db.js';
import { config } from '../config.js';

/**
 * Process queued export jobs
 *
 * Workflow:
 * 1. Query exports table for status='queued' jobs
 * 2. Update status to 'processing'
 * 3. Fetch readings based on filters
 * 4. Generate CSV or JSON
 * 5. Upload to Supabase Storage
 * 6. Create signed URL (7 day expiry)
 * 7. Update status to 'ready' with URL
 *
 * Error handling:
 * - On failure, set status='failed' with error message
 * - Retry logic can be added via job queue (BullMQ, etc.)
 *
 * @example
 * // Run worker once
 * await processExports();
 *
 * // Run worker in loop (cron or continuous)
 * setInterval(processExports, 60000); // every minute
 */
export async function processExports(): Promise<void> {
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    console.error('⚠️  Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    return;
  }

  try {
    const db = getServiceClient();

    // 1. Query queued exports
    const { data: jobs, error: queryError } = await db
      .from('exports')
      .select('*')
      .eq('status', 'queued')
      .limit(5);

    if (queryError) {
      throw new Error(`Failed to query exports: ${queryError.message}`);
    }

    if (!jobs || jobs.length === 0) {
      console.log('✓ No queued export jobs found');
      return;
    }

    console.log(`📦 Processing ${jobs.length} export jobs...`);

    // 2. Process each job
    for (const job of jobs) {
      try {
        console.log(`  → Processing export ${job.id} (${job.format})`);

        // Update status to processing
        await db
          .from('exports')
          .update({ status: 'processing', updated_at: new Date().toISOString() })
          .eq('id', job.id);

        // Fetch user's readings with filters
        let query = db
          .from('readings')
          .select('*')
          .eq('user_id', job.user_id)
          .order('created_at', { ascending: false });

        // Apply filters from job params
        const filters = job.params || {};
        if (filters.from) {
          query = query.gte('created_at', filters.from);
        }
        if (filters.to) {
          query = query.lte('created_at', filters.to);
        }
        if (filters.limit) {
          query = query.limit(filters.limit);
        }

        const { data: readings, error: readingsError } = await query;

        if (readingsError) {
          throw new Error(`Failed to fetch readings: ${readingsError.message}`);
        }

        // Generate export file content
        const content = job.format === 'csv'
          ? generateCSV(readings || [])
          : generateJSON(readings || []);

        // Upload to Supabase Storage
        const fileName = `exports/${job.user_id}/${job.id}.${job.format}`;
        const { data: uploadData, error: uploadError } = await db.storage
          .from('vyberology-exports')
          .upload(fileName, content, {
            contentType: job.format === 'csv' ? 'text/csv' : 'application/json',
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }

        // Generate signed URL (7 day expiry)
        const { data: urlData, error: urlError } = await db.storage
          .from('vyberology-exports')
          .createSignedUrl(fileName, 7 * 24 * 60 * 60); // 7 days in seconds

        if (urlError) {
          throw new Error(`Failed to generate signed URL: ${urlError.message}`);
        }

        // Update status to ready with URL
        await db
          .from('exports')
          .update({
            status: 'ready',
            url: urlData.signedUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);

        console.log(`  ✓ Export ${job.id} completed successfully`);
      } catch (jobError) {
        // On error, update status to failed
        const errorMessage = jobError instanceof Error ? jobError.message : 'Unknown error';
        console.error(`  ✗ Export ${job.id} failed:`, errorMessage);

        await db
          .from('exports')
          .update({
            status: 'failed',
            error: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);
      }
    }

    console.log('✅ Export worker completed');
  } catch (error) {
    console.error('❌ Export worker failed:', error);
    throw error;
  }
}

/**
 * Generate CSV from readings array
 * @param readings - Array of reading objects
 * @returns CSV string
 */
export function generateCSV(readings: any[]): string {
  if (readings.length === 0) {
    return 'id,created_at,input_name,input_birthdate,elements,chakras\n';
  }

  // CSV Header
  const headers = ['id', 'created_at', 'input_name', 'input_birthdate', 'elements', 'chakras'];
  let csv = headers.join(',') + '\n';

  // CSV Rows
  for (const reading of readings) {
    const row = [
      reading.id || '',
      reading.created_at || '',
      `"${(reading.input_name || '').replace(/"/g, '""')}"`, // Escape quotes
      reading.input_birthdate || '',
      `"${JSON.stringify(reading.full_output?.parse?.elements || {}).replace(/"/g, '""')}"`,
      `"${JSON.stringify(reading.full_output?.parse?.chakras || {}).replace(/"/g, '""')}"`,
    ];
    csv += row.join(',') + '\n';
  }

  return csv;
}

/**
 * Generate JSON from readings array
 * @param readings - Array of reading objects
 * @returns JSON string
 */
export function generateJSON(readings: any[]): string {
  // Transform readings to a cleaner format for export
  const transformed = readings.map((r) => ({
    id: r.id,
    created_at: r.created_at,
    input_name: r.input_name,
    input_birthdate: r.input_birthdate,
    parse: r.full_output?.parse || {},
    compose: r.full_output?.compose || {},
  }));

  return JSON.stringify(transformed, null, 2);
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  processExports()
    .then(() => {
      console.log('✅ Export worker completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Export worker failed:', error);
      process.exit(1);
    });
}
