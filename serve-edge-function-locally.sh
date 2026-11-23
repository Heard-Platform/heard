set -e
local_workdir="local-stack"
local_env_file="$local_workdir/functions.env"
local_function_dir="$local_workdir/supabase/functions/make-server-f1a393b4"

if grep -q "^HEARD_ENV=production" "$local_env_file"; then
  echo "$local_env_file must not set HEARD_ENV=production"
  exit 1
fi

mkdir -p "$local_workdir/supabase/functions"
/bin/rm -rf "$local_function_dir"
cp -r src/supabase/functions/server "$local_function_dir"
cp src/supabase/functions/server/index.tsx "$local_function_dir/index.ts"
supabase functions serve --workdir "$local_workdir" --no-verify-jwt --env-file "$local_env_file"
