"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PartnerCard from "@/components/PartnerCard";

/* tipo compatível com PartnerCard ---------------------- */
interface Partner {
  id: number;
  nome: string;
  link: string;
  img: string;
  beneficios: string;
  selo: string;
}

export default function Resultados() {
  const router                 = useRouter();
  const [lista, setLista]      = useState<Partner[]>([]);
  const [loading, setLoad]     = useState(true);
  const [selecionado, setSel ] = useState<number | null>(null);

  /* carrega apenas 1x --------------------------------- */
  useEffect(() => {
    fetch("/api/recomendacoes")
      .then((r) => (r.ok ? r.json() : Promise.reject("API error")))
      .then((data: Partner[]) => setLista(data))
      .catch((err) => console.error("Falha no fetch:", err))
      .finally(() => setLoad(false));
  }, []);

  if (loading)
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="animate-pulse text-gray-500">Carregando…</p>
      </main>
    );

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      {/* BOTÃO VOLTAR */}
      <motion.button
        onClick={() => router.back()}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0,  opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{   scale: 0.93 }}
        className="sticky top-4 inline-flex items-center gap-1 rounded-md
                   bg-gray-100 px-3 py-2 text-sm text-gray-700 shadow
                   hover:bg-gray-200"
      >
        ← Voltar
      </motion.button>

      <h2 className="text-center text-2xl font-bold">
        Confira o que você pode pedir
      </h2>

      {/* DESKTOP GRID */}
      <div className="hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {lista.map((p) => (
          <PartnerCard
            key={p.id}
            p={p}
            selecionado={selecionado}
            onSelect={(id) => setSel(id === selecionado ? null : id)}
          />
        ))}
      </div>

      {/* MOBILE CARROSSEL */}
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:hidden">
        {lista.map((p) => (
          <div key={p.id} className="w-72 shrink-0 snap-center">
            <PartnerCard
              p={p}
              selecionado={selecionado}
              onSelect={(id) => setSel(id === selecionado ? null : id)}
            />
          </div>
        ))}
      </div>
    </main>
  );
}
