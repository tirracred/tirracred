// src/app/api/recomendacoes/route.ts
import { NextResponse } from "next/server";

interface Parceiro {
  id: number;
  nome: string;
  link: string;
  img: string;
  beneficios: string;
  selo: string;
  payout: number;
}

const parceiros: Parceiro[] = [
  {
    id: 1,
    nome: "SuperSim Empréstimo",
    link: "https://susim.co/wwjLtRkN81wwsLSCGK9aHQ==",
    img: "/parceiros/supersim.png",
    beneficios: "Libera até quem tem score baixo!",
    selo: "⚡ Até R$2.500 em minutos",
    payout: 50
  },
  {
    id: 2,
    nome: "Fácio Empréstimo",
    link: "https://bit.ly/3utvJSG",
    img: "/parceiros/facio.png",
    beneficios: "Receba antecipação direto na conta",
    selo: "✅ Dinheiro em até 2 minutos",
    payout: 15
  },
  {
    id: 3,
    nome: "Juros Baixos",
    link: "https://bit.ly/414zSbS",
    img: "/parceiros/jurosbaixos.png",
    beneficios: "Compare ofertas de mais de 30 bancos",
    selo: "📊 Marketplace de crédito completo",
    payout: 21
  },
  {
    id: 4,
    nome: "Bom Pra Crédito",
    link: "https://apretailer.com.br/click/654e2cf42bfa813d7e724393/148693/307759/subaccount",
    img: "/parceiros/bompracredito.png",
    beneficios: "Simule empréstimo personalizado online",
    selo: "💳 Taxas competitivas de verdade",
    payout: 10
  },
  {
    id: 5,
    nome: "Mercado Pago",
    link: "https://apps.apple.com/us/app/mercado-pago-cuenta-digital/id925436649?mt=8",
    img: "/parceiros/mpago.png",
    beneficios: "Conta, cartão e crédito num só app",
    selo: "💰 Ganhe até R$50 + Cashback",
    payout: 45
  },
  {
    id: 6,
    nome: "PicPay Conta Garantida",
    link: "https://picpay.onelink.me/kAIe/hrfzvmlc",
    img: "/parceiros/picpay.png",
    beneficios: "Aumente seu limite com saldo garantido",
    selo: "🔒 Liberação fácil e segura",
    payout: 20
  },
  {
    id: 7,
    nome: "Acordo Certo – Negociação de Dívidas",
    link: "https://bit.ly/4f9eMOv",
    img: "/parceiros/acordocerto.png",
    beneficios: "Renegocie e volte a ter crédito no mercado",
    selo: "🧹 Limpe seu nome agora mesmo",
    payout: 20
  },
  {
    id: 8,
    nome: "Cartão Ourocard Banco do Brasil",
    link: "https://apretailer.com.br/click/674a05ba2bfa8139e12612e2/185834/307759/subaccount",
    img: "/parceiros/ourocard.png",
    beneficios: "Cartão internacional com limite alto",
    selo: "💳 Aprova até com score médio",
    payout: 20
  },
  {
    id: 9,
    nome: "Brasilcard Crédito",
    link: "https://apretailer.com.br/click/67ec2eb62bfa8179a731986e/185189/307759/subaccount",
    img: "/parceiros/brasilcard.png",
    beneficios: "Aprovação simples e rápida pelo app",
    selo: "📱 Em até 2 minutos",
    payout: 20
  },
  {
    id: 10,
    nome: "Empréstimo Bolsa Família",
    link: "https://apretailer.com.br/click/67ec2eb62bfa8179a731986e/185189/307759/subaccount",
    img: "/parceiros/novohorizontebolsafamilia.png",
    beneficios: "Crédito mesmo recebendo benefício",
    selo: "👨‍👩‍👧‍👦 Liberação simplificada",
    payout: 20
  },
  {
    id: 11,
    nome: "Santander SX – Conta e Cartão",
    link: "https://bit.ly/4jdUsO0",
    img: "/parceiros/santander.png",
    beneficios: "Conta digital e cartão sem anuidade",
    selo: "🏦 Limite liberado no ato",
    payout: 20
  },
  {
    id: 12,
    nome: "Cartão Azul Itaú Skyline",
    link: "https://apretailer.com.br/click/683148112bfa811f81686ac2/186755/307759/subaccount",
    img: "/parceiros/itauskyline.png",
    beneficios: "Cartão Gold para quem quer viajar",
    selo: "✈️ Benefícios em milhas",
    payout: 20
  },
  {
    id: 13,
    nome: "Cartão Passaí Itaú Gold",
    link: "https://apretailer.com.br/click/683148102bfa811f8973be99/186753/307759/subaccount",
    img: "/parceiros/itaupassai.png",
    beneficios: "Cartão ideal para supermercados",
    selo: "🛒 Limite rápido e sem anuidade",
    payout: 20
  }
];

export async function GET() {
  const ordenado = parceiros.sort((a, b) => b.payout - a.payout);
  return NextResponse.json(ordenado);
}
