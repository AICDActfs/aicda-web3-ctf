import type { Metadata } from 'next';
import './globals.css';
import MatrixRain from '@/components/MatrixRain';

export const metadata: Metadata = {
  metadataBase: new URL('https://aicda-web3-ctf.vercel.app'),
  title: 'AICDA Cryptocurrency Penetration Testing Lab',
  description: 'Anonymous India Cyber Defence Academy - Advanced Web3, Smart Contract & DeFi Security Auditing Cyber Range.',
  icons: {
    icon: [
      { url: '/icon.png', sizes: '128x128', type: 'image/png' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo.png', sizes: 'any' }
    ],
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: 'AICDA Cryptocurrency Penetration Testing Lab',
    description: 'Anonymous India Cyber Defence Academy - Advanced Web3, Smart Contract & DeFi Security Auditing Cyber Range.',
    url: 'https://aicda-web3-ctf.vercel.app',
    siteName: 'Anonymous India Cyber Defence Academy (AICDA)',
    images: [
      {
        url: '/matrix-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'AICDA Cryptocurrency Penetration Testing Lab',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AICDA Cryptocurrency Penetration Testing Lab',
    description: 'Anonymous India Cyber Defence Academy - Advanced Web3, Smart Contract & DeFi Security Auditing Cyber Range.',
    images: ['/matrix-banner.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/icon.png" sizes="128x128" type="image/png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <meta property="og:image" content="https://aicda-web3-ctf.vercel.app/matrix-banner.jpg" />
        <meta property="og:image:secure_url" content="https://aicda-web3-ctf.vercel.app/matrix-banner.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/jpeg" />
      </head>
      <body className="min-h-screen bg-cyber-black text-gray-200 antialiased selection:bg-cyber-green selection:text-black">
        <MatrixRain />
        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
