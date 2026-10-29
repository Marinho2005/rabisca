import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { useRoomContext } from '../hooks/useRoom'
import Canvas from '../components/Canvas'
import Chat from '../components/Chat'
import PlayerList from '../components/PlayerList'
import Timer from '../components/Timer'

const CORES = [
  '#1f2937',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#0ea5e9',
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#ffffff',
]

export default function Game() {
  const {
    sairDaSala,
    enviarPalpite,
    enviarLote,
    limparCanvas,
    pedirHistorico,
  } = useRoomContext()
  const game = useStore((state) => state.game)
  const players = useStore((state) => state.players)
  const hostId = useStore((state) => state.hostId)
  const selfId = useStore((state) => state.selfId)
  const palavraSecreta = useStore((state) => state.palavraSecreta)
  const chat = useStore((state) => state.chat)
  const [cor, setCor] = useState(CORES[0])
  const [espessura, setEspessura] = useState(4)
  const [borracha, setBorracha] = useState(false)
  const rodadaHistoricoRef = useRef(0)
  const pedirHistoricoRef = useRef(pedirHistorico)

  const isHost = Boolean(selfId && hostId === selfId)
  const isDrawer = Boolean(game && game.desenhistaId === selfId)
  const playing = game?.status === 'playing'
  const reveal = game?.status === 'reveal'
  const acertou = Boolean(game?.acertos?.includes(selfId))
  const podePalpitar = Boolean(playing && !isDrawer && !acertou)

  useEffect(() => {
    pedirHistoricoRef.current = pedirHistorico
  }, [pedirHistorico])

  const gameStatus = game?.status
  const gameRodada = game?.rodada

  useEffect(() => {
    if (gameStatus !== 'playing' || isHost || !gameRodada) return
    if (rodadaHistoricoRef.current === gameRodada) return
    if (useStore.getState().tracos.length > 0) return
    rodadaHistoricoRef.current = gameRodada
    const timer = setTimeout(() => pedirHistoricoRef.current(), 450)
    return () => clearTimeout(timer)
  }, [gameRodada, gameStatus, isHost])

  if (!game) {
    return (
      <main className="screen center-screen">
        <p className="muted">Sincronizando partida...</p>
      </main>
    )
  }

  const presencaPorId = new Map(players.map((jogador) => [jogador.id, jogador]))
  const jogadoresDoJogo = game.participantes.map((jogador) => ({
    ...jogador,
    nome: presencaPorId.get(jogador.id)?.nome || jogador.nome,
    offline: !presencaPorId.has(jogador.id),
  }))

  const motivoBloqueio = isDrawer
    ? 'Você está desenhando'
    : acertou
      ? 'Você já acertou nesta rodada'
      : reveal
        ? 'Aguarde a próxima rodada'
        : 'Aguarde o início da rodada'

  function escolherCor(novaCor) {
    setCor(novaCor)
    setBorracha(false)
  }

  return (
    <main className="screen game-screen">
      <header className="game-topbar">
        <div className="game-brand">
          <div className="brand small-brand">
            <span className="brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span>Rabisca</span>
          </div>
          <span className="room-mini">Sala {useStore.getState().roomCode}</span>
        </div>

        <div className="round-info">
          <span className="round-pill">
            Rodada {game.rodada} de {game.totalRodadas}
          </span>
          <span className="drawer-info">
            {isDrawer ? 'É a sua vez!' : `${game.desenhistaNome} está desenhando`}
          </span>
        </div>

        <button type="button" className="text-button" onClick={sairDaSala}>
          Sair
        </button>
      </header>

      <section className="game-header-card">
        <div className="word-area">
          <span className="eyebrow">
            {isDrawer ? 'Sua palavra' : 'Dica'}
          </span>
          {reveal ? (
            <div className="word-display revealed">
              {game.palavraRevelada || palavraSecreta}
            </div>
          ) : isDrawer ? (
            <div className="word-display secret">
              {palavraSecreta || 'Sincronizando...'}
            </div>
          ) : (
            <div className="word-display">
              {(game.dica || '').split('').map((caractere, indice) => (
                <span
                  key={`${caractere}-${indice}`}
                  className={
                    caractere === ' '
                      ? 'word-gap'
                      : caractere === '_'
                        ? 'word-letter is-blank'
                        : 'word-letter'
                  }
                >
                  {caractere === ' ' || caractere === '_' ? '' : caractere}
                </span>
              ))}
            </div>
          )}
          {reveal && (
            <p className="reveal-note">
              {game.motivoFim} Próxima rodada em instantes...
            </p>
          )}
        </div>
        <Timer restante={game.tempoRestante} total={game.tempoTotal} />
      </section>

      <div className="game-layout">
        <aside className="game-sidebar card">
          <PlayerList
            players={jogadoresDoJogo}
            hostId={hostId}
            selfId={selfId}
            scores={game.placar}
            drawerId={game.desenhistaId}
            showScores
          />
          <div className="sidebar-note">
            {isHost ? (
              <span className="tag tag-host">Você é o host</span>
            ) : (
              <span className="muted small">O host controla a partida.</span>
            )}
          </div>
        </aside>

        <section className="game-center">
          <div className="drawing-card">
            <div className="toolbar" role="toolbar" aria-label="Ferramentas de desenho">
              <div className="tool-group colors">
                {CORES.map((opcao) => (
                  <button
                    key={opcao}
                    type="button"
                    className={`color-swatch ${cor === opcao && !borracha ? 'selected' : ''}`}
                    style={{ '--swatch': opcao }}
                    onClick={() => escolherCor(opcao)}
                    disabled={!isDrawer || !playing}
                    title={`Cor ${opcao}`}
                    aria-label={`Selecionar cor ${opcao}`}
                  />
                ))}
              </div>

              <div className="tool-group width-group">
                <label htmlFor="espessura">Espessura</label>
                <input
                  id="espessura"
                  type="range"
                  min="2"
                  max="18"
                  value={espessura}
                  onChange={(evento) =>
                    setEspessura(Number(evento.target.value))
                  }
                  disabled={!isDrawer || !playing}
                />
                <span className="width-preview" aria-hidden="true">
                  <span style={{ width: espessura, height: espessura }} />
                </span>
              </div>

              <button
                type="button"
                className={`button tool-button ${borracha ? 'selected' : ''}`}
                onClick={() => setBorracha((valor) => !valor)}
                disabled={!isDrawer || !playing}
              >
                Borracha
              </button>
            </div>

            <Canvas
              ativo={isDrawer && playing}
              cor={cor}
              espessura={espessura}
              borracha={borracha}
              onLote={enviarLote}
              onLimpar={limparCanvas}
            />
          </div>
        </section>

        <aside className="game-chat">
          <Chat
            mensagens={chat}
            onEnviarPalpite={enviarPalpite}
            podePalpitar={podePalpitar}
            motivoBloqueio={motivoBloqueio}
            status={game.status}
          />
        </aside>
      </div>
    </main>
  )
}
