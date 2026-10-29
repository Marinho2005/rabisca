import Avatar from './Avatar'

export default function PlayerList({
  players,
  hostId,
  selfId,
  scores = {},
  drawerId = null,
  onRemove = null,
  canRemove = false,
  variant = 'sidebar',
  maxJogadores = 8,
}) {
  const ordemEntrada = [...players].sort(
    (a, b) => a.entrouEm - b.entrouEm || a.nome.localeCompare(b.nome),
  )
  const indiceCor = new Map(ordemEntrada.map((jogador, indice) => [jogador.id, indice]))

  const lista =
    variant === 'lobby'
      ? ordemEntrada
      : [...players].sort((a, b) => {
          const diferenca = (scores[b.id] || 0) - (scores[a.id] || 0)
          if (diferenca !== 0) return diferenca
          return (
            a.entrouEm - b.entrouEm || a.nome.localeCompare(b.nome)
          )
        })

  if (variant === 'lobby') {
    const vagas = Math.max(0, maxJogadores - lista.length)

    return (
      <div className="player-list lobby-players">
        <div className="players-head">
          <h2>Jogadores</h2>
          <span className="count-pill">
            {lista.length} / {maxJogadores}
          </span>
        </div>

        <div className="players-grid">
          {lista.map((jogador) => {
            const eHost = jogador.id === hostId
            const eEu = jogador.id === selfId
            return (
              <div
                key={jogador.id}
                className={`pcard ${jogador.offline ? 'is-offline' : ''}`}
              >
                <Avatar
                  nome={jogador.nome}
                  indice={indiceCor.get(jogador.id)}
                  host={eHost}
                />
                <div className="pcard-name" title={jogador.nome}>
                  {jogador.nome}
                  {eEu && <span className="you"> (você)</span>}
                </div>
                <small>
                  {jogador.offline
                    ? 'offline'
                    : eHost
                      ? 'anfitriã'
                      : 'pronto'}
                </small>

                {canRemove && !eEu && (
                  <button
                    type="button"
                    className="pcard-remove"
                    onClick={() => onRemove?.(jogador.id)}
                    aria-label={`Remover ${jogador.nome}`}
                    title={`Remover ${jogador.nome}`}
                  >
                    ×
                  </button>
                )}
              </div>
            )
          })}

          {Array.from({ length: vagas }, (_, indice) => (
            <div className="pcard empty" key={`vaga-${indice}`}>
              Esperando...
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="player-list score-list">
      <div className="panel-title">Placar</div>

      {lista.length === 0 && (
        <p className="muted small">Ninguém na sala ainda.</p>
      )}

      {lista.map((jogador) => {
        const eEu = jogador.id === selfId
        const desenhando = jogador.id === drawerId
        return (
          <div
            key={jogador.id}
            className={`score ${desenhando ? 'is-drawing' : ''} ${jogador.offline ? 'is-offline' : ''}`}
          >
            <Avatar
              nome={jogador.nome}
              indice={indiceCor.get(jogador.id)}
              size="xs"
              host={jogador.id === hostId}
            />
            <span className="score-name" title={jogador.nome}>
              {jogador.nome}
              {eEu && <span className="you"> (você)</span>}
              {desenhando && <small className="score-tag">desenhando</small>}
            </span>
            <b className="score-value">{scores[jogador.id] || 0}</b>
          </div>
        )
      })}
    </div>
  )
}
