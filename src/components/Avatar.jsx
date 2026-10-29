const CORES = ['coral', 'blue', 'green', 'yellow']

export function corDoIndice(indice = 0) {
  return CORES[Math.abs(indice) % CORES.length]
}

export default function Avatar({
  nome = '',
  indice = 0,
  size = 'md',
  host = false,
  className = '',
}) {
  const inicial = String(nome).trim().charAt(0).toUpperCase() || '?'
  const cor = corDoIndice(indice)

  return (
    <span
      className={`avatar avatar-${size} av-${cor} ${className}`}
      aria-hidden="true"
    >
      {inicial}
      {host && (
        <svg
          className="avatar-crown"
          width="28"
          height="22"
          viewBox="0 0 28 22"
        >
          <path
            d="M2 20 L4 6 L10 12 L14 3 L18 12 L24 6 L26 20 Z"
            fill="#FFC93C"
            stroke="#22212B"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  )
}
