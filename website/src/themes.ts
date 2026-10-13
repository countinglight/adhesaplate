// The IDs are stored in the browser and may appear in review links. Keep them stable.
export const themes = [
  { id: "blue-gold", label: "Blue & gold" },
  { id: "graphite-orange", label: "Graphite & orange" },
] as const;

export type ThemeId = (typeof themes)[number]["id"];
export const defaultTheme: ThemeId = "blue-gold";
