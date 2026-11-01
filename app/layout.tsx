import type { Metadata, Viewport } from 'next';
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
import { SITE_NAME, X_HANDLE } from '@/lib/metadata';
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
    url: '/',
    siteName: SITE_NAME,
    title: 'Vidhu Sarwal — Systems Engineer',
    description:
      "Linux kernel, distributed systems and AI infrastructure. LFX Kernel Mentorship '26 · GSoC '25 at BeagleBoard.org · Samsung PRISM.",
    locale: 'en_US',
  },
  // Card images come from file conventions: app/twitter-image.tsx for X, and
  // app/opengraph-image.tsx for everything else (WhatsApp, LinkedIn, Slack…).
  twitter: {
    card: 'summary_large_image',
    creator: X_HANDLE,
    title: 'Vidhu Sarwal — Systems Engineer',
    description:
      "Linux kernel, distributed systems and AI infrastructure. LFX Kernel Mentorship '26 · GSoC '25 · Samsung PRISM.",
  },
  alternates: {
    canonical: '/',
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

// Browser chrome tint on mobile — matches the default (dark) --bg-base.
export const viewport: Viewport = {
  themeColor: '#080808',
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
        {/* Repeat visits skip the splash, but that check runs after hydration —
            flag <html> before first paint so the white overlay never flashes.
            Production only, matching the Loader's own vx:bp skip. */}
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: "try{if(sessionStorage.getItem('vx:bp'))document.documentElement.setAttribute('data-vx-bp','')}catch(e){}",
            }}
          />
        )}
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
