interface SajiinIconProps {
  size?: number
  className?: string
  white?: boolean
}

// Baca dari file public/logo-icon.svg atau public/logo-icon-white.svg
export function SajiinIcon({ size = 32, className = '', white = false }: SajiinIconProps) {
  return (
    <img
      src={white ? '/logo-icon-white.svg' : '/logo-icon.svg'}
      alt="Sajiin"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block' }}
    />
  )
}

interface SajiinLogoProps {
  size?: number
  variant?: 'full' | 'icon'
  dark?: boolean
  className?: string
}

// Logo full: baca dari public/logo-full.svg atau public/logo-full-white.svg
export default function SajiinLogo({
  size = 36,
  variant = 'full',
  dark = false,
  className = '',
}: SajiinLogoProps) {
  if (variant === 'icon') {
    return (
      <img
        src={dark ? '/logo-icon-white.svg' : '/logo-icon.svg'}
        alt="Sajiin"
        width={size}
        height={size}
        className={className}
        style={{ display: 'block' }}
      />
    )
  }

  return (
    <img
      src={dark ? '/logo-full-white.svg' : '/logo-full.svg'}
      alt="Sajiin"
      height={size}
      className={className}
      style={{ display: 'block' }}
    />
  )
}
