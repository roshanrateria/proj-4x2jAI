module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Disable all TypeScript specific rules
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    
    // Disable React specific rules
    'react-hooks/exhaustive-deps': 'off',
    'react/no-unescaped-entities': 'off',
    
    // Disable Next.js specific rules
    '@next/next/no-img-element': 'off',
    '@next/next/no-html-link-for-pages': 'off',
  },
};
