import nextVitals from 'eslint-config-next/core-web-vitals';

const config = [
  {
    ignores: ['.next/**', 'out/**', '.vercel/**'],
  },
  ...nextVitals,
  {
    rules: {
      // Existing app code predates the stricter React 19 compiler lint rules.
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];

export default config;
