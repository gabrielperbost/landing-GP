import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/styles/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/content/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        lg: "2rem",
        xl: "3rem"
      }
    },
    extend: {
      colors: {
        primary: "#1D4ED8",
        primaryDark: "#0B2C7C",
        accent: "#22D3EE",
        ink: "#0F172A",
        muted: "#475569",
        surface: "#0B1224",
        card: "#FFFFFF",
        border: "#E2E8F0",
        // Direction artistique du site réellement en ligne (pages locales assurance
        // emprunteur, voir src/app/assurance-emprunteur/[slug]) : valeurs reprises à
        // l'identique de :root dans maquettes/gp-finances-2026-09-22/styles.css.
        // Tokens additifs, n'affectent aucune page existante (primary/ink/surface
        // du thème bleu/cyan inchangés).
        midnight: "#0d1f3c",
        midnightSoft: "#172f50",
        gold: "#c9a84c",
        goldLight: "#e8c97a",
        ivory: "#fafaf7",
        localInk: "#142638",
        localMuted: "#64717d",
        localBorder: "#e8e4d9",
        goldPale: "#f7f2e7",
        bluePale: "#eff3f7"
      },
      fontFamily: {
        localSerif: ["var(--font-local-serif)", "Georgia", "serif"],
        localSans: ["var(--font-local-sans)", "Arial", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 48px -22px rgba(15, 23, 42, 0.22)"
      },
      borderRadius: {
        xl: "16px"
      },
      transitionDuration: {
        200: "200ms"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" }
        }
      },
      animation: {
        float: "float 6s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
