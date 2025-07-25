export const THEME = {
  PRIMARY: "#663399",
  SECONDARY: "#008080", 
  ACCENT: "#FFD700",
  BACKGROUND: "#0a0a0f",
  SURFACE: "#1a1a2e",
  TEXT: "#e0e0e6",
  TEXT_MUTED: "#a0a0b3",
  GLASS: "rgba(255, 255, 255, 0.1)",
  GLASS_BORDER: "rgba(255, 255, 255, 0.2)",
  GLOW: "rgba(102, 51, 153, 0.3)",
  NEBULA_1: "#663399",
  NEBULA_2: "#008080",
  NEBULA_3: "#FFD700",
  NEBULA_4: "#9966CC",
} as const;

export const ANIMATIONS = {
  DURATION: {
    FAST: "150ms",
    NORMAL: "300ms",
    SLOW: "500ms",
  },
  EASING: {
    EASE_OUT: "cubic-bezier(0.16, 1, 0.3, 1)",
    EASE_IN_OUT: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
} as const;