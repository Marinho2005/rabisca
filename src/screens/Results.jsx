import { useState } from 'react'
import { useStore } from '../store/useStore'
import { useRoomContext } from '../hooks/useRoom'
import { rankingDoJogo } from '../lib/game'
import { linkDaSala } from '../lib/roomCode'
import Avatar from '../components/Avatar'
import { StarDeco } from '../components/Decor'

export default function Results() {
  const { jogarNovamente, sairDaSala } = useRoomContext()
  const game = useStore((state) => state.game)
  const hostId = useStore((state) => state.hostId)
  const selfId = useStore((state) => state.selfId)
  const roomCode = useStore((state) => state.roomCode)
  const [copiado, setCopiado] = useState(false)
  const ranking = rankingDoJogo(game)
  const isHost = Boolean(selfId && hostId === selfId)
  const vencedor = ranking[0]
  const indiceCor = new Map(
    (game?.participantes || []).map((jogador, indice) => [jogador.id, indice]),
  )

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(linkDaSala(roomCode))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <main className="screen results-screen">
      <StarDeco className="results-star" />

      <section className="card results-hero">
        <p className="eyebrow">Fim da partida</p>
        <h1>Ranking final</h1>
        {vencedor && (
          <p className="results-winner">
            {vencedor.id === selfId ? 'Você venceu!' : `${vencedor.nome} venceu!`}
          </p>
        )}
        {game?.palavraRevelada && (
          <p className="muted">
            Última palavra: <strong>{game.palavraRevelada}</strong>
          </p>
        )}
      </section>

      <section className="card ranking-card">
        <ol className="ranking-list">
          {ranking.map((jogador, indice) => (
            <li
              key={jogador.id}
              className={`ranking-row ${indice === 0 ? 'first' : ''} ${jogador.id === selfId ? 'is-me' : ''}`}
            >
              <span className="ranking-position">{indice + 1}</span>
              <Avatar
                nome={jogador.nome}
                indice={indiceCor.get(jogador.id)}
                size="sm"
              />
              <span className="ranking-name">
                {jogador.nome}
                {jogador.id === selfId && <span className="you"> (você)</span>}
              </span>
              <span className="ranking-score">{jogador.pontos} pts</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="results-actions">
        {isHost ? (
          <button
            type="button"
            className="button primary"
            onClick={jogarNovamente}
          >
            Jogar de novo
          </button>
        ) : (
          <p className="muted waiting-host">
            Aguardando o anfitrião iniciar outra partida...
          </p>
        )}
        <button type="button" className="button secondary" onClick={copiarLink}>
          {copiado ? 'Link copiado!' : 'Copiar link da sala'}
        </button>
        <button type="button" className="text-button" onClick={sairDaSala}>
          Sair da sala
        </button>
      </div>
    </main>
  )
}
