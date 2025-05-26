/* ─── src/components/PartnerCard.tsx ──────────────────────────────────── */
"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Partner {
  id: number;
  nome: string;
  link: string;
  img: string;
  beneficios: string;
  selo: string;
  payout?: number;
}

interface Props {
  p: Partner;
  /** id atualmente escolhido na página */
  selecionado?: number | null;
  /** callback para marcar / desmarcar na página */
  onSelect?: (id: number) => void;
}

export default function PartnerCard({ p, selecionado, onSelect }: Props) {
  /* ---------- estados internos ---------- */
  const [flip, setFlip] = useState(false); // vira carta
  const isActive = selecionado === p.id; // realce seleção
  const src = p.img?.trim() || "/parceiros/placeholder.png";

  /* ---------- benefícios detalhados ---------- */
  const beneficiosDetalhados: Record<number, string[]> = {
    1: [
      "Aceita score baixo e negativados",
      "R$ 500 a 2.500",
      "Parcelamento até 12 meses",
      "PIX em 30 minutos",
      "100 % online",
    ],
    2: [
      "Antecipe salário sendo autônomo",
      "Dinheiro em 2 min",
      "Sem análise tradicional",
      "Taxa menor que cheque especial",
    ],
    3: [
      "Compare em +50 bancos",
      "Várias modalidades",
      "Simule sem impactar o score",
      "Juros sob medida",
    ],
    4: [
      "R$ 1 mil até R$ 50 mil",
      "Para CLT, autônomo e MEI",
      "Resposta rápida",
      "Taxas competitivas",
    ],
    5: [
      "Conta + Cartão de Crédito grátis",
      "Mercado Crédito",
      "Empréstimo Mercado Pago",
      "Cashback",
      "Tudo direto no app",
    ],
    6: [
      "Limite garantido com caução",
      "Conta PicPay sem tarifa + cashback",
      "Pague boletos via cartão",
      "Empréstimo para Negativado",
    ],
    7: [
      "Até 99 % de desconto",
      "Negociação online",
      "Regularize seu nome",
      "Parcelamento de Dívidas",
    ],
    8: [
      "Cartão Ourocard sem anuidade",
      "Limite alto com score baixo",
      "Programa de pontos",
    ],
    9: [
      "Aprova na Hora",
      "Limite Alto",
      "Aceita Negativados",
      "Bandeira VISA",
    ],
    10: [
      "Empréstimo para quem recebe Bolsa Família",
      "Pode solicitar mesmo recebendo o Bolsa Família",
      "Liberação via WhatsApp",
      "Dinheiro na Hora",
    ],
    11: [
      "Conta Santander + Cartão SX",
      "Zera anuidade com uso",
      "Limite instantâneo",
      "Investimentos integrados",
    ],
    12: [
      "Pontos e Milhas",
      "Sala VIP",
      "Seguros Itaú",
      "Cartão Itaú Azul internacional",
    ],
    13: [
      "Desconto Assaí",
      "2 cartões extras grátis",
      "Vai de Visa",
      "Controle pelo app",
    ],
  };

  /* ---------- JSX ---------- */
  return (
    <motion.article
      layout
      onClick={() => onSelect?.(p.id)}
      initial={{ y: 0, filter: "blur(0px)" }}
      whileHover={{
        y: -6,
        scale: 1.03,
        filter: "blur(0.px) brightness(1.05)",
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 140, damping: 16 }}
      className={`relative h-[360px] w-full cursor-pointer perspective ${
        isActive ? "ring-4 ring-emerald-400 shadow-lg" : "shadow-sm"
      } flex flex-col items-center rounded-2xl bg-white p-5 ring-1 ring-gray-200 transition-shadow`}
    >
      {/* ✔ marcador de seleção */}
      {isActive && (
        <motion.span
          className="absolute -left-0 -top-0 rounded-full bg-emerald-500 p-1 text-xs text-white"
          initial={{ scale: 0 }}
          animate={{ scale: 0 }}
        >
          
        </motion.span>
      )}

      {/* --- bloco que gira --- */}
      <motion.div
        animate={flip ? { rotateY: 180 } : { rotateY: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative h-full w-full preserve-3d"
      >
        {/* -------- FACE FRONTAL -------- */}
        <div
          className="card-face absolute inset-0 flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.span
            className="absolute -top-3 right-4 select-none text-yellow-400"
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
          >
            💰
          </motion.span>

          <p className="mb-2 text-sm font-medium text-gray-500">{p.nome}</p>

          <img
            src={src}
            alt={p.nome}
            width={120}
            height={160}
            className="mb-4 object-contain"
          />

          <span className="mb-3 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-600">
            {p.selo}
          </span>

          {/* CTA */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              window.open(p.link, "_blank");
            }}
            className="mb-4 w-full rounded-md bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-700"
          >
            Pedir
          </motion.button>

          {/* botão que vira */}
          <motion.button
            whileHover={{ scale: 1.05, filter: "blur(0.15px) brightness(1.05)" }}
            onClick={(e) => {
              e.stopPropagation();
              setFlip(true);
            }}
            transition={{ duration: 0.25 }}
            className="w-full rounded-b-md bg-green-50 py-2 text-center text-sm font-medium text-green-800 hover:bg-green-100"
          >
            Vantagens
          </motion.button>
        </div>

        {/* -------- FACE TRASEIRA -------- */}
        <div
          className="card-face absolute inset-0 flex flex-col items-center rotate-y-180"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Benefícios deste parceiro
          </h3>

          <ul className="flex-1 list-disc space-y-1 pl-4 text-sm text-gray-600">
            {(beneficiosDetalhados[p.id] || ["Veja as condições no site."]).map(
              (b, i) => (
                <li key={i}>{b}</li>
              )
            )}
          </ul>

          <motion.button
            whileHover={{ scale: 1.05, filter: "blur(0.15px) brightness(1.05)" }}
            onClick={(e) => {
              e.stopPropagation();
              setFlip(false);
            }}
            transition={{ duration: 0.25 }}
            className="mt-4 w-full rounded bg-green-100 py-3 text-sm font-medium text-green-800 hover:bg-green-200"
          >
            🔁 Voltar
          </motion.button>
        </div>
      </motion.div>
    </motion.article>
  );
}
