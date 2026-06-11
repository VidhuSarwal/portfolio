import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

const cabinet = localFont({
  src: '../public/fonts/CabinetGrotesk-Variable.woff2',
  variable: '--font-cabinet',
  display: 'swap',
  weight: '100 900',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500'],
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['400'],
});

export const metadata: Metadata = {
  title: 'Vidhu Sarwal — Systems Engineer',
  description:
    'Final-year CS undergrad. GSoC \'25 at BeagleBoard.org. Samsung PRISM. Linux Kernel Mentorship Program.',
  openGraph: {
    title: 'Vidhu Sarwal — Systems Engineer',
    description: 'Linux kernel · Distributed systems · AI infrastructure.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${cabinet.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
