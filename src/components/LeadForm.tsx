"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LeadForm() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);

    const payload = Object.fromEntries(new FormData(e.currentTarget));

    try {
      // 🔄  envia apenas os dados do lead para a rota /api/leads
      const r = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (r.ok) {
        // redireciona para a página de recomendações
        router.push("/resultados");
        return; // evita resetar estado depois do redirect
      }

      alert("Erro ao enviar. Tente novamente.");
    } catch (err) {
      console.error("Falha no envio:", err);
      alert("Erro inesperado. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-md space-y-4 px-4"
    >
      <input
        name="nome"
        placeholder="Nome completo"
        required
        className="w-full rounded-md bg-gray-100 p-3 text-base outline-none focus:ring-2 focus:ring-green-500"
      />
      <input
        name="cpf"
        placeholder="CPF"
        required
        className="w-full rounded-md bg-gray-100 p-3 text-base outline-none focus:ring-2 focus:ring-green-500"
      />
      <input
        name="whatsapp"
        placeholder="WhatsApp (DDD + nº)"
        required
        className="w-full rounded-md bg-gray-100 p-3 text-base outline-none focus:ring-2 focus:ring-green-500"
      />
      <input
        name="email"
        type="email"
        placeholder="E-mail"
        required
        className="w-full rounded-md bg-gray-100 p-3 text-base outline-none focus:ring-2 focus:ring-green-500"
      />
      <input
        name="renda"
        type="number"
        placeholder="Renda mensal (R$)"
        required
        className="w-full rounded-md bg-gray-100 p-3 text-base outline-none focus:ring-2 focus:ring-green-500"
      />

      <button
        disabled={enviando}
        className="w-full rounded-md bg-green-600 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
      >
        {enviando ? "Enviando…" : "Continuar"}
      </button>
    </form>
  );
}
