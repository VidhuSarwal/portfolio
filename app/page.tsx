import NavOverlay from '@/app/components/NavOverlay';
import KineticBasket from '@/app/components/KineticBasket';
import SkipNav from '@/app/components/SkipNav';
import Hero from '@/app/components/sections/Hero';
import Transition from '@/app/components/sections/Transition';
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
        <Transition />
        <Projects />
        <Experience />
        <StatsBridge />
        <TechStack />
        <Contact />
      </main>
    </>
  );
}
