import { create } from 'zustand'

export const CONFIG_PADRAO = { voltas: 1, tempo: 75 }

const estadoInicial = {
  screen: 'home',
  roomCode: '',
  pendingCode: '',
  modo: 'entrar',
  nickname: '',
  selfId: '',
  connecting: false,
  connected: false,
  connectionIssue: '',
  players: [],
  hostId: null,
  config: CONFIG_PADRAO,
  game: null,
  palavraSecreta: '',
  chat: [],
  tracos: [],
  loteSeq: 0,
  ultimoLote: null,
  historicoSeq: 0,
  limpezaSeq: 0,
  erro: '',
}

export const useStore = create((set) => ({
  ...estadoInicial,

  irParaTela: (screen, dados = {}) => set({ screen, ...dados }),
  definirErro: (erro) =>
    set({
      screen: 'erro',
      erro,
      connected: false,
      connecting: false,
      connectionIssue: '',
    }),
  limparErro: () => set({ erro: '' }),
  definirJogadores: (players) => set({ players }),
  definirHost: (hostId) => set({ hostId }),
  definirConexao: (conectado, connectionIssue = '') =>
    set({ connected: conectado, connectionIssue }),
  definirConfig: (config) => set({ config }),
  definirJogo: (game) => set({ game }),
  definirPalavraSecreta: (palavraSecreta) => set({ palavraSecreta }),
  adicionarChat: (mensagem) =>
    set((state) => ({
      chat: [...state.chat, mensagem].slice(-120),
    })),
  limparChat: () => set({ chat: [] }),

  aplicarLote: (lote) =>
    set((state) => {
      const tracos = state.tracos.slice()
      const indice = tracos.findIndex((traco) => traco.id === lote.id)

      if (indice === -1) {
        tracos.push({
          id: lote.id,
          autor: lote.autor,
          cor: lote.cor,
          espessura: lote.espessura,
          borracha: Boolean(lote.borracha),
          pontos: [...lote.pontos],
        })
      } else {
        const atual = tracos[indice]
        tracos[indice] = {
          ...atual,
          pontos: [...atual.pontos, ...lote.pontos],
        }
      }

      const seq = state.loteSeq + 1
      return {
        tracos,
        loteSeq: seq,
        ultimoLote: { ...lote, seq },
      }
    }),

  definirTracos: (tracos) =>
    set((state) => ({
      tracos: tracos.map((traco) => ({ ...traco, pontos: [...traco.pontos] })),
      historicoSeq: state.historicoSeq + 1,
      ultimoLote: null,
    })),

  limparDesenho: () =>
    set((state) => ({
      tracos: [],
      ultimoLote: null,
      limpezaSeq: state.limpezaSeq + 1,
    })),

  resetarSala: () =>
    set({
      ...estadoInicial,
      screen: 'home',
      nickname: useStore.getState().nickname,
    }),
}))
