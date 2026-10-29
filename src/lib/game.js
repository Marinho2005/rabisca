import { mascararPalavra } from './normalize'

export function criarEstadoLobby(config = { tempo: 75 }) {
  return {
    status: 'lobby',
    rodada: 0,
    totalRodadas: 0,
    desenhistaId: null,
    desenhistaNome: '',
    dica: '',
    tempoRestante: 0,
    tempoTotal: config.tempo,
    placar: {},
    participantes: [],
    acertos: [],
    palavraRevelada: null,
    motivoFim: '',
  }
}

export function criarEstadoRodada({
  participantes,
  indiceRodada,
  totalRodadas,
  desenhista,
  palavra,
  tempoTotal,
  placar = {},
}) {
  return {
    status: 'playing',
    rodada: indiceRodada + 1,
    totalRodadas,
    desenhistaId: desenhista.id,
    desenhistaNome: desenhista.nome,
    dica: mascararPalavra(palavra),
    tempoRestante: tempoTotal,
    tempoTotal,
    placar: { ...placar },
    participantes: participantes.map(({ id, nome }) => ({ id, nome })),
    acertos: [],
    palavraRevelada: null,
    motivoFim: '',
  }
}

export function pontosPorAcerto(tempoRestante, tempoTotal) {
  const proporcao = Math.max(0, Math.min(1, tempoRestante / Math.max(1, tempoTotal)))
  return 100 + Math.round(proporcao * 100)
}

export function rankingDoJogo(game) {
  if (!game) return []
  return [...game.participantes]
    .map((jogador) => ({
      ...jogador,
      pontos: game.placar[jogador.id] || 0,
    }))
    .sort((a, b) => b.pontos - a.pontos || a.nome.localeCompare(b.nome))
}
