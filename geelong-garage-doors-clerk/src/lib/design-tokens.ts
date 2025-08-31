// Design system tokens (condensed)
export const colors = {
  primary: { blue: "#2C3993", orange: "#F88229", red: "#901C3B", charcoal: "#333333" },
  background: { primary: "#F9F9F9", white: "#FFFFFF", light: "#FAFAFA" },
  text: { primary: "#333333", secondary: "#666666", muted: "#999999", white: "#FFFFFF", light: "#e1ecf8" },
  hover: { blue: "#1e2870", orange: "#e6741f", white: "#f5f5f5" },
  category: {
    residential: { bg: "#e1ecf8", text: "#2C3993" },
    commercial: { bg: "#dcfce7", text: "#166534" },
    industrial: { bg: "#f3e8ff", text: "#7c3aed" },
    custom: { bg: "#fed7aa", text: "#ea580c" },
    heritage: { bg: "#fef3c7", text: "#d97706" },
    smart: { bg: "#dbeafe", text: "#1d4ed8" },
  },
  border: { light: "#e5e7eb", medium: "#d1d5db", dark: "#9ca3af" },
} as const;

export const typography = {
  fontFamily: { primary: ["Montserrat", "sans-serif"] },
  fontSize: { xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.25rem", "2xl": "1.5rem", "3xl": "1.875rem", "4xl": "2.25rem", "5xl": "3rem", "6xl": "3.75rem" },
  fontWeight: { thin: 100, extralight: 200, light: 300, normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800, black: 900 },
  lineHeight: { tight: 1.25, normal: 1.5, relaxed: 1.625 },
} as const;

export const spacing = {
  container: { maxWidth: "1440px", padding: "5rem" },
  section: { py: "4rem", pyLarge: "5rem" },
  card: { padding: "1.5rem", gap: "1rem" },
} as const;

export const borderRadius = { sm: "0.25rem", md: "0.375rem", lg: "0.5rem", xl: "0.75rem" } as const;

export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
} as const;

export const animations = {
  transition: { fast: "150ms ease-in-out", normal: "300ms ease-in-out", slow: "500ms ease-in-out" },
  hover: { scale: "scale(1.05)", lift: "translateY(-2px)" },
} as const;

export const components = {
  button: {
    height: { sm: "2.5rem", md: "3rem", lg: "3.5rem" },
    padding: { sm: "0.75rem 1.5rem", md: "1rem 2rem", lg: "1.25rem 2.5rem" },
  },
  card: { borderRadius: borderRadius.lg, shadow: shadows.sm, hoverShadow: shadows.lg },
  header: { height: "5rem", background: colors.primary.blue },
  hero: { height: "37.5rem", heightSmall: "31.25rem" },
} as const;

export type Colors = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type Components = typeof components;

