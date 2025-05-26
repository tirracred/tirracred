'use client';
import { useState } from 'react';

interface Props {
  onChange: (parcelas: number) => void;
}

export default function ParcelSelect({ onChange }: Props) {
  const [parcelas, setParcelas] = useState(12);

  const opcoes = Array.from({ length: 12 }, (_, i) => (i + 1) * 3); // 3,6,…36

  return (
    <div className="py-4">
      <label className="block text-sm mb-2">Quantidade de parcelas</label>
      <select
        value={parcelas}
        onChange={(e) => {
          const p = Number(e.target.value);
          setParcelas(p);
          onChange(p);
        }}
        className="border rounded px-3 py-2 w-full"
      >
        {opcoes.map((n) => (
          <option key={n}>{n}</option>
        ))}
      </select>
    </div>
  );
}
