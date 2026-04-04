import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não encontrada nas variáveis de ambiente. Você precisa adicioná-la no arquivo .env.");
  }

  // Invoca o construtor usando a super chave de privilégios.
  // Bypass automático de qualquer impedimento do Row-Level Security
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
