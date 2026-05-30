/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef1fb',
          100: '#d5dcf4',
          200: '#adb9e9',
          300: '#7e93db',
          400: '#5570ce',
          500: '#3554c4',
          600: '#2B4083',
          700: '#243672',
          800: '#1c2b5e',
          900: '#14204a',
          950: '#0d1530',
        },
        surface: {
          DEFAULT: '#f7f8fc',
          card:    '#ffffff',
          border:  '#e8ebf5',
          muted:   '#f0f2f9',
        }
      },
      fontFamily: {
        sans:    ['"Google Sans"', 'system-ui', 'sans-serif'],
        display: ['"Google Sans Display"', '"Google Sans"', 'sans-serif'],
        mono:    ['"Google Sans Mono"', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', '14px'],
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'card':   '0 1px 3px rgba(43,64,131,.06), 0 1px 2px rgba(43,64,131,.04)',
        'card-md':'0 4px 16px rgba(43,64,131,.10)',
        'sidebar':'2px 0 20px rgba(43,64,131,.08)',
      },
      animation: {
        'fade-in':   'fadeIn .2s ease',
        'slide-in':  'slideIn .25s ease',
        'pop':       'pop .15s ease',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pop:     { '0%': { transform: 'scale(.95)' }, '60%': { transform: 'scale(1.03)' }, '100%': { transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}
