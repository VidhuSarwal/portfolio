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

export default function Home() {
  return (
    <>
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
      </main>
    </>
  );
}
