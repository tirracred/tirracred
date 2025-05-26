"use client";

import { useState } from "react";
import LoanSlider   from "@/components/LoanSlider";
import ParcelSelect from "@/components/ParcelSelect";
import LeadForm     from "@/components/LeadForm";

export default function Home() {
  const [valor,       setValor]       = useState(1000);
  const [parcelas,    setParcelas]    = useState(12);
  const [mostrarForm, setMostrarForm] = useState(false);

  return (
    <main className="mx-auto max-w-5xl p-6 lg:grid lg:grid-cols-2 lg:gap-12">
      {/* Simulador */}
      <section className="space-y-6">
        <h1 className="text-center text-2xl font-bold lg:text-left">
          Simule seu empréstimo agora
        </h1>

        <LoanSlider   onChange={setValor}    />
        <ParcelSelect onChange={setParcelas} />

        {/* Botão só em mobile */}
        {!mostrarForm && (
          <button
            className="mt-4 w-full rounded bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 lg:hidden"
            onClick={() => setMostrarForm(true)}
          >
            Continuar&nbsp;
            {valor.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
              minimumFractionDigits: 0,
            })}{" "}
            em&nbsp;{parcelas}x
          </button>
        )}
      </section>

      {/* Formulário */}
      <section className="mt-8 lg:mt-0">
        {/* Desktop: sempre visível */}
        <div className="hidden lg:block">
          <LeadForm />
        </div>

        {/* Mobile: aparece após clicar no botão */}
        {mostrarForm && (
          <div className="lg:hidden">
            <LeadForm />
          </div>
        )}
      </section>
    </main>
  );
}
