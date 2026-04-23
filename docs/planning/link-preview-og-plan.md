# Link Preview (Open Graph) for Room URLs

## Problem

Heard is a pure client-side SPA. When someone shares a room URL like `https://heard.vote/room/abc123` in Slack, iMessage, Twitter, etc., the social platform's crawler fetches the raw HTML at that URL. Since Netlify serves the same static `index.html` shell for every path, the crawler sees only:

```html
<title>Heard - A Place to Be Heard</title>
```

No `og:title`, `og:description`, or `og:image` — so every share looks identical and uninformative.

---

## Goal

When a room URL is shared, the recipient's platform should show:

- **Title**: the room's topic (e.g. "Should remote work be the default?")
- **Description**: the room description if set, otherwise a fallback like "Join the debate on Heard"
- **Image**: the room's cover image if set, otherwise the Heard logo
- **URL**: the canonical room URL

This should work for all major crawlers: Slack, iMessage, Twitter/X, Facebook, WhatsApp, LinkedIn, Discord.

---

## Architecture Context

| Layer | Technology |
|---|---|
| Frontend hosting | Netlify (catch-all SPA redirect: `/* → /index.html 200`) |
| Backend | Supabase Edge Function (Deno + Hono), deployed as `make-server-f1a393b4` |
| Room URL pattern | `/room/:roomId` |
| Room data fields | `topic`, `description?`, `imageUrl?`, `emoji?` |

Crawlers do not execute JavaScript, so the SPA itself is invisible to them. The fix must be applied at the HTTP layer, before the SPA shell is returned.

---

## Recommended Approach: Netlify Edge Function

Netlify Edge Functions run on Deno at the CDN edge, before the static file is served. They can intercept a request, fetch data, mutate the HTML response, and return it — all transparently.

**Why this over alternatives:**

- **vs. Supabase-only approach**: A pure Supabase approach would require crawlers to hit a different URL (e.g. `/room/:id/og`), which doesn't happen automatically. You'd still need Netlify-level interception to redirect crawlers there.
- **vs. SSR rewrite**: Full SSR (vite-plugin-ssr, etc.) is a major architectural change for a narrow use case.
- **vs. pre-rendering service**: External services (Prerender.io, etc.) add cost and operational complexity.

The Netlify Edge Function approach requires:
1. One new file: `netlify/edge-functions/room-og.ts`
2. One new route in `netlify.toml`
3. One new public endpoint in the Hono server (or a direct Supabase DB query)

---

## Implementation Plan

### Step 1: Add a public room metadata endpoint to the Hono server

The existing `GET /room/:roomId` endpoint requires a session (`X-Session-Id`) and the internal API key. An OG-serving request from an edge function needs a simpler, lightweight fetch path.

Add a new route **before** the API key middleware in the Hono app:

```
GET /room/:roomId/meta
```

This endpoint should:
- Accept only the server's service-role Supabase key (passed as a header from the edge function, never exposed to the browser)
- Query Supabase directly for just the fields needed: `id`, `topic`, `description`, `imageUrl`, `emoji`
- Return a small JSON object (not the full room payload)
- Return 404 if the room doesn't exist

This keeps the public surface minimal and avoids exposing participant data or statements.

### Step 2: Create the Netlify Edge Function

Create `netlify/edge-functions/room-og.ts`.

**Logic:**

1. Check if the request is from a known crawler by inspecting the `User-Agent` header. Known bot UA strings include: `Twitterbot`, `facebookexternalhit`, `Slackbot`, `WhatsApp`, `LinkedInBot`, `Discordbot`, `TelegramBot`, `iMessage` (via `Facebot`), `Googlebot`.
2. If **not** a crawler: call `context.next()` immediately and return the normal SPA response. This ensures no impact on real users.
3. If **is** a crawler:
   - Parse `roomId` from the URL path.
   - Fetch `GET /room/:roomId/meta` from the Supabase Edge Function using the service-role key stored in a Netlify environment variable.
   - If the fetch fails or returns 404, fall through to `context.next()` (serve the default SPA shell).
   - If successful, fetch the `index.html` via `context.next()`, read it as text, and inject the OG meta tags into the `<head>`.
   - Return the modified HTML.

**Meta tags to inject:**

```html
<title>{emoji} {topic} | Heard</title>
<meta name="description" content="{description or fallback}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://heard.vote/room/{roomId}" />
<meta property="og:title" content="{emoji} {topic}" />
<meta property="og:description" content="{description or fallback}" />
<meta property="og:image" content="{imageUrl or default logo URL}" />
<meta property="og:site_name" content="Heard" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{emoji} {topic}" />
<meta name="twitter:description" content="{description or fallback}" />
<meta name="twitter:image" content="{imageUrl or default logo URL}" />
```

### Step 3: Wire up the edge function in `netlify.toml`

Add an edge function declaration that runs `room-og` for all `/room/*` paths:

```toml
[[edge_functions]]
  path = "/room/*"
  function = "room-og"
```

The existing `[[redirects]]` catch-all stays in place — it fires after the edge function for non-bot requests.

### Step 4: Configure environment variables

The edge function needs the service-role key to call the internal metadata endpoint. Add to Netlify environment variables (not committed to the repo):

```
SUPABASE_SERVICE_ROLE_KEY=<value>
SUPABASE_FUNCTIONS_URL=https://jzwmuyflifxsuclhphux.supabase.co/functions/v1/make-server-f1a393b4
```

---

## Scope Boundaries

**In scope for this feature:**
- Room URLs (`/room/:roomId`)

**Out of scope (possible future work):**
- Community URLs (`/h/:subHeard`)
- Event URLs (`/event/:eventId`)
- Flyer deep links
- Dynamic OG image generation (e.g. rendered card with topic text)

---

## Testing Plan

1. **Unit test the metadata endpoint** with a room that has all fields set and one with only `topic`.
2. **Local edge function testing** via `netlify dev` — confirm the injected HTML is correct for a bot UA and that a normal UA gets unmodified HTML.
3. **Bot simulation**: use `curl -A "Twitterbot/1.0" https://heard.vote/room/<id>` against the deployed preview URL and inspect the response HTML.
4. **Social debugger tools**:
   - [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   - [Twitter Card Validator](https://cards-dev.twitter.com/validator)
   - [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
   - [OpenGraph.xyz](https://www.opengraph.xyz/) for general preview

---

## Open Questions

1. **Image URL lifetime**: Room images are signed Supabase Storage URLs with a 10-year expiry. Crawlers may cache OG images aggressively. Is the long-lived signed URL acceptable, or should we use a public (non-signed) bucket policy for images?
2. **OG image dimensions**: The current `imageUrl` is a user-uploaded image of unknown dimensions. `summary_large_image` Twitter cards expect a 2:1 ratio. Should we add a crop/resize step, or accept that images may not display perfectly?
3. **Fallback image**: What URL should be used as the default OG image when a room has no cover image? (A hosted Heard logo asset URL is needed.)
4. **Rate limiting**: The `/room/:roomId/meta` endpoint will be called by crawlers, which can be frequent. Should it have its own rate limiting separate from the main API?
5. **Private/unlisted rooms**: Should rooms in unlisted communities still get full OG previews, or should they show only a generic "Join Heard" card without revealing the topic?

---

## Decisions

1. **Image URL lifetime**: Use signed URLs as-is. No changes to the current storage/signing setup.
2. **OG image dimensions**: Accept that images may not display perfectly on platforms with strict aspect ratio requirements. Revisit later if it becomes a real issue.
3. **Fallback image**: Use `/monkey.png` — the existing app favicon/logo already hosted at the site root.
4. **Rate limiting**: No additional rate limiting on the metadata endpoint for now.
5. **Private/unlisted rooms**: Show full OG previews (topic, description, image) regardless of whether the room's community is unlisted.
