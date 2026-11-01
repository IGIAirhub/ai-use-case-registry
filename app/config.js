// Reads registry.config.js, fills in defaults and applies the theme before the app renders.
/* global window, document */

(function () {
  const user = window.REGISTRY_CONFIG || {};
  const config = {
    organization: "",
    appTitle: "AI Use Case Registry",
    logo: null,
    footer: "",
    theme: {},
    fonts: {},
    languages: ["en"],
    recordIdPrefix: "UC",
    demo: null,
    ...user,
    submit: { url: "", contentType: "application/json", ...(user.submit || {}) },
  };

  // Only offer languages whose content file is loaded; English is always the base.
  const loaded = Object.keys(window.REGISTRY_LOCALES || {});
  config.languages = (config.languages || []).filter((code) => loaded.includes(code));
  if (!config.languages.length) config.languages = ["en"];

  // theme.brand -> --brand, fonts.sans -> --font-sans, and so on.
  const rootStyle = document.documentElement.style;
  Object.entries(config.theme || {}).forEach(([key, value]) => {
    if (value) rootStyle.setProperty(`--${key}`, value);
  });
  Object.entries(config.fonts || {}).forEach(([key, value]) => {
    if (value) rootStyle.setProperty(`--font-${key}`, value);
  });

  if (config.appTitle) document.title = config.appTitle;

  window.RegistryConfig = config;
})();
