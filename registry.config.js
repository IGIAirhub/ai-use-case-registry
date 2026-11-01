// AI Use Case Registry — configuration.
//
// Your organization's identity, look and integrations. Everything here is optional:
// delete a line to fall back to the default. Questions, fields and wording live in
// content/registry.<language>.js, not here.

window.REGISTRY_CONFIG = {
  // Shown above the start page title and stored in every exported record
  organization: "Your Organization",

  // Browser tab title
  appTitle: "Your Organization · AI Use Case Registry",

  // Header logo. `href` is where clicking it goes; leave it out for no link.
  // Remove `logo` entirely to show the organization name as text instead.
  logo: {
    src: "images/logo-placeholder.svg",
    alt: "Your Organization",
    // href: "https://intranet.example.com/",
  },

  // Footer line on the start page (the content version is added after it)
  footer: "© Your Organization",

  // Colors. Each key sets the CSS variable of the same name in styles.css (e.g.
  // brand -> --brand). Any variable on :root in styles.css can be set here.
  theme: {
    brand: "#c24c44",      // highlight: current step, active markers
    accent: "#1e1e1e",     // buttons, selected answers, banners
    ink: "#212121",        // body text
    bg: "#ffffff",         // page background
    t1: "#3f7a52",         // Tier 1 color
    t2: "#b26b00",         // Tier 2 color
    t3: "#a30202",         // Tier 3 color
  },

  // Typefaces (any CSS font-family list). Load web fonts yourself in index.html.
  fonts: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", Helvetica, sans-serif',
    // display: "Georgia, serif",   // headings; defaults to the sans font
  },

  // Languages offered in the switcher, in order. Each needs content/registry.<code>.js
  // loaded in index.html. The first one is the default.
  languages: ["en", "es"],

  // Prefix for record IDs, e.g. UC-20261030-K7Q2
  recordIdPrefix: "UC",

  // Optional: also send each submitted record to an address you choose (a Google Apps
  // Script, a Power Automate flow, your own API). Leave `url` empty to turn it off.
  // See docs/integrations.md. Anything in this file is visible to anyone who can open
  // the registry, so don't put passwords or keys here.
  submit: {
    url: "",
    // "text/plain" works with Google Apps Script without extra setup; use
    // "application/json" for most other endpoints.
    contentType: "text/plain;charset=utf-8",
  },
};
