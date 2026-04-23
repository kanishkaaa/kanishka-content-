import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#070707',
        surface: '#0f0f0f',
        border: '#1c1c1c',
        'text-primary': '#ede8df',
        muted: '#6e6a64',
        accent: '#d4a96a',
        'accent-light': '#e8c98a',
        'user-bg': '#13110d',
        'user-border': '#2a2118',
      },
      animation: {
        'bounce-dot': 'bounce 1s infinite',
      },
    },
  },
  plugins: [],
}
export default config
