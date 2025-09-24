import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
    // allow Portuguese folder name (typo 'componentes') and other folders
    "./componentes/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/i18n/**/*.{json,js,ts}",
  ],
  theme: { extend: {} },
  plugins: [],
};

export default config;
