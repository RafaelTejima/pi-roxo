// ============================================================
// REGRAS DE NEGÓCIO: TIERS DE RETENÇÃO DA PLATAFORMA
// - Tier 1: Prêmios até R$ 200,00 -> retém 12%
// - Tier 2: Prêmios entre R$ 201,00 e R$ 1.500,00 -> retém 8%
// - Tier 3: Prêmios acima de R$ 1.500,00 -> retém 5%
// ============================================================

/**
 * Calcula a retenção da plataforma baseada nos tiers de premiação.
 * @param {number|string} valorInput - Valor total bruto da premiação acumulada.
 * @returns {{ tier: number, percentual: number, taxaPlataforma: number, premioLiquido: number } | null}
 */
export function calcularRetencao(valorInput) {
  const valor = Number(valorInput)
  if (!valorInput || isNaN(valor) || valor <= 0) {
    return null
  }

  let percentual = 12
  let tier = 1

  if (valor > 1500) {
    percentual = 5
    tier = 3
  } else if (valor > 200) {
    percentual = 8
    tier = 2
  }

  const taxaPlataforma = (valor * percentual) / 100
  const premioLiquido = valor - taxaPlataforma

  return {
    tier,
    percentual,
    taxaPlataforma,
    premioLiquido,
  }
}

/**
 * Formata um valor numérico para o formato monetário brasileiro (R$ 0,00).
 * @param {number|string} val
 * @returns {string}
 */
export function formatarMoeda(val) {
  return Number(val || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}
