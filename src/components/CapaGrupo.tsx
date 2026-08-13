import { useRef } from "react";
import { Camera, Users } from "lucide-react";
import { useStore } from "@/lib/store";

/** Redimensiona e converte para data URL leve (persistível em localStorage). */
function comprimir(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("falha ao ler"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("imagem inválida"));
      img.onload = () => {
        const maxL = 1280;
        const escala = Math.min(1, maxL / img.width);
        const w = Math.round(img.width * escala);
        const h = Math.round(img.height * escala);
        const cv = document.createElement("canvas");
        cv.width = w;
        cv.height = h;
        const ctx = cv.getContext("2d");
        if (!ctx) return reject(new Error("sem canvas"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(cv.toDataURL("image/jpeg", 0.72));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function CapaGrupo() {
  const { data, setData } = useStore();
  const input = useRef<HTMLInputElement>(null);
  const capa = data.config.capa;
  const nome = data.config.nomeGrupo?.trim() || `${data.config.pessoaA} & ${data.config.pessoaB}`;

  const escolher = async (file: File | undefined) => {
    if (!file) return;
    try {
      const url = await comprimir(file);
      setData((d) => ({ ...d, config: { ...d.config, capa: url } }));
    } catch {
      /* ignora */
    }
  };

  return (
    <div className="panel relative mb-5 h-40 overflow-hidden p-0 min-[900px]:h-52">
      {capa ? (
        <img src={capa} alt={`Foto de capa de ${nome}`} className="size-full object-cover" />
      ) : (
        <div className="size-full bg-surface" />
      )}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-foreground/80 via-foreground/40 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold text-background min-[900px]:text-2xl">
            {nome}
          </p>
          <p className="inline-flex items-center gap-1.5 text-[10px] font-bold text-background/80">
            <Users size={12} /> 2 pessoas
          </p>
        </div>
      </div>

      <button
        onClick={() => input.current?.click()}
        aria-label="Trocar foto de capa"
        title="Trocar foto de capa"
        className="absolute right-3 top-3 rounded-full bg-card/85 p-2 text-foreground shadow-soft backdrop-blur-sm transition-colors hover:text-primary"
      >
        <Camera size={15} />
      </button>
      {capa && (
        <button
          onClick={() => setData((d) => {
            const { capa: _r, ...cfg } = d.config;
            return { ...d, config: cfg };
          })}
          className="absolute right-3 top-14 rounded-full bg-card/85 px-2 py-1 text-[9px] font-bold text-muted-foreground shadow-soft backdrop-blur-sm transition-colors hover:text-destructive"
        >
          Remover
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void escolher(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
