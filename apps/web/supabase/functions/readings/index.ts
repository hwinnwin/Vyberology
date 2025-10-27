import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withCors, requireJwt } from "../_shared/security.ts";
import { withTiming } from "../_shared/telemetry.ts";
import { ServerTimer } from "../_lib/serverTiming.ts";

serve(
  withCors(
    withTiming(async (req) => {
      const timer = new ServerTimer();
      const jsonResponse = (payload: unknown, status = 200) => {
        const headers = new Headers({ "Content-Type": "application/json" });
        timer.apply(headers);
        return new Response(JSON.stringify(payload), { status, headers });
      };

      const auth = requireJwt(req);
      if (!auth.ok) {
        return auth.response;
      }

      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          {
            global: {
              headers: { Authorization: req.headers.get('Authorization')! },
            },
          }
        );

        const authSpan = timer.start("db");
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        timer.end(authSpan);
        if (userError || !user) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        const url = new URL(req.url);
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const tag = url.searchParams.get('tag');
        const chakra = url.searchParams.get('chakra');

        let query = supabase
          .from('readings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (tag) {
          query = query.contains('tags', [tag]);
        }

        if (chakra) {
          query = query.filter('chakra_data->name', 'ilike', `%${chakra}%`);
        }

        const querySpan = timer.start("db");
        const { data, error } = await query;
        timer.end(querySpan);

        if (error) {
          console.error('Database error:', error);
          return jsonResponse({ error: 'Failed to fetch readings' }, 500);
        }

        return jsonResponse({
          readings: data,
          count: data.length,
          limit,
          filters: {
            tag: tag || null,
            chakra: chakra || null
          }
        });
      } catch (error) {
        console.error('Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return jsonResponse({ error: errorMessage }, 500);
      }
    })
  )
);
