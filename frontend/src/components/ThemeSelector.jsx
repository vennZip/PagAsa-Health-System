import { useTheme } from "../context/useTheme";
import { Icon } from "./Icons";

function ThemeSelector({ compact = false }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={compact ? "theme-selector theme-selector--compact" : "theme-selector"}
      role="group"
      aria-label="Color theme"
    >
      <button
        type="button"
        className={theme === "light" ? "theme-selector__option is-active" : "theme-selector__option"}
        aria-pressed={theme === "light"}
        aria-label="Use light mode"
        onClick={() => setTheme("light")}
      >
        <Icon name="sun" size={19} />
        {!compact && <span>Light Mode</span>}
      </button>
      <button
        type="button"
        className={theme === "dark" ? "theme-selector__option is-active" : "theme-selector__option"}
        aria-pressed={theme === "dark"}
        aria-label="Use dark mode"
        onClick={() => setTheme("dark")}
      >
        <Icon name="moon" size={19} />
        {!compact && <span>Dark Mode</span>}
      </button>
    </div>
  );
}

export default ThemeSelector;
