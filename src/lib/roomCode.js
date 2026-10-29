export const ALFABETO_SALA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const TAMANHO_CODIGO = 6

const PERMITIDOS = new Set(ALFABETO_SALA)

export function gerarCodigoSala(tamanho = TAMANHO_CODIGO) {
  let codigo = ''
  const limite = 256 - (256 % ALFABETO_SALA.length)

  while (codigo.length < tamanho) {
    const bytes = new Uint8Array(tamanho * 2)
    crypto.getRandomValues(bytes)

    for (const byte of bytes) {
      if (byte >= limite) continue
      codigo += ALFABETO_SALA[byte % ALFABETO_SALA.length]
      if (codigo.length === tamanho) break
    }
  }

  return codigo
}

export function normalizarCodigoSala(valor = '') {
  return String(valor)
    .toUpperCase()
    .split('')
    .filter((caractere) => PERMITIDOS.has(caractere))
    .slice(0, TAMANHO_CODIGO)
    .join('')
}

export function codigoValido(codigo = '') {
  return codigo.length === TAMANHO_CODIGO && [...codigo].every((c) => PERMITIDOS.has(c))
}

export function codigoDaUrl() {
  if (typeof window === 'undefined') return ''
  const codigo = new URLSearchParams(window.location.search).get('sala') || ''
  return normalizarCodigoSala(codigo)
}

export function atualizarUrlSala(codigo) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (codigo) {
    url.searchParams.set('sala', codigo)
  } else {
    url.searchParams.delete('sala')
  }
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

export function linkDaSala(codigo) {
  if (typeof window === 'undefined') return ''
  const url = new URL(window.location.href)
  url.searchParams.set('sala', codigo)
  url.hash = ''
  return url.toString()
}
