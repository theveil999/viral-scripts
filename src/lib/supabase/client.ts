/**
 * @fileoverview Supabase client
 * @module lib/supabase/client
 */
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Browser client for Supabase
 * Use this in Client Components
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
