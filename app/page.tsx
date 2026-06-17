import NavOverlay from '@/app/components/NavOverlay';
import KineticBasket from '@/app/components/KineticBasket';
import SkipNav from '@/app/components/SkipNav';
import Hero from '@/app/components/sections/Hero';
import BridgeOscilloscope from '@/app/components/sections/BridgeOscilloscope';
import Projects from '@/app/components/sections/SBCShowcase';
import Experience from '@/app/components/sections/Experience';
import StatsBridge from '@/app/components/sections/StatsBridge';
import TechStack from '@/app/components/sections/TechStack';
import Contact from '@/app/components/sections/Contact';
import VXFooter from '@/app/components/sections/VXFooter';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Vidhu Sarwal',
  url: 'https://vidhux.dev',
  jobTitle: 'Systems Engineer',
  description:
    "Final-year CS undergrad specializing in Linux kernel development, distributed systems, and AI infrastructure. GSoC '25 at BeagleBoard.org, Samsung PRISM Research Intern, Linux Kernel Mentorship Program (LFX '26).",
  sameAs: [
    'https://github.com/VidhuSarwal',
    'https://linkedin.com/in/vidhusarwal',
  ],
  knowsAbout: [
    'Linux Kernel',
    'Distributed Systems',
    'AI Infrastructure',
    'Systems Engineering',
    'Embedded Systems',
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SkipNav />
      <NavOverlay />
      <KineticBasket />

      <main>
        <Hero />
        <BridgeOscilloscope />
        <Projects />
        {/* approach buffer — scroll distance between SBC exit and Experience sticky start */}
        <div aria-hidden style={{ height: 'clamp(120px, 16vh, 200px)' }} />
        <Experience />
        {/* small gap after Experience's 420vh section before StatsBridge */}
        <div aria-hidden style={{ height: 'clamp(48px, 6vh, 80px)' }} />
        <StatsBridge />
        <TechStack />
        <Contact />
        <VXFooter />
      </main>
    </>
  );
}
