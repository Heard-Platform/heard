
  # Heard

  Heard is a participatory survey platform inspired by Polis, vTaiwan, and Participativo Brazil. It is a large-scale civic engagement platform, but designed for the Instagram/TikTok generation. Fast, fun, and built as a network rather than a one-off tool.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Environment variables

  ### Netlify

  | Variable | Description |
  |---|---|
  | `SUPABASE_FUNCTIONS_URL` | Base URL of the deployed Supabase Edge Function. Used by the `room-og` edge function to fetch OG HTML for link previews. Set to `https://<project-ref>.supabase.co/functions/v1/make-server-f1a393b4`. |
  | `SUPABASE_ANON_KEY` | Supabase public anon key. Required to invoke the Edge Function from the Netlify edge runtime (same value as `VITE_SUPABASE_ANON_KEY` in the frontend env). |

  ## License

  [MIT](LICENSE)