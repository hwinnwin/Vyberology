import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger, extractRequestContext } from "../_shared/errorLogger.ts";

const sbUrl = Deno.env.get('SUPABASE_URL')!;
const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
const slack = Deno.env.get('SLACK_WEBHOOK_URL');
const tz = Deno.env.get('DIGEST_LOCAL_TZ') ?? 'Australia/Melbourne';

type DigestRow = { context: string; count: number };
type DigestTopMessage = { message: string; count: number };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isDigestRow = (value: unknown): value is DigestRow =>
  isRecord(value) && typeof value.context === 'string' && typeof value.count === 'number';

const isDigestMessage = (value: unknown): value is DigestTopMessage =>
  isRecord(value) && typeof value.message === 'string' && typeof value.count === 'number';

const toDigestRows = (value: unknown): DigestRow[] =>
  Array.isArray(value) ? value.filter(isDigestRow) : [];

const toDigestMessages = (value: unknown): DigestTopMessage[] =>
  Array.isArray(value) ? value.filter(isDigestMessage) : [];

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const environment = (Deno.env.get('ENV') || 'staging') as 'staging' | 'production';

  const logger = createLogger(
    sbUrl,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    { environment, service: 'edge:function:error-digest', requestId }
  );

  try {
    if (!slack) {
      await logger.info('Slack webhook not configured, digest skipped', {
        code: 'SLACK_DISABLED',
        ...extractRequestContext(req),
      });
      return new Response('slack disabled', { status: 204 });
    }
    const sb = createClient(sbUrl, anon);
    const { data, error } = await sb.rpc('get_error_digest', { p_tz: tz });
    if (error) {
      await logger.error('RPC get_error_digest failed', {
        code: 'RPC_ERROR',
        details: { error: error.message, tz },
        ...extractRequestContext(req),
      });
      return new Response('rpc fail', { status: 500 });
    }

    const digest = isRecord(data)
      ? {
          total: typeof data.total === 'number' ? data.total : 0,
          by_context: toDigestRows(data['by_context']),
          top_messages: toDigestMessages(data['top_messages']),
        }
      : { total: 0, by_context: [] as DigestRow[], top_messages: [] as DigestTopMessage[] };

    const { total, by_context, top_messages } = digest;
    const text = [
      '*Vyberology — Daily Error Digest*',
      `*Total (24h):* ${total}`,
      `*By context:* ${by_context.map((row) => `${row.context}: ${row.count}`).join(' • ') || '—'}`,
      '*Top messages:*',
      ...top_messages.slice(0, 5).map((entry, i) => `${i + 1}. ${entry.message} — ${entry.count}×`),
    ].join('\n');
    const res = await fetch(slack, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      await logger.error('Slack webhook delivery failed', {
        code: 'SLACK_DELIVERY_ERROR',
        details: { status: res.status, statusText: res.statusText },
        ...extractRequestContext(req),
      });
      return new Response('slack fail', { status: 502 });
    }
    return new Response('ok', { status: 200 });
  } catch (error) {
    await logger.error(
      error instanceof Error ? error.message : 'Unknown error occurred',
      {
        code: 'UNHANDLED_ERROR',
        details: {
          errorType: typeof error,
          stack: error instanceof Error ? error.stack : undefined,
        },
        ...extractRequestContext(req),
      }
    );
    return new Response('Internal server error', { status: 500 });
  }
});
