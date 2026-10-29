function formatar(segundos) {
  const valor = Math.max(0, Number(segundos) || 0)
  const minutos = Math.floor(valor / 60)
  const resto = valor % 60
  return `${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`
}

export default function Timer({ restante = 0, total = 0 }) {
  const proporcao = total > 0 ? Math.max(0, Math.min(1, restante / total)) : 0
  const urgente = restante <= 10

  return (
    <div className={`timer ${urgente ? 'is-urgent' : ''}`}>
      <div className="timer-label">Tempo</div>
      <div className="timer-value">{formatar(restante)}</div>
      <div className="timer-track" aria-hidden="true">
        <span style={{ width: `${proporcao * 100}%` }} />
      </div>
    </div>
  )
}
