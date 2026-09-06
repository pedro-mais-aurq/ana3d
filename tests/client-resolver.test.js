import { describe, expect, it } from "vitest";
import {
  isValidClientSlug,
  resolveClientId
} from "../supabase/functions/_shared/client-resolver.ts";

function fakeSupabase(row) {
  return {
    from() {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        async maybeSingle() {
          return row;
        }
      };
    }
  };
}

describe("isValidClientSlug", () => {
  it.each([
    ["insight", true],
    ["ana-3d", true],
    ["ana-3d-store", true],
    ["Insight", false],
    ["ana_3d", false],
    ["-insight", false],
    ["insight-", false],
    ["", false],
    [null, false],
    [undefined, false],
    [42, false]
  ])("%s -> %s", (value, expected) => {
    expect(isValidClientSlug(value)).toBe(expected);
  });
});

describe("resolveClientId", () => {
  it("rejeita slug malformado sem consultar o banco", async () => {
    let called = false;
    const supabase = {
      from() {
        called = true;
        return fakeSupabase({ data: null, error: null }).from();
      }
    };

    const result = await resolveClientId(supabase, "Not Valid");

    expect(result).toEqual({
      valid: false,
      clientId: null,
      error: { code: "INVALID_CLIENT" }
    });
    expect(called).toBe(false);
  });

  it("resolve um slug conhecido para o client_id retornado pelo banco", async () => {
    const supabase = fakeSupabase({
      data: { id: "11111111-1111-1111-1111-111111111111" },
      error: null
    });

    const result = await resolveClientId(supabase, "ana-3d");

    expect(result).toEqual({
      valid: true,
      clientId: "11111111-1111-1111-1111-111111111111",
      error: null
    });
  });

  it("rejeita slug válido mas inexistente no banco", async () => {
    const supabase = fakeSupabase({ data: null, error: null });

    const result = await resolveClientId(supabase, "unknown-client");

    expect(result.valid).toBe(false);
    expect(result.error.code).toBe("INVALID_CLIENT");
  });

  it("rejeita quando a consulta retorna erro", async () => {
    const supabase = fakeSupabase({ data: null, error: { message: "boom" } });

    const result = await resolveClientId(supabase, "insight");

    expect(result.valid).toBe(false);
    expect(result.error.code).toBe("INVALID_CLIENT");
  });
});
