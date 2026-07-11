// Logo component using actual brand image assets
// Images should be in src/assets/

import mainLogo from '../assets/SeniorSeLe_MainLogo.png'
import splashLogo from '../assets/SeniorSeLe_SpashLogo.png'

export default function Logo({ size = 'md', dark = false, showTagline = false }) {
  const sizes = {
    sm: { height: 'h-7' },
    md: { height: 'h-14' },
    lg: { height: 'h-16' },
  }
  const s = sizes[size]

  return (
    <div className="inline-flex flex-col items-center">
      <img
        src={mainLogo}
        alt="Senior Se Le"
        className={`${s.height} w-auto object-contain ${dark ? 'brightness-0 invert' : ''}`}
      />
    </div>
  )
}

// Named export for splash — uses the icon/square version
export function SplashLogo() {
  return (
    <img
      src={splashLogo}
      alt="Senior Se Le"
      className="w-28 h-28 object-contain"
    />
  )
}
