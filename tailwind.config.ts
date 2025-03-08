// tailwind.config.ts

import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';

export default (<Partial<Config>>{
  content: [],
  theme: {
    fontFamily: {
      sans: ['Doto'],
    },
    fontSize: {
    
    },
    extend: {
      colors: {
        primary: colors.green,
      },
    },
  },
  plugins: [],
});
