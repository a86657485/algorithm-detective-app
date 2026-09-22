import tailwindcssAnimate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"PingFang SC"',
          '"Microsoft YaHei"',
          '"Source Han Sans SC"',
          '"Hiragino Sans GB"',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        hand: ['"Kaiti SC"', '"KaiTi"', '"STKaiti"', '"PingFang SC"', 'serif'],
      },
      colors: {
        // 三区语义色：输入=草绿 / 处理=天蓝 / 输出=橙黄
        zin: { DEFAULT: '#6AA84F', dark: '#38761D', light: '#D9EAD3', pale: '#EFF7EA' },
        zproc: { DEFAULT: '#4A86E8', dark: '#2563EB', light: '#C9DAF8', pale: '#EEF4FF' },
        zout: { DEFAULT: '#E69138', dark: '#BF6A00', light: '#FCE5CD', pale: '#FFF6EA' },
        paper: '#FBF7F0',
        ink: '#22272E',
        ink2: '#5B6472',
        notebook: '#1B2333',
        tape: '#F6E7A1',
      },
      boxShadow: {
        card: '0 6px 18px rgba(34, 39, 46, 0.10)',
        cardHover: '0 12px 28px rgba(34, 39, 46, 0.16)',
        stamp: '0 2px 0 rgba(0,0,0,0.08), 0 8px 20px rgba(191, 106, 0, 0.25)',
        inner1: 'inset 0 1px 0 rgba(255,255,255,0.6)',
      },
      borderRadius: {
        notebook: '18px',
      },
      keyframes: {
        popIn: {
          '0%': { transform: 'scale(0.86)', opacity: '0' },
          '70%': { transform: 'scale(1.04)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shakeX: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-7px)' },
          '40%': { transform: 'translateX(7px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        floatY: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        stampDown: {
          '0%': { transform: 'scale(2.2) rotate(-18deg)', opacity: '0' },
          '60%': { transform: 'scale(0.94) rotate(-8deg)', opacity: '1' },
          '80%': { transform: 'scale(1.06) rotate(-12deg)' },
          '100%': { transform: 'scale(1) rotate(-10deg)', opacity: '1' },
        },
      },
      animation: {
        popIn: 'popIn 320ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        shakeX: 'shakeX 420ms ease-in-out',
        floatY: 'floatY 2.6s ease-in-out infinite',
        stampDown: 'stampDown 620ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
