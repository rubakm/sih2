import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ocean: {
          950: '#06090e',
          900: '#0A0E14',
          850: '#0f151e',
          800: '#141c28',
          700: '#1e293b',
        },
        apple: {
          bg: '#0A0E14',
          surface: 'rgba(255, 255, 255, 0.04)',
          surfaceHover: 'rgba(255, 255, 255, 0.07)',
          border: 'rgba(255, 255, 255, 0.10)',
          borderHover: 'rgba(255, 255, 255, 0.18)',
          blue: '#0A84FF',
          blueHover: '#0071E3',
          green: '#30D158',
          amber: '#FF9F0A',
          red: '#FF453A',
          subtext: '#86868B',
          text: '#F5F5F7',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Inter"',
          'system-ui',
          'sans-serif',
        ],
      },
      letterSpacing: {
        tighter: '-0.03em',
        tight: '-0.02em',
      },
      borderRadius: {
        'apple': '22px',
        'apple-sm': '14px',
      },
      boxShadow: {
        'glass': '0 20px 50px rgba(0, 0, 0, 0.45)',
        'apple-subtle': '0 8px 30px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
};
export default config;
