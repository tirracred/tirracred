/* ------------------------------------------------------------------
   src/utils/analytics.ts – util de analytics seguro (GA4 + Plausible)
------------------------------------------------------------------- */

/** Parâmetros adicionais a serem enviados com o evento. */
export type AnalyticsParams = Record<string, unknown>;

/**
 * Tipo da função `gtag` (Google tag). Mantemos genérico porque o bundle
 * do Google muda de sig. mas sempre aceita `(...args: unknown[]) => void`.
 */
type GtagFn = (...args: unknown[]) => void;

/**
 * Estende o tipo global `window` para incluir, de forma opcional, os
 * métodos de analytics que serão injetados somente em produção.
 */
declare global {
  interface Window {
    gtag?: GtagFn;
    plausible?: (
      eventName: string,
      options?: { props?: AnalyticsParams }
    ) => void;
  }
}

/**
 * Dispara um evento em todos os provedores configurados.
 * – Não quebra em SSR (retorna cedo se `window` não existir)
 * – Não exige `// @ts-ignore` porque usamos operadores opcionais.
 *
 * @param name   Nome do evento (e.g. "purchase", "click")
 * @param params Qualquer objeto serializável com detalhes adicionais
 */
export function trackEvent(
  name: string,
  params: AnalyticsParams = {}
): void {
  if (typeof window === "undefined") return; // segurança para Next.js SSR

  // Google Analytics 4
  window.gtag?.("event", name, params);

  // Plausible
  window.plausible?.(name, { props: params });
}
