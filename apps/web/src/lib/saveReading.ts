export async function saveReading(
  supabaseUrl: string,
  anonKey: string,
  payload: {
    user_id: string | null;
    volume: string;
    core_number: number;
    raw_extracted: unknown;
    computed: unknown;
    rendered: string;
  }
) {
  await fetch(`${supabaseUrl}/rest/v1/readings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });
}
