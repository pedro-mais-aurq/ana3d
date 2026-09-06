import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const migrationUrl = new URL(
  "../supabase/migrations/20260905120000_p4_multi_client.sql",
  import.meta.url
);

describe("multi-client SQL da P4", () => {
  it("faz backfill de client_id antes de torná-lo NOT NULL", async () => {
    const sql = await readFile(migrationUrl, "utf8");

    const addColumnPosition = sql.indexOf("add column client_id uuid references public.clients(id)");
    const backfillPosition = sql.indexOf("set client_id = (select id from public.clients where slug = 'insight')");
    const guardPosition = sql.indexOf("where client_id is null");
    const notNullPosition = sql.indexOf("alter column client_id set not null");

    expect(addColumnPosition).toBeGreaterThan(-1);
    expect(backfillPosition).toBeGreaterThan(addColumnPosition);
    expect(guardPosition).toBeGreaterThan(backfillPosition);
    expect(notNullPosition).toBeGreaterThan(guardPosition);
  });

  it("nunca apaga dados existentes de model_uploads", async () => {
    const sql = await readFile(migrationUrl, "utf8");

    expect(sql).not.toMatch(/delete\s+from\s+public\.model_uploads/i);
    expect(sql).not.toMatch(/truncate\s+public\.model_uploads/i);
  });

  it("cria os clients insight e ana-3d sem duplicar em reexecução", async () => {
    const sql = await readFile(migrationUrl, "utf8");

    expect(sql).toContain("('insight', 'Insight')");
    expect(sql).toContain("('ana-3d', 'Ana 3D')");
    expect(sql).toContain("on conflict (slug) do nothing");
  });

  it("não cria nenhuma policy pública em clients", async () => {
    const sql = await readFile(migrationUrl, "utf8");

    expect(sql).toContain("alter table public.clients enable row level security");
    expect(sql).not.toMatch(/create policy/i);
  });

  it("indexa client_id para consultas escaláveis por client", async () => {
    const sql = await readFile(migrationUrl, "utf8");

    expect(sql).toContain("create index model_uploads_client_id_idx");
    expect(sql).toContain("create index model_uploads_client_id_status_idx");
  });
});
