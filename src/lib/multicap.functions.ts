import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const entradaLeitura = z.object({ codigo: z.string().min(1).max(64) });
const entradaGravacao = entradaLeitura.extend({
  dados: z.unknown(),
  sessao: z.string().max(64).optional(),
});

export const carregarDados = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => entradaLeitura.parse(data))
  .handler(async ({ data }) => {
    const { codigoValido, normalizarCodigo } = await import("./multicap.server");
    if (!codigoValido(data.codigo)) throw new Error("Código inválido");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: linha, error } = await supabaseAdmin
      .from("multicap_dados")
      .select("dados, atualizado_em, atualizado_por")
      .eq("codigo", normalizarCodigo(data.codigo))
      .maybeSingle();

    if (error) throw new Error(error.message);
    return {
      dados: linha?.dados ?? null,
      atualizado_em: linha?.atualizado_em ?? null,
      atualizado_por: linha?.atualizado_por ?? null,
    };
  });

export const salvarDados = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => entradaGravacao.parse(data))
  .handler(async ({ data }) => {
    const { codigoValido, normalizarCodigo } = await import("./multicap.server");
    if (!codigoValido(data.codigo)) throw new Error("Código inválido");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("multicap_dados").upsert({
      codigo: normalizarCodigo(data.codigo),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dados: data.dados as any,
      atualizado_por: data.sessao ?? null,
    });

    if (error) throw new Error(error.message);
    return { ok: true };
  });
