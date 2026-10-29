import { useState } from 'react'
import { useStore } from '../store/useStore'
import { useRoomContext } from '../hooks/useRoom'
import { linkDaSala } from '../lib/roomCode'
import PlayerList from '../components/PlayerList'

export default function Lobby() {
  const {
    iniciarPartida,
    sairDaSala,
    expulsarJogador,
    alterarConfig,
  } = useRoomContext()
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
    <main className="screen lobby-screen">
      <header className="topbar">
        <div className="brand small-brand">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>Rabisca</span>
        </div>
        <button type="button" className="text-button" onClick={sairDaSala}>
          Sair da sala
        </button>
      </header>

      <section className="lobby-code-card card">
        <p className="eyebrow">Código da sala</p>
        <div className="pin-code" aria-label={`Código da sala ${roomCode}`}>
          {roomCode}
        </div>
        <div className="lobby-code-actions">
          <button type="button" className="button secondary" onClick={copiarLink}>
            {copiado ? 'Link copiado!' : 'Copiar link'}
          </button>
        </div>
        <p className="muted small">
          Compartilhe o código ou o link. Quem chegar entra na sala.
        </p>
      </section>

      <div className="lobby-grid">
        <section className="card lobby-players-card">
          <PlayerList
            players={players}
            hostId={hostId}
            selfId={selfId}
            canRemove={isHost}
            onRemove={expulsarJogador}
          />
        </section>

        <section className="card lobby-settings">
          <div className="section-title">
            <h2>Preparar partida</h2>
          </div>

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
                className="button primary wide"
                onClick={iniciar}
                disabled={players.length < 2}
              >
                Iniciar partida
              </button>

              {players.length < 2 && (
                <p className="muted small">
                  Chame pelo menos mais um jogador para começar.
                </p>
              )}
            </>
          ) : (
            <div className="waiting-box">
              <span className="pulse-dot" aria-hidden="true" />
              <p>
                Aguardando o host iniciar a partida. Só o host configura as
                rodadas e o tempo.
              </p>
              <p className="muted small">
                Voltas: {config.voltas} · Tempo: {config.tempo}s
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
