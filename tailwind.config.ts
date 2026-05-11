import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import defaultTheme from "tailwindcss/defaultTheme";

const withOpacityValue = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/providers/**/*.{ts,tsx}",
    "./src/hooks/**/*.{ts,tsx}",
    "./node_modules/@bengo-hub/shared-ui-lib/dist/**/*.{js,cjs}",
  ],
  darkMode: "class",
  theme: {
    screens: {
      xs: "360px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        md: "2rem",
        lg: "2.5rem",
        xl: "3rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1200px",
        "2xl": "1360px",
      },
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: withOpacityValue("--brand-primary"),
          emphasis: withOpacityValue("--brand-emphasis"),
          contrast: withOpacityValue("--brand-contrast"),
          muted: withOpacityValue("--brand-muted"),
          surface: withOpacityValue("--brand-surface"),
          dark: withOpacityValue("--brand-dark"),
        },
        neutral: {
          "25": "#fafafa",
          "50": "#f5f5f5",
          "100": "#e5e7eb",
          "200": "#d1d5db",
          "300": "#9ca3af",
          "400": "#6b7280",
          "500": "#4b5563",
          "600": "#374151",
          "700": "#1f2937",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...defaultTheme.fontFamily.sans],
        mono: ["var(--font-geist-mono)", ...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        xs: [
          "0.75rem",
          {
            lineHeight: "1.25rem",
          },
        ],
        sm: [
          "0.875rem",
          {
            lineHeight: "1.35rem",
          },
        ],
        base: [
          "1rem",
          {
            lineHeight: "1.6rem",
          },
        ],
        lg: [
          "clamp(1.05rem, 1vw + 0.85rem, 1.25rem)",
          {
            lineHeight: "1.75rem",
          },
        ],
        xl: [
          "clamp(1.25rem, 1.2vw + 1rem, 1.5rem)",
          {
            lineHeight: "2rem",
          },
        ],
        "2xl": [
          "clamp(1.5rem, 1.4vw + 1.1rem, 1.8rem)",
          {
            lineHeight: "2.25rem",
          },
        ],
        "3xl": [
          "clamp(1.85rem, 1.8vw + 1.2rem, 2.25rem)",
          {
            lineHeight: "2.5rem",
          },
        ],
        "4xl": [
          "clamp(2.25rem, 2.2vw + 1.4rem, 2.75rem)",
          {
            lineHeight: "1.1",
          },
        ],
      },
      spacing: {
        "13": "3.25rem",
        "15": "3.75rem",
        "18": "4.5rem",
        "21": "5.25rem",
        "25": "6.25rem",
      },
      maxWidth: {
        prose: "65ch",
        "screen-app": "1360px",
      },
      boxShadow: {
        soft: "0 10px 40px -20px rgba(107, 42, 27, 0.35)",
        floating: "0 20px 60px -25px rgba(17, 24, 39, 0.35)",
      },
      transitionTimingFunction: {
        "ease-out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
