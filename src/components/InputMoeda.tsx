import { cn } from "@/lib/utils";

/** Formata uma string de dígitos (centavos) como moeda BRL. */
function formatarCentavos(digitos: string) {
  const limpo = digitos.replace(/\D/g, "").slice(0, 12);
  const n = limpo ? parseInt(limpo, 10) / 100 : 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Campo de valor em reais com máscara automática "estilo caixa eletrônico":
 * cada dígito digitado entra pela direita, empurrando os centavos.
 */
export default function InputMoeda({
  value,
  onChange,
  className,
  placeholder = "R$ 0,00",
  autoFocus,
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const digitos = value > 0 ? String(Math.round(value * 100)) : "";

  return (
    <input
      className={cn("field num", className)}
      inputMode="numeric"
      autoFocus={autoFocus}
      placeholder={placeholder}
      value={digitos ? formatarCentavos(digitos) : ""}
      onChange={(e) => {
        const limpo = e.target.value.replace(/\D/g, "").slice(0, 12);
        onChange(limpo ? parseInt(limpo, 10) / 100 : 0);
      }}
    />
  );
}
