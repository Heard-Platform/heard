# See CN-9
cp -r src/supabase/functions/server supabase/functions/make-server-f1a393b4
cp src/supabase/functions/server/index.tsx supabase/functions/make-server-f1a393b4/index.ts
supabase functions deploy make-server-f1a393b4 --project-ref jzwmuyflifxsuclhphux
/bin/rm -rf supabase/functions/make-server-f1a393b4
