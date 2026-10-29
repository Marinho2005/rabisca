import { createContext, useContext, useEffect, useRef } from 'react'
import { supabase, supabaseConfigurado } from '../lib/supabase'
import { obterIdJogador } from '../lib/playerId'
import { gerarIdAleatorio } from '../lib/id'
import { atualizarUrlSala } from '../lib/roomCode'
import { normalizarTexto, mesmosTextos } from '../lib/normalize'
import { sortearPalavra } from '../lib/words'
import {
  CONFIG_PADRAO,
  useStore,
} from '../store/useStore'
import {
  criarEstadoLobby,
  criarEstadoRodada,
  pontosPorAcerto,
} from '../lib/game'

export const RoomContext = createContext(null)

export function useRoomContext() {
  return useContext(RoomContext)
}

function normalizarConfig(config = {}) {
  const voltas = Math.min(3, Math.max(1, Number(config.voltas) || 1))
  const tempo = [60, 75, 90].includes(Number(config.tempo))
    ? Number(config.tempo)
    : CONFIG_PADRAO.tempo
  return { voltas, tempo }
}

function gerarIdMensagem() {
  return `${Date.now()}-${gerarIdAleatorio().slice(0, 8)}`
}

export function useRoom() {
  const canalRef = useRef(null)
  const playerIdRef = useRef('')
  const codigoRef = useRef('')
  const modoRef = useRef('entrar')
  const nomeBaseRef = useRef('')
  const nomeAtualRef = useRef('')
  const entrouEmRef = useRef(0)
  const hostIdRef = useRef(null)
  const jogadoresRef = useRef([])
  const eraHostRef = useRef(false)
  const saindoRef = useRef(false)
  const recriandoRef = useRef(false)
  const jaIniciouSyncRef = useRef(false)
  const estadoRecebidoRef = useRef(false)
  const ultimaRodadaPedidaRef = useRef(0)
  const ultimaRodadaRecebidaRef = useRef(0)
  const statusRecebidoRef = useRef('')

  const gameRef = useRef(null)
  const configRef = useRef(CONFIG_PADRAO)
  const segredoRef = useRef('')
  const segredoRodadaRef = useRef(0)
  const usadasRef = useRef([])

  const tickRef = useRef(null)
  const revelarRef = useRef(null)
  const checagemSalaRef = useRef(null)
  const reconexaoRef = useRef(null)
  const fimPorAcertosRef = useRef(null)
  const desenhistaAusenteRef = useRef(null)
  const semPalavraRef = useRef(null)

  const ultimoEstadoEnviadoRef = useRef(0)
  const ultimoTracoEnviadoRef = useRef(0)
  const ultimoPalpiteRef = useRef(0)
  const ultimaBuscaHistoricoRef = useRef(0)
  const ultimoPedidoEstadoRef = useRef(0)
  const palpitePorJogadorRef = useRef(new Map())
  const historicoPorJogadorRef = useRef(new Map())

  function souHost() {
    return Boolean(
      canalRef.current &&
        playerIdRef.current &&
        hostIdRef.current === playerIdRef.current,
    )
  }

  function emitir(evento, payload) {
    const canal = canalRef.current
    if (!canal) return
    try {
      const resultado = canal.send({ type: 'broadcast', event: evento, payload })
      if (resultado && typeof resultado.catch === 'function') {
        resultado.catch(() => {})
      }
    } catch {
      // A reconexão do canal resolve envios durante quedas de rede.
    }
  }

  function adicionarChatLocal(mensagem) {
    useStore.getState().adicionarChat({
      id: mensagem.id || gerarIdMensagem(),
      ...mensagem,
    })
  }

  function publicarChat(mensagem) {
    const completa = {
      id: mensagem.id || gerarIdMensagem(),
      de: playerIdRef.current,
      ts: Date.now(),
      ...mensagem,
    }
    adicionarChatLocal(completa)
    emitir('chat', completa)
  }

  function limparTimersDeJogo() {
    if (tickRef.current) clearInterval(tickRef.current)
    if (revelarRef.current) clearTimeout(revelarRef.current)
    if (fimPorAcertosRef.current) clearTimeout(fimPorAcertosRef.current)
    if (desenhistaAusenteRef.current) clearTimeout(desenhistaAusenteRef.current)
    if (semPalavraRef.current) clearTimeout(semPalavraRef.current)
    tickRef.current = null
    revelarRef.current = null
    fimPorAcertosRef.current = null
    desenhistaAusenteRef.current = null
    semPalavraRef.current = null
  }

  function limparTimersDeConexao() {
    if (checagemSalaRef.current) clearTimeout(checagemSalaRef.current)
    if (reconexaoRef.current) clearTimeout(reconexaoRef.current)
    checagemSalaRef.current = null
    reconexaoRef.current = null
  }

  function listaPresenca() {
    const canal = canalRef.current
    if (!canal) return []
    const estado = canal.presenceState()
    const vistos = new Set()
    const lista = []

    Object.values(estado).forEach((entradas) => {
      entradas.forEach((meta) => {
        if (!meta || !meta.id || vistos.has(meta.id)) return
        vistos.add(meta.id)
        lista.push({
          id: String(meta.id),
          nome: String(meta.nome || 'Jogador').slice(0, 16),
          entrouEm: Number(meta.entrouEm) || 0,
        })
      })
    })

    return lista.sort(
      (a, b) => a.entrouEm - b.entrouEm || a.id.localeCompare(b.id),
    )
  }

  function nomeUnico(base, outros) {
    const limpo = String(base || 'Jogador').trim().slice(0, 16) || 'Jogador'
    const usados = new Set(outros.map((jogador) => normalizarTexto(jogador.nome)))
    if (!usados.has(normalizarTexto(limpo))) return limpo

    let numero = 2
    while (numero < 1000) {
      const sufixo = String(numero)
      const candidato = `${limpo.slice(0, 16 - sufixo.length)}${sufixo}`
      if (!usados.has(normalizarTexto(candidato))) return candidato
      numero += 1
    }

    return limpo.slice(0, 12) + gerarIdMensagem().slice(-4)
  }

  function enviarEstado(forcar = false) {
    if (!souHost()) return
    if (!gameRef.current) {
      gameRef.current = criarEstadoLobby(configRef.current)
    }
    const agora = Date.now()
    if (!forcar && agora - ultimoEstadoEnviadoRef.current < 220) return
    ultimoEstadoEnviadoRef.current = agora
    emitir('estado', {
      estado: gameRef.current,
      config: configRef.current,
      hostId: playerIdRef.current,
      enviadoEm: agora,
    })
  }

  function agendarReconexao() {
    if (saindoRef.current || recriandoRef.current || reconexaoRef.current) return
    reconexaoRef.current = setTimeout(async () => {
      reconexaoRef.current = null
      if (saindoRef.current) return
      recriandoRef.current = true
      const canalAntigo = canalRef.current
      canalRef.current = null
      if (canalAntigo && supabase) {
        try {
          await supabase.removeChannel(canalAntigo)
        } catch {
          // ignore
        }
      }
      recriandoRef.current = false
      entrouEmRef.current = Date.now()
      montarCanal()
    }, 2500)
  }

  function processarPresenca() {
    if (saindoRef.current) return
    const lista = listaPresenca()
    const eu = playerIdRef.current
    jogadoresRef.current = lista
    useStore.getState().definirJogadores(lista)

    if (lista.length > 8) {
      const indice = lista.findIndex((jogador) => jogador.id === eu)
      if (indice >= 8) {
        recusarEntrada('Sala cheia. O limite é de 8 jogadores.')
        return
      }
    }

    const outros = lista.filter((jogador) => jogador.id !== eu)
    const nomeFinal = nomeUnico(nomeBaseRef.current, outros)

    if (nomeFinal !== nomeAtualRef.current) {
      nomeAtualRef.current = nomeFinal
      useStore.getState().irParaTela(useStore.getState().screen, {
        nickname: nomeFinal,
      })
      const canal = canalRef.current
      if (canal) {
        canal
          .track({
            id: eu,
            nome: nomeFinal,
            entrouEm: entrouEmRef.current,
          })
          .catch(() => {})
      }
    }

    const host = lista[0] || null
    const hostId = host ? host.id : null
    const eraHost = eraHostRef.current
    const agoraHost = Boolean(hostId && hostId === eu)

    hostIdRef.current = hostId
    useStore.getState().definirHost(hostId)

    const aguardandoValidacaoSala =
      modoRef.current === 'entrar' &&
      !estadoRecebidoRef.current &&
      outros.length === 0 &&
      useStore.getState().screen === 'nickname'

    if (agoraHost && !eraHost && !aguardandoValidacaoSala) {
      eraHostRef.current = true
      assumirHost()
    } else if (!agoraHost) {
      eraHostRef.current = false
      if (eraHost) {
        limparTimersDeJogo()
      }
    }

    if (!jaIniciouSyncRef.current) {
      jaIniciouSyncRef.current = true

      if (modoRef.current === 'entrar') {
        checagemSalaRef.current = setTimeout(() => {
          checagemSalaRef.current = null
          if (saindoRef.current) return
          const atuais = jogadoresRef.current.filter((j) => j.id !== eu)
          if (atuais.length === 0 && !estadoRecebidoRef.current) {
            recusarEntrada('Sala não encontrada. Confira o código.')
            return
          }
          if (
            atuais.length > 0 &&
            !estadoRecebidoRef.current &&
            useStore.getState().screen === 'nickname'
          ) {
            useStore.getState().irParaTela('lobby', { connecting: false })
          }
        }, 1200)
      }
    }

    if (agoraHost && !aguardandoValidacaoSala) {
      verificarDesenhistaPresente()
      enviarEstado(true)
      if (
        useStore.getState().screen === 'nickname' &&
        useStore.getState().connected
      ) {
        useStore.getState().irParaTela('lobby', { connecting: false })
      }
    }
  }

  function verificarDesenhistaPresente() {
    if (!souHost()) return
    const game = gameRef.current
    if (!game || game.status !== 'playing') return

    const presentes = new Set(jogadoresRef.current.map((jogador) => jogador.id))
    if (presentes.has(game.desenhistaId)) {
      if (desenhistaAusenteRef.current) {
        clearTimeout(desenhistaAusenteRef.current)
        desenhistaAusenteRef.current = null
      }
      return
    }
    if (desenhistaAusenteRef.current) return

    const desenhistaAusente = game.desenhistaId
    desenhistaAusenteRef.current = setTimeout(() => {
      desenhistaAusenteRef.current = null
      if (!souHost()) return
      const atual = gameRef.current
      if (!atual || atual.status !== 'playing') return
      if (atual.desenhistaId !== desenhistaAusente) return
      const agoraPresentes = new Set(
        jogadoresRef.current.map((jogador) => jogador.id),
      )
      if (!agoraPresentes.has(desenhistaAusente)) {
        encerrarRodada('O desenhista saiu.')
      }
    }, 3000)
  }

  function verificarSegredoDisponivel() {
    if (!souHost() || segredoRef.current) return
    if (semPalavraRef.current) return
    const game = gameRef.current
    if (!game || game.status !== 'playing') return
    const rodada = game.rodada

    semPalavraRef.current = setTimeout(() => {
      semPalavraRef.current = null
      if (!souHost() || segredoRef.current) return
      const atual = gameRef.current
      if (!atual || atual.status !== 'playing' || atual.rodada !== rodada) {
        return
      }
      encerrarRodada('Não foi possível continuar a rodada.')
    }, 3000)
  }

  function assumirHost() {
    if (saindoRef.current) return
    if (!gameRef.current) {
      gameRef.current = criarEstadoLobby(configRef.current)
    }
    const game = gameRef.current
    useStore.getState().definirJogo(game)
    useStore.getState().definirHost(playerIdRef.current)

    if (game.status === 'playing') {
      if (segredoRodadaRef.current !== game.rodada) {
        segredoRef.current = ''
        segredoRodadaRef.current = 0
      }
      if (
        !segredoRef.current &&
        game.desenhistaId === playerIdRef.current &&
        useStore.getState().palavraSecreta
      ) {
        segredoRef.current = useStore.getState().palavraSecreta
        segredoRodadaRef.current = game.rodada
      }
      useStore.getState().irParaTela('game', { connecting: false })
      if (!segredoRef.current) {
        if (game.desenhistaId !== playerIdRef.current) {
          emitir('pedir-segredo', {
            de: playerIdRef.current,
            rodada: game.rodada,
          })
        }
        verificarSegredoDisponivel()
      }
      iniciarRelogio()
      verificarDesenhistaPresente()
    } else if (game.status === 'reveal') {
      useStore.getState().irParaTela('game', { connecting: false })
      agendarProximaRodada()
    } else if (game.status === 'results') {
      useStore.getState().irParaTela('results', { connecting: false })
    } else {
      useStore.getState().irParaTela('lobby', { connecting: false })
    }

    enviarEstado(true)
  }

  function receberEstado(payload) {
    if (saindoRef.current || !payload || !payload.estado) return
    if (
      hostIdRef.current &&
      payload.hostId &&
      payload.hostId !== hostIdRef.current
    ) {
      return
    }

    const game = payload.estado
    if (!game || !game.status) return

    estadoRecebidoRef.current = true
    if (checagemSalaRef.current) {
      clearTimeout(checagemSalaRef.current)
      checagemSalaRef.current = null
    }

    const participantes = Array.isArray(game.participantes)
      ? game.participantes
      : []
    const euSouParticipante = participantes.some(
      (jogador) => jogador.id === playerIdRef.current,
    )

    if (game.status !== 'lobby' && !euSouParticipante) {
      recusarEntrada(
        game.status === 'playing' || game.status === 'reveal'
          ? 'Partida em andamento.'
          : 'Partida em andamento. Aguarde a sala reabrir.',
      )
      return
    }

    const config = normalizarConfig(payload.config || configRef.current)
    configRef.current = config
    gameRef.current = game

    if (game.status === 'playing') {
      if (
        game.rodada !== ultimaRodadaRecebidaRef.current ||
        statusRecebidoRef.current === 'lobby'
      ) {
        useStore.getState().limparDesenho()
        ultimaRodadaRecebidaRef.current = game.rodada
        ultimaRodadaPedidaRef.current = 0
      }
    } else if (game.status === 'lobby' && statusRecebidoRef.current !== 'lobby') {
      useStore.getState().limparDesenho()
    }
    statusRecebidoRef.current = game.status

    useStore.getState().definirJogo(game)
    useStore.getState().definirConfig(config)

    if (game.status === 'playing' && game.desenhistaId === playerIdRef.current) {
      if (souHost()) {
        if (segredoRef.current) {
          useStore.getState().definirPalavraSecreta(segredoRef.current)
        }
      } else if (
        !useStore.getState().palavraSecreta &&
        ultimaRodadaPedidaRef.current !== game.rodada
      ) {
        ultimaRodadaPedidaRef.current = game.rodada
        setTimeout(() => {
          if (saindoRef.current) return
          const atual = gameRef.current
          if (
            atual &&
            atual.status === 'playing' &&
            atual.rodada === game.rodada &&
            atual.desenhistaId === playerIdRef.current &&
            !useStore.getState().palavraSecreta
          ) {
            emitir('pedir-palavra', {
              de: playerIdRef.current,
              rodada: game.rodada,
            })
            setTimeout(() => {
              const depois = gameRef.current
              if (
                depois &&
                depois.status === 'playing' &&
                depois.rodada === game.rodada &&
                depois.desenhistaId === playerIdRef.current &&
                !useStore.getState().palavraSecreta
              ) {
                ultimaRodadaPedidaRef.current = 0
              }
            }, 3000)
          }
        }, 250)
      }
    } else {
      useStore.getState().definirPalavraSecreta('')
    }

    const tela =
      game.status === 'results'
        ? 'results'
        : game.status === 'lobby'
          ? 'lobby'
          : 'game'
    useStore.getState().irParaTela(tela, { connecting: false })
  }

  function receberPalavra(payload) {
    if (!payload || payload.para !== playerIdRef.current || !payload.palavra) {
      return
    }
    if (saindoRef.current) return
    const game = gameRef.current
    if (!game || game.status !== 'playing') return
    if (payload.rodada && payload.rodada !== game.rodada) return

    segredoRef.current = payload.palavra
    segredoRodadaRef.current = game.rodada
    if (semPalavraRef.current) {
      clearTimeout(semPalavraRef.current)
      semPalavraRef.current = null
    }
    if (game.desenhistaId === playerIdRef.current) {
      useStore.getState().definirPalavraSecreta(payload.palavra)
    }
  }

  function iniciarRelogio() {
    if (tickRef.current) clearInterval(tickRef.current)
    tickRef.current = setInterval(() => {
      if (!souHost()) return
      const game = gameRef.current
      if (!game || game.status !== 'playing') return

      if (game.tempoRestante <= 0) {
        encerrarRodada('O tempo acabou!')
        return
      }

      const atualizado = {
        ...game,
        tempoRestante: Math.max(0, game.tempoRestante - 1),
      }
      gameRef.current = atualizado
      useStore.getState().definirJogo(atualizado)
      enviarEstado(true)

      if (atualizado.tempoRestante === 0) {
        encerrarRodada('O tempo acabou!')
      }
    }, 1000)
  }

  function pararRelogio() {
    if (tickRef.current) clearInterval(tickRef.current)
    tickRef.current = null
  }

  function iniciarRodada(indice, contexto) {
    if (!souHost()) return
    const { participantes, totalRodadas, placar } = contexto
    if (!participantes.length) return

    const presentes = new Set(jogadoresRef.current.map((jogador) => jogador.id))
    let indiceAtual = indice

    while (
      indiceAtual < totalRodadas &&
      !presentes.has(participantes[indiceAtual % participantes.length].id)
    ) {
      indiceAtual += 1
    }

    if (indiceAtual >= totalRodadas) {
      finalizarJogo()
      return
    }

    const desenhista = participantes[indiceAtual % participantes.length]
    const palavra = sortearPalavra(usadasRef.current)
    usadasRef.current = [...usadasRef.current, palavra].slice(-80)
    segredoRef.current = palavra

    const game = criarEstadoRodada({
      participantes,
      indiceRodada: indiceAtual,
      totalRodadas,
      desenhista,
      palavra,
      tempoTotal: configRef.current.tempo,
      placar,
    })

    segredoRodadaRef.current = game.rodada
    gameRef.current = game
    useStore.getState().definirJogo(game)
    useStore
      .getState()
      .definirPalavraSecreta(
        desenhista.id === playerIdRef.current ? palavra : '',
      )
    useStore.getState().limparDesenho()
    ultimaRodadaRecebidaRef.current = game.rodada
    statusRecebidoRef.current = 'playing'
    ultimaRodadaPedidaRef.current = 0
    palpitePorJogadorRef.current.clear()
    historicoPorJogadorRef.current.clear()

    if (revelarRef.current) clearTimeout(revelarRef.current)
    if (fimPorAcertosRef.current) clearTimeout(fimPorAcertosRef.current)
    revelarRef.current = null
    fimPorAcertosRef.current = null

    useStore.getState().irParaTela('game', { connecting: false })
    enviarEstado(true)

    if (desenhista.id !== playerIdRef.current) {
      emitir('palavra', {
        para: desenhista.id,
        palavra,
        de: playerIdRef.current,
        rodada: game.rodada,
      })
    }

    publicarChat({
      tipo: 'sistema',
      texto: `Rodada ${game.rodada} de ${game.totalRodadas}: ${desenhista.nome} está desenhando.`,
    })

    iniciarRelogio()
  }

  function iniciarPartida() {
    if (!souHost()) return { ok: false, erro: 'Somente o host pode iniciar.' }
    const jogadores = jogadoresRef.current.slice(0, 8)
    if (jogadores.length < 2) {
      return { ok: false, erro: 'É preciso pelo menos 2 jogadores.' }
    }

    limparTimersDeJogo()
    const config = normalizarConfig(useStore.getState().config)
    configRef.current = config
    segredoRef.current = ''
    usadasRef.current = []

    const participantes = jogadores.map(({ id, nome }) => ({ id, nome }))
    const totalRodadas = participantes.length * config.voltas
    const placar = Object.fromEntries(
      participantes.map((jogador) => [jogador.id, 0]),
    )

    useStore.getState().limparChat()
    useStore.getState().limparDesenho()
    useStore.getState().definirConfig(config)
    useStore.getState().irParaTela('game', { connecting: false })
    emitir('limpar-chat', { de: playerIdRef.current })

    iniciarRodada(0, { participantes, totalRodadas, placar })
    return { ok: true }
  }

  function agendarProximaRodada(tempo = 5000) {
    if (revelarRef.current) clearTimeout(revelarRef.current)
    revelarRef.current = setTimeout(() => {
      revelarRef.current = null
      if (!souHost()) return
      const game = gameRef.current
      if (!game || game.status !== 'reveal') return

      if (game.rodada < game.totalRodadas) {
        iniciarRodada(game.rodada, {
          participantes: game.participantes,
          totalRodadas: game.totalRodadas,
          placar: game.placar,
        })
      } else {
        finalizarJogo()
      }
    }, tempo)
  }

  function encerrarRodada(motivo = 'Rodada encerrada.') {
    if (!souHost()) return
    const game = gameRef.current
    if (!game || game.status !== 'playing') return

    pararRelogio()
    if (fimPorAcertosRef.current) {
      clearTimeout(fimPorAcertosRef.current)
      fimPorAcertosRef.current = null
    }
    if (desenhistaAusenteRef.current) {
      clearTimeout(desenhistaAusenteRef.current)
      desenhistaAusenteRef.current = null
    }
    if (semPalavraRef.current) {
      clearTimeout(semPalavraRef.current)
      semPalavraRef.current = null
    }

    const palavra = segredoRef.current || game.palavraRevelada || ''
    const atualizado = {
      ...game,
      status: 'reveal',
      tempoRestante: 0,
      palavraRevelada: palavra,
      motivoFim: motivo,
    }
    gameRef.current = atualizado
    useStore.getState().definirJogo(atualizado)
    useStore.getState().definirPalavraSecreta('')
    statusRecebidoRef.current = 'reveal'
    enviarEstado(true)

    publicarChat({
      tipo: 'sistema',
      texto: `${motivo} A palavra era "${palavra}".`,
    })

    agendarProximaRodada()
  }

  function finalizarJogo() {
    if (!souHost()) return
    limparTimersDeJogo()
    const game = gameRef.current
    if (!game) return
    const atualizado = {
      ...game,
      status: 'results',
      desenhistaId: null,
      desenhistaNome: '',
      dica: '',
      tempoRestante: 0,
      palavraRevelada: segredoRef.current || game.palavraRevelada || '',
    }
    gameRef.current = atualizado
    useStore.getState().definirJogo(atualizado)
    useStore.getState().definirPalavraSecreta('')
    statusRecebidoRef.current = 'results'
    useStore.getState().irParaTela('results', { connecting: false })
    enviarEstado(true)
    publicarChat({ tipo: 'sistema', texto: 'Fim da partida! Confira o ranking.' })
  }

  function jogarNovamente() {
    if (!souHost()) return
    limparTimersDeJogo()
    segredoRef.current = ''
    segredoRodadaRef.current = 0
    usadasRef.current = []
    const lobby = criarEstadoLobby(configRef.current)
    gameRef.current = lobby
    statusRecebidoRef.current = 'lobby'
    useStore.getState().definirJogo(lobby)
    useStore.getState().definirPalavraSecreta('')
    useStore.getState().limparDesenho()
    useStore.getState().limparChat()
    emitir('limpar-chat', { de: playerIdRef.current })
    useStore.getState().irParaTela('lobby', { connecting: false })
    enviarEstado(true)
  }

  function processarPalpite(payload) {
    if (!souHost()) return
    const game = gameRef.current
    if (!game || game.status !== 'playing' || !segredoRef.current) return
    if (payload.rodada && payload.rodada !== game.rodada) return
    if (!payload.de || payload.de === game.desenhistaId) return
    if (game.acertos.includes(payload.de)) return

    const participante = game.participantes.find(
      (jogador) => jogador.id === payload.de,
    )
    if (!participante) return

    const agora = Date.now()
    const ultimo = palpitePorJogadorRef.current.get(payload.de) || 0
    if (agora - ultimo < 500) return
    palpitePorJogadorRef.current.set(payload.de, agora)

    const texto = String(payload.texto || '').trim().slice(0, 120)
    if (!texto) return

    if (mesmosTextos(texto, segredoRef.current)) {
      const pontos = pontosPorAcerto(game.tempoRestante, game.tempoTotal)
      const novoPlacar = {
        ...game.placar,
        [payload.de]: (game.placar[payload.de] || 0) + pontos,
        [game.desenhistaId]:
          (game.placar[game.desenhistaId] || 0) + 50,
      }
      const atualizado = {
        ...game,
        placar: novoPlacar,
        acertos: [...game.acertos, payload.de],
      }
      gameRef.current = atualizado
      useStore.getState().definirJogo(atualizado)
      enviarEstado(true)
      publicarChat({
        tipo: 'acerto',
        autorId: payload.de,
        texto: `${participante.nome} acertou!`,
      })

      const totalAdivinhadores = game.participantes.length - 1
      if (atualizado.acertos.length >= totalAdivinhadores) {
        fimPorAcertosRef.current = setTimeout(() => {
          fimPorAcertosRef.current = null
          encerrarRodada('Todos acertaram!')
        }, 700)
      }
      return
    }

    publicarChat({
      tipo: 'palpite',
      autorId: payload.de,
      autor: participante.nome,
      texto,
    })
  }

  function enviarPalpite(texto) {
    const game = gameRef.current
    if (!game || game.status !== 'playing') return false
    if (game.desenhistaId === playerIdRef.current) return false
    if (game.acertos.includes(playerIdRef.current)) return false

    const agora = Date.now()
    if (agora - ultimoPalpiteRef.current < 500) return false
    ultimoPalpiteRef.current = agora

    const limpo = String(texto || '').trim().slice(0, 120)
    if (!limpo) return false

    if (souHost()) {
      processarPalpite({
        de: playerIdRef.current,
        texto: limpo,
        rodada: game.rodada,
      })
    } else {
      emitir('palpite', {
        de: playerIdRef.current,
        texto: limpo,
        rodada: game.rodada,
      })
    }
    return true
  }

  function enviarLote(lote) {
    const game = gameRef.current
    if (!game || game.status !== 'playing') return false
    if (game.desenhistaId !== playerIdRef.current) return false
    if (!lote || !Array.isArray(lote.pontos) || lote.pontos.length === 0) {
      return false
    }

    const agora = Date.now()
    if (agora - ultimoTracoEnviadoRef.current < 20) return false
    ultimoTracoEnviadoRef.current = agora

    const payload = {
      ...lote,
      autor: playerIdRef.current,
      rodada: game.rodada,
    }
    useStore.getState().aplicarLote(payload)
    emitir('traco', payload)
    return true
  }

  function limparCanvas() {
    const game = gameRef.current
    if (!game || game.status !== 'playing') return
    if (game.desenhistaId !== playerIdRef.current) return
    useStore.getState().limparDesenho()
    emitir('limpar', {
      autor: playerIdRef.current,
      rodada: game.rodada,
    })
  }

  function pedirHistorico() {
    const game = gameRef.current
    if (!game || (game.status !== 'playing' && game.status !== 'reveal')) {
      return
    }
    const agora = Date.now()
    if (agora - ultimaBuscaHistoricoRef.current < 4000) return
    ultimaBuscaHistoricoRef.current = agora
    emitir('pedir-historico', {
      de: playerIdRef.current,
      rodada: game.rodada,
    })
  }

  function expulsarJogador(id) {
    if (!souHost() || !id || id === playerIdRef.current) return
    const game = gameRef.current
    if (game && game.status !== 'lobby') return
    const jogador = jogadoresRef.current.find((item) => item.id === id)
    emitir('expulsar', { para: id, de: playerIdRef.current })
    publicarChat({
      tipo: 'sistema',
      texto: `${jogador?.nome || 'Um jogador'} foi removido pelo host.`,
    })
  }

  function alterarConfig(parcial) {
    if (!souHost()) return
    const game = gameRef.current
    if (game && game.status !== 'lobby') return
    const config = normalizarConfig({ ...configRef.current, ...parcial })
    configRef.current = config
    useStore.getState().definirConfig(config)
    emitir('config', { config, de: playerIdRef.current })
  }

  function receberHistorico(payload) {
    if (!payload || payload.para !== playerIdRef.current) return
    if (!Array.isArray(payload.tracos)) return
    const game = gameRef.current
    if (!game || payload.rodada !== game.rodada) return
    useStore.getState().definirTracos(payload.tracos)
  }

  function recusarEntrada(mensagem) {
    if (saindoRef.current) return
    saindoRef.current = true
    limparTimersDeJogo()
    limparTimersDeConexao()
    const canal = canalRef.current
    canalRef.current = null
    if (canal && supabase) {
      supabase.removeChannel(canal).catch(() => {})
    }
    useStore.getState().definirErro(mensagem)
  }

  function configurarHandlers(canal) {
    canal
      .on('presence', { event: 'sync' }, processarPresenca)
      .on('broadcast', { event: 'estado' }, ({ payload }) =>
        receberEstado(payload),
      )
      .on('broadcast', { event: 'config' }, ({ payload }) => {
        if (!payload || !payload.config) return
        if (
          hostIdRef.current &&
          payload.de &&
          payload.de !== hostIdRef.current
        ) {
          return
        }
        const config = normalizarConfig(payload.config)
        configRef.current = config
        useStore.getState().definirConfig(config)
      })
      .on('broadcast', { event: 'palavra' }, ({ payload }) =>
        receberPalavra(payload),
      )
      .on('broadcast', { event: 'palpite' }, ({ payload }) => {
        if (!souHost()) return
        processarPalpite(payload)
      })
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        if (!payload) return
        if (
          hostIdRef.current &&
          payload.de &&
          payload.de !== hostIdRef.current
        ) {
          return
        }
        adicionarChatLocal(payload)
      })
      .on('broadcast', { event: 'limpar-chat' }, ({ payload }) => {
        if (
          hostIdRef.current &&
          payload?.de &&
          payload.de !== hostIdRef.current
        ) {
          return
        }
        useStore.getState().limparChat()
      })
      .on('broadcast', { event: 'traco' }, ({ payload }) => {
        if (!payload) return
        const game = gameRef.current
        if (!game || game.status !== 'playing') return
        if (payload.autor !== game.desenhistaId) return
        if (payload.rodada !== game.rodada) return
        useStore.getState().aplicarLote(payload)
      })
      .on('broadcast', { event: 'limpar' }, ({ payload }) => {
        if (!payload) return
        const game = gameRef.current
        if (!game || game.status !== 'playing') return
        if (payload.autor !== game.desenhistaId) return
        if (payload.rodada !== game.rodada) return
        useStore.getState().limparDesenho()
      })
      .on('broadcast', { event: 'pedir-historico' }, ({ payload }) => {
        if (!souHost() || !payload || !payload.de) return
        const game = gameRef.current
        if (!game || payload.rodada !== game.rodada) return
        const agora = Date.now()
        const ultimo = historicoPorJogadorRef.current.get(payload.de) || 0
        if (agora - ultimo < 3000) return
        historicoPorJogadorRef.current.set(payload.de, agora)
        emitir('historico', {
          para: payload.de,
          rodada: game.rodada,
          tracos: useStore.getState().tracos,
        })
      })
      .on('broadcast', { event: 'historico' }, ({ payload }) =>
        receberHistorico(payload),
      )
      .on('broadcast', { event: 'pedir-palavra' }, ({ payload }) => {
        if (!souHost() || !payload || !payload.de) return
        const game = gameRef.current
        if (!game || game.status !== 'playing') return
        if (payload.de !== game.desenhistaId) return
        if (!segredoRef.current) return
        emitir('palavra', {
          para: payload.de,
          palavra: segredoRef.current,
          de: playerIdRef.current,
          rodada: game.rodada,
        })
      })
      .on('broadcast', { event: 'pedir-segredo' }, ({ payload }) => {
        if (!payload || !payload.de) return
        const game = gameRef.current
        if (!game || game.status !== 'playing') return
        if (game.desenhistaId !== playerIdRef.current) return
        if (!useStore.getState().palavraSecreta) return
        emitir('palavra', {
          para: payload.de,
          palavra: useStore.getState().palavraSecreta,
          de: playerIdRef.current,
          rodada: game.rodada,
        })
      })
      .on('broadcast', { event: 'pedir-estado' }, ({ payload }) => {
        if (!souHost()) return
        const agora = Date.now()
        if (agora - ultimoPedidoEstadoRef.current < 400) return
        ultimoPedidoEstadoRef.current = agora
        enviarEstado(true)
        if (payload?.de) {
          emitir('historico', {
            para: payload.de,
            rodada: gameRef.current?.rodada || 0,
            tracos: useStore.getState().tracos,
          })
        }
      })
      .on('broadcast', { event: 'expulsar' }, ({ payload }) => {
        if (!payload || payload.para !== playerIdRef.current) return
        if (
          hostIdRef.current &&
          payload.de &&
          payload.de !== hostIdRef.current
        ) {
          return
        }
        recusarEntrada('Você foi removido pelo host.')
      })
  }

  function montarCanal() {
    if (!supabase || saindoRef.current || !codigoRef.current) return
    const canal = supabase.channel(`room:${codigoRef.current}`, {
      config: {
        presence: { key: playerIdRef.current },
        broadcast: { self: false },
      },
    })
    canalRef.current = canal
    configurarHandlers(canal)

    canal.subscribe((status) => {
      if (saindoRef.current || recriandoRef.current) return

      if (status === 'SUBSCRIBED') {
        useStore.getState().definirConexao(true, '')
        useStore.getState().irParaTela(useStore.getState().screen, {
          connected: true,
        })
        canal
          .track({
            id: playerIdRef.current,
            nome: nomeAtualRef.current || nomeBaseRef.current,
            entrouEm: entrouEmRef.current,
          })
          .catch(() => {})
        setTimeout(() => {
          if (!saindoRef.current) {
            emitir('pedir-estado', { de: playerIdRef.current })
          }
        }, 500)
        return
      }

      if (
        status === 'CHANNEL_ERROR' ||
        status === 'TIMED_OUT' ||
        status === 'CLOSED'
      ) {
        useStore
          .getState()
          .definirConexao(
            false,
            'Conexão com a sala perdida. Tentando reconectar...',
          )
        useStore.getState().irParaTela(useStore.getState().screen, {
          connecting: false,
        })
        if (eraHostRef.current) {
          eraHostRef.current = false
          limparTimersDeJogo()
        }
        agendarReconexao()
      }
    })
  }

  async function entrar({ codigo, nome, modo }) {
    if (!supabaseConfigurado || !supabase) {
      useStore
        .getState()
        .definirErro(
          'Supabase não configurado. Crie um .env com VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.',
        )
      return
    }
    if (!codigo || !nome) return

    saindoRef.current = false
    recriandoRef.current = false
    jaIniciouSyncRef.current = false
    estadoRecebidoRef.current = false
    eraHostRef.current = false
    hostIdRef.current = null
    jogadoresRef.current = []
    ultimaRodadaPedidaRef.current = 0
    ultimaRodadaRecebidaRef.current = 0
    statusRecebidoRef.current = ''
    segredoRef.current = ''
    segredoRodadaRef.current = 0
    usadasRef.current = []
    palpitePorJogadorRef.current.clear()
    historicoPorJogadorRef.current.clear()
    configRef.current = CONFIG_PADRAO
    gameRef.current = criarEstadoLobby(CONFIG_PADRAO)

    limparTimersDeJogo()
    limparTimersDeConexao()

    const canalAntigo = canalRef.current
    canalRef.current = null
    if (canalAntigo && supabase) {
      try {
        await supabase.removeChannel(canalAntigo)
      } catch {
        // ignore
      }
    }

    playerIdRef.current = obterIdJogador()
    codigoRef.current = codigo
    modoRef.current = modo
    nomeBaseRef.current = nome.trim().slice(0, 16)
    nomeAtualRef.current = nomeBaseRef.current
    entrouEmRef.current = Date.now()

    useStore.getState().limparDesenho()
    useStore.getState().limparChat()
    useStore.setState({
      roomCode: codigo,
      pendingCode: codigo,
      modo,
      nickname: nomeBaseRef.current,
      selfId: playerIdRef.current,
      connecting: true,
      connected: false,
      connectionIssue: '',
      players: [],
      hostId: null,
      config: CONFIG_PADRAO,
      game: gameRef.current,
      palavraSecreta: '',
      erro: '',
    })
    atualizarUrlSala(codigo)
    montarCanal()
  }

  async function sairDaSala() {
    saindoRef.current = true
    limparTimersDeJogo()
    limparTimersDeConexao()
    const canal = canalRef.current
    canalRef.current = null
    if (canal && supabase) {
      try {
        await supabase.removeChannel(canal)
      } catch {
        // ignore
      }
    }
    playerIdRef.current = ''
    codigoRef.current = ''
    hostIdRef.current = null
    eraHostRef.current = false
    jogadoresRef.current = []
    segredoRef.current = ''
    segredoRodadaRef.current = 0
    gameRef.current = null
    atualizarUrlSala('')
    useStore.getState().resetarSala()
  }

  useEffect(() => {
    const aoFechar = () => {
      const canal = canalRef.current
      if (canal && supabase) supabase.removeChannel(canal)
    }
    window.addEventListener('beforeunload', aoFechar)
    return () => {
      window.removeEventListener('beforeunload', aoFechar)
      saindoRef.current = true
      limparTimersDeJogo()
      limparTimersDeConexao()
      const canal = canalRef.current
      canalRef.current = null
      if (canal && supabase) supabase.removeChannel(canal)
    }
  }, [])

  return {
    entrar,
    sairDaSala,
    iniciarPartida,
    jogarNovamente,
    enviarPalpite,
    enviarLote,
    limparCanvas,
    pedirHistorico,
    expulsarJogador,
    alterarConfig,
  }
}
