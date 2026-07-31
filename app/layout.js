import './globals.css';
import BottomNav from './components/BottomNav';
import Script from 'next/script';

const GA_ID = 'G-E7T1ZLQ85X';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B1D3A',
};

export const metadata = {
  title: 'cityFUNHOP Tampa | City Experiences On Demand',
  description: 'Request an on-demand or scheduled city experience across Tampa neighborhoods. Name your price and your City Host confirms in minutes. City Tour Guide Inc.',
  keywords: 'Tampa city tour, on demand city experience, Tampa neighborhoods, City Tour Guide',
  appleWebApp: {
    capable: true,
    title: 'cityFUNHOP',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'cityFUNHOP Tampa | City Experiences On Demand',
    description: 'Name your price. City Host confirms. One HOP at a time through Tampa.',
    siteName: 'cityFUNHOP by City Tour Guide',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="cityFUNHOP" />
        <meta name="msapplication-TileColor" content="#0B1D3A" />
        <link rel="apple-touch-icon" href="/driver-profile.png" />
      </head>
      <body>
        {children}
        <BottomNav />
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}</Script>
      </body>
    </html>
  );
}