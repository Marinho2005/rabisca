function formatar(segundos) {
  const valor = Math.max(0, Number(segundos) || 0)
  const minutos = Math.floor(valor / 60)
  const resto = valor % 60
  return `${minutos}:${String(resto).padStart(2, '0')}`
}

export default function Timer({ restante = 0, total = 0 }) {
  const proporcao = total > 0 ? Math.max(0, Math.min(1, restante / total)) : 0
  const urgente = restante <= 10

  return (
    <div
      className={`timer ${urgente ? 'is-urgent' : ''}`}
      role="timer"
      aria-label={`${formatar(restante)} restantes`}
    >
      <svg
        aria-hidden="true"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9 V13 L15 15 M9 2 H15" />
      </svg>
      <span className="timer-value">{formatar(restante)}</span>
      <span className="timer-track" aria-hidden="true">
        <span style={{ width: `${proporcao * 100}%` }} />
      </span>
    </div>
  )
}
