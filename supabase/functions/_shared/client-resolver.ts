import type { createAdminClient } from "./admin-client.ts";

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export type ClientResolution =
  | { valid: true; clientId: string; error: null }
  | { valid: false; clientId: null; error: { code: string } };

export function isValidClientSlug(value: unknown): value is string {
  return typeof value === "string" && SLUG_PATTERN.test(value);
}

/**
 * Resolve um `clientSlug` público (ex.: "insight", "ana-3d") para o
 * `client_id` interno. Nenhuma Edge Function confia em um `clientId`
 * enviado diretamente pelo browser; apenas o slug é aceito como entrada
 * e a resolução acontece sempre no servidor, com a service role.
 */
export async function resolveClientId(
  supabase: ReturnType<typeof createAdminClient>,
  clientSlug: unknown
): Promise<ClientResolution> {
  if (!isValidClientSlug(clientSlug)) {
    return { valid: false, clientId: null, error: { code: "INVALID_CLIENT" } };
  }

  const { data, error } = await supabase
    .from("clients")
    .select("id")
    .eq("slug", clientSlug)
    .maybeSingle();

  if (error || !data?.id) {
    return { valid: false, clientId: null, error: { code: "INVALID_CLIENT" } };
  }

  return { valid: true, clientId: data.id, error: null };
}
