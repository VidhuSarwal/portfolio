import type { Metadata } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import Cursor from '@/app/components/Cursor';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
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
    "Final-year CS undergrad. GSoC '25 at BeagleBoard.org. Samsung PRISM. Linux Kernel Mentorship Program.",
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
      className={`${spaceGrotesk.variable} ${jetbrains.variable}`}
    >
      <body>
        <Cursor />
        {children}
      </body>
    </html>
  );
}
