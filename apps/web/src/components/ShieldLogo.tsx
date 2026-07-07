interface ShieldLogoProps {
  size?: number;
  dark?: boolean;
  className?: string;
}

export function ShieldIcon({ size = 36, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <svg width={size} height={size * 60 / 52} viewBox="0 0 52 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M26 2L4 11V30C4 43.5 14 54.5 26 58C38 54.5 48 43.5 48 30V11L26 2Z"
        fill={`url(#shieldGrad-${dark ? "d" : "l"})`} />
      {/* Neural network nodes */}
      <circle cx="26" cy="19" r="3"   fill="white" opacity="0.95" />
      <circle cx="16" cy="30" r="2.5" fill="white" opacity="0.9" />
      <circle cx="36" cy="30" r="2.5" fill="white" opacity="0.9" />
      <circle cx="20" cy="41" r="2.5" fill="white" opacity="0.9" />
      <circle cx="32" cy="41" r="2.5" fill="white" opacity="0.9" />
      {/* Connections */}
      <line x1="26" y1="19" x2="16" y2="30" stroke="white" strokeWidth="1.4" strokeOpacity="0.75" />
      <line x1="26" y1="19" x2="36" y2="30" stroke="white" strokeWidth="1.4" strokeOpacity="0.75" />
      <line x1="16" y1="30" x2="20" y2="41" stroke="white" strokeWidth="1.4" strokeOpacity="0.75" />
      <line x1="16" y1="30" x2="32" y2="41" stroke="white" strokeWidth="1.4" strokeOpacity="0.5" />
      <line x1="36" y1="30" x2="32" y2="41" stroke="white" strokeWidth="1.4" strokeOpacity="0.75" />
      <line x1="36" y1="30" x2="20" y2="41" stroke="white" strokeWidth="1.4" strokeOpacity="0.5" />
      {/* Top node glow */}
      <circle cx="26" cy="19" r="5.5" fill="#00E5D5" opacity="0.25" />
      <defs>
        <linearGradient id="shieldGrad-l" x1="4" y1="2" x2="48" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#005EB8" />
          <stop offset="100%" stopColor="#003A7A" />
        </linearGradient>
        <linearGradient id="shieldGrad-d" x1="4" y1="2" x2="48" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0077D6" />
          <stop offset="100%" stopColor="#005EB8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function ShieldLogo({ size = 36, dark = false, className = "" }: ShieldLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <ShieldIcon size={size} dark={dark} />
      <span
        style={{
          fontFamily: "Atkinson Hyperlegible Next, Poppins, Inter, sans-serif",
          fontWeight: 900,
          fontSize: size * 0.75,
          color: dark ? "#ffffff" : "#003A7A",
          letterSpacing: "-0.3px",
          lineHeight: 1,
        }}
      >
        MiSalud Famil
        <span style={{ color: "#00B8A9", textShadow: "0 0 14px rgba(0,184,169,0.4)" }}>
          IA
        </span>
      </span>
    </div>
  );
}
