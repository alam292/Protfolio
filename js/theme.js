/**
 * Theme Controller
 * Ensures default dark hacker theme is maintained across the portfolio.
 */

class ThemeController {
  constructor() {
    this.STORAGE_KEY = 'matloob_portfolio_theme';
    this.DEFAULT_THEME = 'hacker';
    this.currentTheme = this.DEFAULT_THEME;

    this.init();
  }

  init() {
    // Clear any previously persisted light theme and reset to default dark theme
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      // localStorage unavailable or restricted
    }
    document.documentElement.removeAttribute('data-theme');
    if (document.body) {
      document.body.classList.remove('theme-light');
    }
  }

  applyTheme(theme) {
    this.currentTheme = 'hacker';
    document.documentElement.removeAttribute('data-theme');
    if (document.body) {
      document.body.classList.remove('theme-light');
    }
  }

  toggleTheme() {
    // No-op: theme toggle button removed
  }

  updateToggleButtons() {
    // No-op: theme toggle button removed
  }

  bindToggles() {
    // No-op: theme toggle button removed
  }
}

window.ThemeController = ThemeController;


