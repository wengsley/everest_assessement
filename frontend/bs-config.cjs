module.exports = {
  proxy: "http://127.0.0.1:3000",
  port: 3000,
  open: true,
  notify: false,
  ghostMode: {
    clicks: true,
    scroll: true,
    forms: true,
  },
  files: ["app/**/*.{ts,tsx,css}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
  reloadDelay: 400,
  ui: {
    port: 3002,
  },
};
