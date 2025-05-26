"use client";
import { useState } from "react";

interface Props {
  onChange: (valor: number) => void;
}

export default function LoanSlider({ onChange }: Props) {
  const [valor, setValor] = useState(1000);

  // calcula porcentagem para o gradiente
  const percent = ((valor - 500) / (10000 - 500)) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setValor(v);
    onChange(v);
  };

  return (
    <div className="w-full py-4">
      <label className="mb-2 block text-sm">Valor desejado (R$)</label>

      <input
        type="range"
        min={500}
        max={10000}
        step={100}
        value={valor}
        onChange={handleChange}
        className="range-slider"
        style={{ "--percent": `${percent}%` } as React.CSSProperties}
      />

      <p className="mt-2 text-lg font-semibold">
        {valor.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
          minimumFractionDigits: 0,
        })}
      </p>
    </div>
  );
}
