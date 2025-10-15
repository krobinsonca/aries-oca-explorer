import localFont from 'next/font/local';

export const bcSans = localFont({
  src: [
    {
      path: '../public/fonts/BCSans-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/BCSans-Italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../public/fonts/BCSans-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/BCSans-LightItalic.woff2',
      weight: '300',
      style: 'italic',
    },
    {
      path: '../public/fonts/BCSans-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/BCSans-BoldItalic.woff2',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-bc-sans',
  display: 'swap',
});
