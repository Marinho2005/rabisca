import { gerarIdAleatorio } from './id'

const CHAVE_JOGADOR = 'rabisca:jogador'
let idEmMemoria = ''

export function obterIdJogador() {
  let id = ''
  try {
    id = sessionStorage.getItem(CHAVE_JOGADOR) || ''
  } catch {
    id = idEmMemoria
  }

  if (!id) {
    id = gerarIdAleatorio()
    idEmMemoria = id
    try {
      sessionStorage.setItem(CHAVE_JOGADOR, id)
    } catch {
      // Mantém o id em memória se o armazenamento estiver indisponível.
    }
  }

  return id
}
