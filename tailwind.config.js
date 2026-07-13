/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: [
          "Space Grotesk",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      colors: {
        ink: {
          950: "#05070d",
          900: "#0a0d16",
          850: "#0f1320",
          800: "#141a2b",
          700: "#1c2438",
          600: "#2a3350",
        },
        brand: {
          50: "#eef4ff",
          100: "#dbe6ff",
          200: "#bcd0ff",
          300: "#8eb0ff",
          400: "#5a84ff",
          500: "#3860ff",
          600: "#2143f5",
          700: "#1a33d8",
          800: "#1c2fae",
          900: "#1d2f89",
        },
        accent: {
          400: "#38e8c6",
          500: "#12d1a8",
          600: "#0bb08d",
        },
        // warm "signal" — used sparingly for live / you-are-here states
        signal: {
          400: "#ffb54a",
          500: "#f59e28",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(88,132,255,0.35), 0 0 40px -8px rgba(88,132,255,0.55)",
        glowAccent:
          "0 0 0 1px rgba(56,232,198,0.35), 0 0 40px -8px rgba(56,232,198,0.5)",
        card: "0 10px 40px -12px rgba(0,0,0,0.45)",
      },
      keyframes: {
        pulseNode: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(88,132,255,0.5)" },
          "50%": { boxShadow: "0 0 0 10px rgba(88,132,255,0)" },
        },
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        // a packet travelling down the request-trace spine
        trace: {
          "0%": { top: "0%", opacity: "0" },
          "8%": { opacity: "1" },
          "92%": { opacity: "1" },
          "100%": { top: "100%", opacity: "0" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.25" },
        },
      },
      animation: {
        pulseNode: "pulseNode 2.2s ease-out infinite",
        floatIn: "floatIn 0.5s cubic-bezier(0.22,1,0.36,1) both",
        shimmer: "shimmer 2.5s linear infinite",
        trace: "trace 3.4s cubic-bezier(0.65,0,0.35,1) infinite",
        blink: "blink 1.4s step-end infinite",
      },
    },
  },
  plugins: [],
};
