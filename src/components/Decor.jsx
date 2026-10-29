export function StarDeco({ className = '', style }) {
  return (
    <svg
      className={`deco deco-star ${className}`}
      aria-hidden="true"
      width="90"
      height="90"
      viewBox="0 0 90 90"
      style={style}
    >
      <path
        d="M45 8 L54 34 L82 36 L60 53 L68 80 L45 64 L22 80 L30 53 L8 36 L36 34 Z"
        fill="#FFC93C"
        stroke="#22212B"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SquiggleDeco({ className = '', style }) {
  return (
    <svg
      className={`deco deco-squiggle ${className}`}
      aria-hidden="true"
      width="120"
      height="60"
      viewBox="0 0 120 60"
      style={style}
    >
      <path
        d="M6 36 C 22 4, 38 4, 48 30 S 74 56, 86 28 S 104 8, 114 24"
        fill="none"
        stroke="#2F5FD0"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function DottedCircleDeco({ className = '', style }) {
  return (
    <svg
      className={`deco deco-circle ${className}`}
      aria-hidden="true"
      width="70"
      height="70"
      viewBox="0 0 70 70"
      style={style}
    >
      <circle
        cx="35"
        cy="35"
        r="26"
        fill="none"
        stroke="#1F8A5B"
        strokeWidth="7"
        strokeDasharray="4 12"
        strokeLinecap="round"
      />
    </svg>
  )
}
