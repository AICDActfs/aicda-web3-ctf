import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: "#050505",
          dark: "#0b100b",
          card: "#0d140e",
          border: "#1a331a",
          green: "#00ff41",
          cyan: "#00ffff",
          dim: "#447744",
          red: "#ff3333",
          yellow: "#ffcc00"
        },
        india: {
          saffron: "#FF9933",
          white: "#FFFFFF",
          green: "#138808"
        }
      },
      fontFamily: {
        mono: ["Consolas", "Monaco", "Courier New", "monospace"],
      }
    },
  },
  plugins: [],
};
export default config;
