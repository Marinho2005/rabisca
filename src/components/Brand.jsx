export function LogoMark({ size = 64 }) {
  return (
    <svg
      className="brand-mark"
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 64 64"
    >
      <rect x="2" y="2" width="60" height="60" rx="18" fill="#22212B" />
      <circle cx="19" cy="19" r="9" fill="#F26B4B" />
      <circle cx="46" cy="29" r="9" fill="#3B6FE0" />
      <circle cx="27" cy="46" r="9" fill="#2FA36B" />
    </svg>
  )
}

export function Brand({ compact = false }) {
  return (
    <div className={`logo-row ${compact ? 'logo-row-compact' : ''}`}>
      <LogoMark size={compact ? 40 : 64} />
      <span className="logo-name">{compact ? 'Rabisca' : 'Rabisca'}</span>
    </div>
  )
}

export default Brand
