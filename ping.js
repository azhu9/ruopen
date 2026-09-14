const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function ping() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/_heartbeat`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal"
    },
    body: JSON.stringify({})
  });
  if (!res.ok) throw new Error(`Ping failed: ${res.status} ${await res.text()}`);
  console.log("Ping successful:", new Date().toISOString());
}

ping().catch(err => { console.error(err); process.exit(1); });