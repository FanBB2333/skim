/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Morandi (莫兰迪) palette: muted, dusty, earthy tones.
        morandi: {
          sage: "#a9b9a4",
          slate: "#95a8b5",
          clay: "#c9a292",
          rose: "#c8a8a8",
          sand: "#dfd3bd",
          moss: "#889583",
          mauve: "#b09fab",
          mustard: "#c8b585",
          cream: "#f3ecdd",
          ink: "#4a4a48",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      backgroundImage: {
        // Soft Morandi wash for the hero — dusty sage, clay, slate, and mauve.
        "mesh-light":
          "radial-gradient(at 10% 0%, rgba(169,185,164,0.55) 0px, transparent 55%), radial-gradient(at 90% 10%, rgba(201,162,146,0.50) 0px, transparent 55%), radial-gradient(at 80% 90%, rgba(149,168,181,0.45) 0px, transparent 55%), radial-gradient(at 20% 100%, rgba(176,159,171,0.38) 0px, transparent 55%)",
      },
    },
  },
  plugins: [],
};
