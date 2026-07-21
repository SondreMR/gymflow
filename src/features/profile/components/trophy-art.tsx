type TrophyArtProps = {
  compact?: boolean;
  trophyKey: string;
  unlocked: boolean;
};

const themes: Record<string, { accent: string; dark: string; metal: string }> = {
  "rookie-lifter": { accent: "#b9783b", dark: "#56351e", metal: "#d39a5d" },
  "consistent-athlete": { accent: "#d59a58", dark: "#704221", metal: "#f0bd79" },
  "iron-regular": { accent: "#c5d1d9", dark: "#5f6d76", metal: "#edf4f7" },
  "strength-builder": { accent: "#dfb93e", dark: "#715817", metal: "#ffe27a" },
  "gym-veteran": { accent: "#b4c4d2", dark: "#526879", metal: "#f1f6fa" },
  "elite-athlete": { accent: "#a8e9ff", dark: "#4d8aa5", metal: "#effcff" },
  "gymflow-legend": { accent: "#cbe95e", dark: "#151b1b", metal: "#f0c84f" },
};

export function TrophyArt({ compact = false, trophyKey, unlocked }: TrophyArtProps) {
  const theme = themes[trophyKey] ?? themes["rookie-lifter"];
  const lockedClass = unlocked ? "" : "opacity-35 grayscale";
  const isLegend = trophyKey === "gymflow-legend";
  const isCrystal = trophyKey === "elite-athlete";

  return (
    <svg
      aria-hidden="true"
      className={`trophy-art ${compact ? "h-12 w-14 shrink-0" : "h-36 w-full"} ${lockedClass} ${unlocked ? "trophy-reveal" : ""} ${isCrystal && unlocked ? "trophy-shimmer" : ""} ${isLegend && unlocked ? "trophy-legendary" : ""}`}
      fill="none"
      viewBox="0 0 180 150"
    >
      <defs>
        <linearGradient id={`${trophyKey}-metal`} x1="55" x2="125" y1="30" y2="110">
          <stop stopColor={theme.metal} />
          <stop offset="0.55" stopColor={theme.accent} />
          <stop offset="1" stopColor={theme.dark} />
        </linearGradient>
        <filter id={`${trophyKey}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {isLegend || isCrystal ? (
        <path
          d={
            isLegend
              ? "M90 14 132 47 116 108 64 108 48 47 90 14Z"
              : "M90 16 132 67 90 119 48 67 90 16Z"
          }
          fill={`url(#${trophyKey}-metal)`}
          stroke={theme.metal}
          strokeWidth="2"
        />
      ) : (
        <>
          <path
            d="M57 30h66v25c0 25-14 42-33 42S57 80 57 55V30Z"
            fill={`url(#${trophyKey}-metal)`}
            stroke={theme.metal}
            strokeWidth="2"
          />
          <path
            d="M57 42H39c0 23 11 34 28 34M123 42h18c0 23-11 34-28 34"
            stroke={theme.accent}
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M90 97v18M69 116h42"
            stroke={theme.metal}
            strokeWidth="7"
            strokeLinecap="round"
          />
        </>
      )}
      {trophyKey === "consistent-athlete" ? (
        <path
          d="m90 37 8 16 18 3-13 13 3 18-16-8-16 8 3-18-13-13 18-3 8-16Z"
          fill={theme.dark}
          opacity=".75"
        />
      ) : null}
      {trophyKey === "strength-builder" ? (
        <path
          d="M90 43 98 59 116 61 103 74 106 92 90 83 74 92 77 74 64 61 82 59 90 43Z"
          fill={theme.dark}
        />
      ) : null}
      {trophyKey === "gym-veteran" ? (
        <ellipse
          cx="90"
          cy="59"
          fill="none"
          rx="45"
          ry="39"
          stroke={theme.metal}
          strokeOpacity=".6"
          strokeWidth="2"
        />
      ) : null}
      {isLegend ? (
        <path
          d="M73 48h34l-7 39H80l-7-39Z"
          fill="#080c0c"
          stroke={theme.accent}
          strokeWidth="2"
          filter={`url(#${trophyKey}-glow)`}
        />
      ) : null}
      <path
        d="M51 121h78l-8 16H59l-8-16Z"
        fill={
          isLegend ? "#151b1b" : trophyKey === "rookie-lifter" ? "#5a351e" : theme.dark
        }
        stroke={isLegend ? theme.metal : theme.accent}
        strokeWidth="2"
      />
      {isLegend ? (
        <path
          d="M70 126h40"
          stroke={theme.accent}
          strokeLinecap="round"
          strokeWidth="3"
        />
      ) : null}
      {unlocked && (isLegend || isCrystal) ? (
        <circle
          cx="132"
          cy="31"
          fill={theme.accent}
          filter={`url(#${trophyKey}-glow)`}
          r="2.5"
        />
      ) : null}
    </svg>
  );
}
