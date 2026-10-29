import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import {
  ativarAudio,
  definirSonsAtivos,
  definirMusicaAmbiente,
  sonsEstaoAtivos,
  tocarSom,
} from '../lib/sounds'

export default function SoundEffects() {
  const [ativo, setAtivo] = useState(sonsEstaoAtivos)

  useEffect(() => {
    const liberarAudio = () => ativarAudio()
    window.addEventListener('pointerdown', liberarAudio, { passive: true })
    window.addEventListener('keydown', liberarAudio)

    const somDeControle = (evento) => {
      const botao = evento.target.closest('button, a, [role="tab"]')
      if (botao && !botao.disabled && !botao.classList.contains('sound-toggle')) {
        tocarSom('ui')
      }
    }
    const somDeSelecao = (evento) => {
      if (evento.target.matches('select, input[type="checkbox"], input[type="radio"]')) {
        tocarSom('ui')
      }
    }
    const somDeFoco = (evento) => {
      if (evento.target.matches('input, textarea, select')) tocarSom('focus')
    }
    const somDeEnvio = (evento) => {
      if (!evento.submitter) tocarSom('confirmar')
    }
    const somDeDesenho = (evento) => {
      if (evento.target instanceof HTMLCanvasElement) tocarSom('desenhar')
    }

    document.addEventListener('click', somDeControle, true)
    document.addEventListener('change', somDeSelecao, true)
    document.addEventListener('focusin', somDeFoco, true)
    document.addEventListener('submit', somDeEnvio, true)
    document.addEventListener('pointerdown', somDeDesenho, true)

    let estadoAnterior = useStore.getState()
    function atualizarMusica(estado) {
      definirMusicaAmbiente(
        estado.screen === 'lobby'
          ? 'waiting'
          : estado.screen === 'game'
            ? 'game'
            : null,
      )
    }

    atualizarMusica(estadoAnterior)
    const cancelarInscricao = useStore.subscribe((estadoAtual) => {
      const anterior = estadoAnterior
      estadoAnterior = estadoAtual
      atualizarMusica(estadoAtual)
      const jogoAnterior = anterior.game
      const jogoAtual = estadoAtual.game
      if (estadoAtual.erro && estadoAtual.erro !== anterior.erro) {
        tocarSom('erro')
      }
      if (!anterior.connected && estadoAtual.connected) {
        tocarSom('conectar')
      }
      if (
        anterior.connected &&
        estadoAtual.connected &&
        anterior.players.length > 0 &&
        estadoAtual.players.length > anterior.players.length
      ) {
        tocarSom('jogador-entrou')
      } else if (
        anterior.connected &&
        estadoAtual.connected &&
        anterior.players.length > estadoAtual.players.length &&
        estadoAtual.players.length > 0
      ) {
        tocarSom('jogador-saiu')
      }
      if (anterior.roomCode && !estadoAtual.roomCode) tocarSom('sair')
      if (!jogoAtual) return

      if (
        jogoAtual.status === 'playing' &&
        (jogoAnterior?.status !== 'playing' ||
          jogoAnterior?.rodada !== jogoAtual.rodada)
      ) {
        tocarSom('rodada')
      } else if (
        jogoAtual.status === 'playing' &&
        jogoAnterior?.status === 'playing' &&
        jogoAnterior.rodada === jogoAtual.rodada &&
        jogoAtual.acertos.length > jogoAnterior.acertos.length
      ) {
        tocarSom('acerto')
      } else if (
        jogoAtual.status === 'playing' &&
        jogoAnterior?.status === 'playing' &&
        jogoAnterior.rodada === jogoAtual.rodada &&
        [5, 4, 3, 2, 1].includes(jogoAtual.tempoRestante) &&
        jogoAtual.tempoRestante !== jogoAnterior.tempoRestante
      ) {
        tocarSom('contagem')
      } else if (
        jogoAtual.status === 'reveal' &&
        jogoAnterior?.status === 'playing'
      ) {
        tocarSom(jogoAtual.motivoFim === 'Todos acertaram!' ? 'fim-bom' : 'fim')
      } else if (
        jogoAtual.status === 'results' &&
        jogoAnterior?.status !== 'results'
      ) {
        tocarSom('vitoria')
      }
    })

    return () => {
      window.removeEventListener('pointerdown', liberarAudio)
      window.removeEventListener('keydown', liberarAudio)
      document.removeEventListener('click', somDeControle, true)
      document.removeEventListener('change', somDeSelecao, true)
      document.removeEventListener('focusin', somDeFoco, true)
      document.removeEventListener('submit', somDeEnvio, true)
      document.removeEventListener('pointerdown', somDeDesenho, true)
      cancelarInscricao()
    }
  }, [])

  function alternarSom() {
    const novoEstado = !ativo
    definirSonsAtivos(novoEstado)
    setAtivo(novoEstado)
    if (novoEstado) {
      ativarAudio()
      tocarSom('acerto')
    }
  }

  return (
    <button
      type="button"
      className={`sound-toggle ${ativo ? 'is-on' : ''}`}
      onClick={alternarSom}
      aria-label={ativo ? 'Desativar sons' : 'Ativar sons'}
      aria-pressed={ativo}
      title={ativo ? 'Desativar sons' : 'Ativar sons'}
    >
      <svg
        aria-hidden="true"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        {ativo ? (
          <>
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </>
        ) : (
          <path d="m16 9 5 6m0-6-5 6" />
        )}
      </svg>
    </button>
  )
}