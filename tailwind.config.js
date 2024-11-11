/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {},
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.h-section': {
          height: 'calc(100vh-4rem)',
          maxHeight: 'calc(100vh - 6rem)',
        },
        '.scrollbar-hide': {
          /* Ocultar scrollbar */
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.scrollbar-custom': {
          /* Estilos scrollbar */
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgb(107 114 128)',
            borderRadius: '6px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#555',
          },
        },
      });
    },
  ],
}

