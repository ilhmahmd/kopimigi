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
      },
      fontFamily: {
        sans:    ['"Google Sans"', 'system-ui', 'sans-serif'],
        display: ['"Google Sans Display"', '"Google Sans"', 'sans-serif'],
      },
      animation: {
        'fade-in':   'fadeIn .3s ease',
        'slide-up':  'slideUp .4s ease',
        'ping-slow': 'ping 2s cubic-bezier(0,0,.2,1) infinite',
        'flash':     'flash .25s ease-out',
        'countdown': 'countAnim .7s ease',
        'pop':       'pop .2s ease',
      },
      keyframes: {
        fadeIn:    { from:{ opacity:0 }, to:{ opacity:1 } },
        slideUp:   { from:{ opacity:0, transform:'translateY(20px)' }, to:{ opacity:1, transform:'translateY(0)' } },
        flash:     { '0%':{ opacity:0 }, '50%':{ opacity:1 }, '100%':{ opacity:0 } },
        countAnim: { '0%':{ transform:'scale(1.8)', opacity:0 }, '50%':{ opacity:1 }, '100%':{ transform:'scale(1)', opacity:1 } },
        pop:       { '0%':{ transform:'scale(.9)' }, '60%':{ transform:'scale(1.04)' }, '100%':{ transform:'scale(1)' } },
      },
    },
  },
  plugins: [],
}
