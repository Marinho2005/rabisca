import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { useRoomContext } from '../hooks/useRoom'
import Canvas from '../components/Canvas'
import Chat from '../components/Chat'
import PlayerList from '../components/PlayerList'
import Timer from '../components/Timer'
import { LogoMark } from '../components/Brand'

const CORES = [
  { nome: 'Preto', valor: '#22212B' },
  { nome: 'Vermelho', valor: '#D4432B' },
  { nome: 'Azul', valor: '#2F5FD0' },
  { nome: 'Verde', valor: '#1F8A5B' },
  { nome: 'Amarelo', valor: '#FFC93C' },
  { nome: 'Branco', valor: '#FFFFFF' },
]

const ESPESSURAS = [
  { nome: 'Pincel fino', valor: 3 },
  { nome: 'Pincel médio', valor: 8 },
  { nome: 'Pincel grosso', valor: 16 },
]

export default function Game() {
  const { sairDaSala, enviarPalpite, enviarLote, limparCanvas, pedirHistorico } =
    useRoomContext()
  const game = useStore((state) => state.game)
  const roomCode = useStore((state) => state.roomCode)
  const players = useStore((state) => state.players)
  const hostId = useStore((state) => state.hostId)
  const selfId = useStore((state) => state.selfId)
  const palavraSecreta = useStore((state) => state.palavraSecreta)
  const chat = useStore((state) => state.chat)
  const [cor, setCor] = useState(CORES[0].valor)
  const [espessura, setEspessura] = useState(8)
  const [borracha, setBorracha] = useState(false)
  const [aba, setAba] = useState('palpites')
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
    entrouEm: presencaPorId.get(jogador.id)?.entrouEm || 0,
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

  const dica = game.dica || ''
  const totalLetras = (isDrawer ? palavraSecreta : dica).replace(
    /[\s-]/g,
    '',
  ).length
  const palavraNaTela = reveal
    ? game.palavraRevelada || palavraSecreta || '—'
    : isDrawer
      ? palavraSecreta || 'Sincronizando...'
      : dica.split('').join(' ')

  function escolherCor(novaCor) {
    setCor(novaCor)
    setBorracha(false)
  }

  return (
    <main className="screen game">
      <header className="game-head">
        <div className="game-head-left">
          <LogoMark size={40} />
          <span className="pill pill-ink">
            Rodada {game.rodada}/{game.totalRodadas}
          </span>
          <span className="room-mini">Sala {roomCode}</span>
        </div>

        <div className="game-word">
          <span className="drawer-info">
            {isDrawer
              ? `Você está desenhando · ${totalLetras} letras`
              : `${game.desenhistaNome} está desenhando · ${totalLetras} letras`}
          </span>
          <div
            className={`word-display ${reveal ? 'revealed' : ''} ${isDrawer && !reveal ? 'secret' : ''}`}
          >
            {palavraNaTela}
          </div>
          {reveal && (
            <p className="reveal-note">
              {game.motivoFim} Próxima rodada em instantes...
            </p>
          )}
        </div>

        <div className="game-head-right">
          <Timer restante={game.tempoRestante} total={game.tempoTotal} />
          <button type="button" className="text-button" onClick={sairDaSala}>
            Sair
          </button>
        </div>
      </header>

      <div className="game-body">
        <section className="board">
          <div className="card canvas-card">
            <Canvas
              ativo={isDrawer && playing}
              cor={cor}
              espessura={espessura}
              borracha={borracha}
              onLote={enviarLote}
            />
          </div>

          {isDrawer && (
            <div
              className="toolbar"
              role="toolbar"
              aria-label="Ferramentas de desenho"
            >
              <div className="tool-colors">
                {CORES.map((opcao) => (
                  <button
                    key={opcao.valor}
                    type="button"
                    className={`swatch ${cor === opcao.valor && !borracha ? 'selected' : ''}`}
                    style={{ '--swatch': opcao.valor }}
                    onClick={() => escolherCor(opcao.valor)}
                    disabled={!playing}
                    aria-label={opcao.nome}
                    title={opcao.nome}
                  />
                ))}
              </div>

              <span className="tool-divider" aria-hidden="true" />

              <div className="brushes">
                {ESPESSURAS.map((opcao) => (
                  <button
                    key={opcao.valor}
                    type="button"
                    className={`brush ${espessura === opcao.valor && !borracha ? 'selected' : ''}`}
                    onClick={() => {
                      setEspessura(opcao.valor)
                      setBorracha(false)
                    }}
                    disabled={!playing}
                    aria-label={opcao.nome}
                    aria-pressed={espessura === opcao.valor && !borracha}
                    title={opcao.nome}
                  >
                    <span
                      style={{ width: opcao.valor, height: opcao.valor }}
                    />
                  </button>
                ))}
              </div>

              <div className="toolbar-spacer" />

              <button
                type="button"
                className={`tool ${borracha ? 'selected' : ''}`}
                onClick={() => setBorracha((valor) => !valor)}
                disabled={!playing}
                aria-pressed={borracha}
              >
                Borracha
              </button>
              <button
                type="button"
                className="tool"
                onClick={limparCanvas}
                disabled={!playing}
              >
                Limpar
              </button>
            </div>
          )}
        </section>

        <aside className="side">
          <div
            className="side-tabs"
            role="tablist"
            aria-label="Placar e palpites"
          >
            <button
              type="button"
              role="tab"
              aria-selected={aba === 'placar'}
              className={`side-tab ${aba === 'placar' ? 'is-active' : ''}`}
              onClick={() => setAba('placar')}
            >
              Placar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={aba === 'palpites'}
              className={`side-tab ${aba === 'palpites' ? 'is-active' : ''}`}
              onClick={() => setAba('palpites')}
            >
              Palpites
            </button>
          </div>

          <div
            className={`side-panel panel score-panel ${aba === 'placar' ? 'is-active' : ''}`}
          >
            <PlayerList
              variant="sidebar"
              players={jogadoresDoJogo}
              hostId={hostId}
              selfId={selfId}
              scores={game.placar}
              drawerId={game.desenhistaId}
            />
            {isHost && <p className="host-note">Você é o anfitrião.</p>}
          </div>

          <div
            className={`side-panel chat-side ${aba === 'palpites' ? 'is-active' : ''}`}
          >
            <Chat
              mensagens={chat}
              onEnviarPalpite={enviarPalpite}
              podePalpitar={podePalpitar}
              motivoBloqueio={motivoBloqueio}
              status={game.status}
            />
          </div>
        </aside>
      </div>
    </main>
  )
}
