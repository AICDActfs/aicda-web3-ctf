import type { Metadata } from 'next';
import './globals.css';
import MatrixRain from '@/components/MatrixRain';

export const metadata: Metadata = {
  title: 'AICDA Web3 Pentesting CTF | Smart Contract Cyber Range',
  description: 'National Cyber Security Lab for Web3, Solidity Exploitation, DeFi Security, and Blockchain Penetration Testing.',
  openGraph: {
    title: 'AICDA Web3 & Cryptocurrency Security CTF',
    description: 'Master Smart Contract Exploits, Reentrancy, Signature Malleability, and P2P Attacks.',
    url: 'https://aicda-crypto-ctf.vercel.app',
    siteName: 'AICDA Cyber Range',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'AICDA Web3 CTF Cyber Range',
      },
    ],
    locale: 'en_US',
    type: 'website',
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
        <link rel="icon" href="/logo.jpg" />
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
