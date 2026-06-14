import type { Metadata } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import Cursor from '@/app/components/Cursor';
import Loader from '@/app/components/Loader';
import SmoothScroll from '@/app/components/SmoothScroll';
import CornerBrackets from '@/app/components/CornerBrackets';
import MarginStatus from '@/app/components/MarginStatus';
import { LoaderProvider } from '@/app/providers/LoaderContext';
import { ThemeProvider } from '@/app/providers/ThemeContext';
import { Analytics } from '@vercel/analytics/next';
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
  title: 'VX Works',
  description:
    "Final-year CS undergrad. GSoC '25 at BeagleBoard.org. Samsung PRISM. Linux Kernel Mentorship Program.",
  openGraph: {
    title: 'VX Works',
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
        <ThemeProvider>
          <LoaderProvider>
            <Loader />
            <CornerBrackets />
            <MarginStatus />
            <SmoothScroll>
              <Cursor />
              {children}
            </SmoothScroll>
          </LoaderProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
