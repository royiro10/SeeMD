import "./theme.css";

const THEMES = [
    "theme-dark",
    "theme-solar",
    "theme-frost",
    "theme-midnight",
    "theme-sunset",
    "theme-emerald"
] as const;

export function setupTheme(themeName: typeof THEMES[number]) {
    if (!THEMES.includes(themeName)) {
        console.warn(`Unknown theme: ${themeName}`);
        return;
    }

    document.body.classList.remove(...THEMES);
    document.body.classList.add(themeName);
}