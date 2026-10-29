export function normalizarTexto(texto = '') {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function mesmosTextos(a, b) {
  return normalizarTexto(a) === normalizarTexto(b)
}

export function mascararPalavra(palavra = '') {
  return palavra
    .split('')
    .map((caractere) => {
      if (caractere === ' ' || caractere === '-') return ' '
      return '_'
    })
    .join('')
}
