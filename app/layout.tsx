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
import { SpeedInsights } from '@vercel/speed-insights/next';
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
  metadataBase: new URL('https://vidhux.dev'),
  title: {
    default: 'Vidhu Sarwal — Systems Engineer',
    template: '%s | Vidhu Sarwal',
  },
  description:
    "Vidhu Sarwal — systems engineer and final-year CS undergrad. GSoC '25 at BeagleBoard.org, Samsung PRISM Research Intern, Linux Kernel Mentorship Program (LFX '26). Linux kernel, distributed systems, AI infrastructure.",
  keywords: [
    'Vidhu Sarwal',
    'systems engineer',
    'Linux kernel developer',
    'GSoC 2025',
    'Google Summer of Code',
    'BeagleBoard',
    'Samsung PRISM',
    'Linux Foundation Mentorship',
    'LFX mentorship',
    'portfolio',
    'software engineer',
    'distributed systems',
    'AI infrastructure',
    'Chandigarh',
  ],
  authors: [{ name: 'Vidhu Sarwal', url: 'https://vidhux.dev' }],
  creator: 'Vidhu Sarwal',
  openGraph: {
    type: 'website',
    url: 'https://vidhux.dev',
    siteName: 'Vidhu Sarwal',
    title: 'Vidhu Sarwal — Systems Engineer',
    description:
      "GSoC '25 at BeagleBoard.org · Samsung PRISM · Linux Kernel Mentorship (LFX '26). Linux kernel, distributed systems, AI infrastructure.",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vidhu Sarwal — Systems Engineer',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vidhu Sarwal — Systems Engineer',
    description:
      "GSoC '25 at BeagleBoard.org · Samsung PRISM · Linux Kernel Mentorship.",
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://vidhux.dev',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
        <SpeedInsights />
      </body>
    </html>
  );
}
