export const PROD_PROJECT_ID = "jzwmuyflifxsuclhphux";
const PROD_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6d211eWZsaWZ4c3VjbGhwaHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjg2ODEsImV4cCI6MjA3MzYwNDY4MX0.i-cgR8Zae0Z3XYOLHASWb9klc4MwU242QBdBLfYQ2fg";

export const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || PROD_PROJECT_ID;
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || PROD_ANON_KEY;