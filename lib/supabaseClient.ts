import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://mlfcisicjkbsozlllewg.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sZmNpc2ljamtic296bGxsZXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NDgyODUsImV4cCI6MjA3NTMyNDI4NX0.9hxU6wU4-zqCnakSX4MLx08_I0uJWfG6I4B7NQfZXg0";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
