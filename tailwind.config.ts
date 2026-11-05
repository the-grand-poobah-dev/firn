import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: {
      bg: 'var(--bg)', card: 'var(--card)', card2: 'var(--card2)', fg: 'var(--fg)', muted: 'var(--muted)', line: 'var(--line)',
      accent: 'var(--accent)', 'accent-on': 'var(--accent-on)', pos: 'var(--pos)', neg: 'var(--neg)', warm: 'var(--warm)',
      c1:'var(--c1)',c2:'var(--c2)',c3:'var(--c3)',c4:'var(--c4)',c5:'var(--c5)',c6:'var(--c6)',c7:'var(--c7)',c8:'var(--c8)'
    },
    fontFamily: { sans:['var(--font-ui)','system-ui','sans-serif'], mono:['var(--font-mono)','monospace'] },
    boxShadow: { float:'0 8px 20px -12px rgba(0,0,0,.45)' }
  } }, plugins: []
} satisfies Config;
