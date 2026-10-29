export default function PlayerList({
  players,
  hostId,
  selfId,
  scores = {},
  drawerId = null,
  onRemove = null,
  canRemove = false,
  showScores = false,
  maxJogadores = 8,
}) {
  const lista = [...players].sort((a, b) => {
    if (showScores) {
      const diferenca = (scores[b.id] || 0) - (scores[a.id] || 0)
      if (diferenca !== 0) return diferenca
    }
    return a.entrouEm - b.entrouEm || a.nome.localeCompare(b.nome)
  })

  return (
    <div className="player-list">
      <div className="section-title">
        <h2>Jogadores</h2>
        <span className="badge">{lista.length}/{maxJogadores}</span>
      </div>

      {lista.length === 0 && (
        <p className="muted small">Ninguém na sala ainda.</p>
      )}

      <ul>
        {lista.map((jogador, indice) => {
          const eHost = jogador.id === hostId
          const eEu = jogador.id === selfId
          const desenhando = jogador.id === drawerId
          return (
            <li
              key={jogador.id}
              className={`player-row ${desenhando ? 'is-drawing' : ''} ${jogador.offline ? 'is-offline' : ''}`}
            >
              <span className="player-order">{indice + 1}</span>
              <span className="player-color" aria-hidden="true" />
              <span className="player-name" title={jogador.nome}>
                {jogador.nome}
                {eEu && <span className="you"> (você)</span>}
              </span>

              <span className="player-flags">
                {desenhando && <span className="tag tag-draw">desenhando</span>}
                {jogador.offline && <span className="tag">offline</span>}
                {eHost && <span className="tag tag-host">host</span>}
              </span>

              {showScores && (
                <strong className="player-score">{scores[jogador.id] || 0}</strong>
              )}

              {canRemove && !eEu && (
                <button
                  type="button"
                  className="icon-button danger"
                  onClick={() => onRemove?.(jogador.id)}
                  title={`Remover ${jogador.nome}`}
                >
                  Remover
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
