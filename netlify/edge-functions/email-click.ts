declare const Deno: { env: { get(key: string): string | undefined } };

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const fallback = () => Response.redirect(new URL("/", url.origin), 302);

  const functionsUrl = Deno.env.get("SUPABASE_FUNCTIONS_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!functionsUrl || !anonKey) return fallback();

  try {
    const upstream = await fetch(`${functionsUrl}/email/click${url.search}`, {
      headers: { Authorization: `Bearer ${anonKey}` },
      redirect: "manual",
    });

    const location = upstream.headers.get("location");
    return location ? Response.redirect(location, 302) : fallback();
  } catch {
    return fallback();
  }
}
