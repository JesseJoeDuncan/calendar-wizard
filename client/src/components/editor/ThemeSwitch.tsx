import { useThemeToggle } from "../../lib/useThemeToggle";
import "./ThemeSwitch.css";

/** A left/right toggle switch for light/dark mode, replacing the earlier icon-button toggle. */
export function ThemeSwitch() {
  const { theme, toggle } = useThemeToggle();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className={`theme-switch ${isDark ? "dark" : ""}`}
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="theme-switch-icon">☀</span>
      <span className="theme-switch-thumb" />
      <span className="theme-switch-icon">☾</span>
    </button>
  );
}
