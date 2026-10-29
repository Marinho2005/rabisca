import { useState } from 'react'
import { useStore } from '../store/useStore'
import { useRoomContext } from '../hooks/useRoom'
import { linkDaSala } from '../lib/roomCode'
import PlayerList from '../components/PlayerList'
import { Brand } from '../components/Brand'
import { SquiggleDeco, StarDeco } from '../components/Decor'

const CORES_TILE = ['coral', 'blue', 'green']

export default function Lobby() {
  const { iniciarPartida, sairDaSala, expulsarJogador, alterarConfig } =
    useRoomContext()
  const roomCode = useStore((state) => state.roomCode)
  const players = useStore((state) => state.players)
  const hostId = useStore((state) => state.hostId)
  const selfId = useStore((state) => state.selfId)
  const config = useStore((state) => state.config)
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState('')

  const isHost = Boolean(selfId && hostId === selfId)

  async function copiarLink() {
    const link = linkDaSala(roomCode)
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      const campo = document.createElement('textarea')
      campo.value = link
      campo.style.position = 'fixed'
      campo.style.opacity = '0'
      document.body.appendChild(campo)
      campo.focus()
      campo.select()
      document.execCommand('copy')
      document.body.removeChild(campo)
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1800)
  }

  function iniciar() {
    const resultado = iniciarPartida()
    if (resultado && !resultado.ok) setErro(resultado.erro)
    else setErro('')
  }

  return (
    <main className="screen lobby">
      <StarDeco className="lobby-star" />
      <SquiggleDeco className="lobby-squiggle" />

      <header className="lobby-head">
        <Brand compact />
        <button type="button" className="text-button" onClick={sairDaSala}>
          Sair da sala
        </button>
      </header>

      <section className="lobby-code">
        <p className="lobby-call">Chame a galera com este código</p>

        <div
          className="pin"
          aria-label={`Código da sala ${roomCode}`}
        >
          {[...roomCode].map((caractere, indice) => (
            <div
              className={`tile tile-${CORES_TILE[indice % CORES_TILE.length]}`}
              key={`${caractere}-${indice}`}
              style={{ '--i': indice }}
            >
              {caractere}
            </div>
          ))}
        </div>

        <button type="button" className="copy-button" onClick={copiarLink}>
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22212B"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="12" height="12" rx="3" />
            <path d="M5 15 V6 a2 2 0 0 1 2-2 h9" />
          </svg>
          {copiado ? 'Link copiado!' : 'Copiar link'}
        </button>
      </section>

      <section className="card players-card">
        <PlayerList
          variant="lobby"
          players={players}
          hostId={hostId}
          selfId={selfId}
          canRemove={isHost}
          onRemove={expulsarJogador}
        />

        <div className="lobby-actions">
          {isHost ? (
            <>
              <div className="settings-grid">
                <label>
                  <span>Voltas</span>
                  <select
                    value={config.voltas}
                    onChange={(evento) =>
                      alterarConfig({ voltas: Number(evento.target.value) })
                    }
                  >
                    <option value={1}>1 volta</option>
                    <option value={2}>2 voltas</option>
                    <option value={3}>3 voltas</option>
                  </select>
                </label>

                <label>
                  <span>Tempo por rodada</span>
                  <select
                    value={config.tempo}
                    onChange={(evento) =>
                      alterarConfig({ tempo: Number(evento.target.value) })
                    }
                  >
                    <option value={60}>60 segundos</option>
                    <option value={75}>75 segundos</option>
                    <option value={90}>90 segundos</option>
                  </select>
                </label>
              </div>

              <p className="muted small">
                Com {players.length} jogador{players.length === 1 ? '' : 'es'} e{' '}
                {config.voltas} volta{config.voltas === 1 ? '' : 's'}, serão{' '}
                <strong>{players.length * config.voltas} rodadas</strong>.
              </p>

              {erro && <p className="form-error">{erro}</p>}

              <button
                type="button"
                className="button primary wide start-button"
                onClick={iniciar}
                disabled={players.length < 2}
              >
                Iniciar partida
              </button>

              {players.length < 2 && (
                <p className="hint">
                  Chame pelo menos mais um jogador para começar.
                </p>
              )}
            </>
          ) : (
            <div className="waiting-box">
              <span className="pulse-dot" aria-hidden="true" />
              <p>
                Aguardando o anfitrião iniciar a partida.
              </p>
              <p className="muted small">
                Voltas: {config.voltas} · Tempo: {config.tempo}s
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
