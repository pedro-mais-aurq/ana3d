// Identificação central desta aplicação perante o backend compartilhado.
//
// O mesmo projeto Supabase é usado por múltiplos sites (Insight, Ana 3D, ...).
// Cada Edge Function resolve `clientSlug` para um `client_id` no servidor e
// isola todas as leituras/escritas por esse client. Nenhum outro módulo deve
// declarar o slug diretamente; sempre importe `APP_CLIENT` a partir daqui.
export const APP_CLIENT = Object.freeze({
  slug: "ana-3d"
});
