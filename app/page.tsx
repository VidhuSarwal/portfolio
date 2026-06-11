import NavOverlay from '@/app/components/NavOverlay';
import SkipNav from '@/app/components/SkipNav';
import Hero from '@/app/components/sections/Hero';
import SBCShowcase from '@/app/components/sections/SBCShowcase';
import Experience from '@/app/components/sections/Experience';
import TechStack from '@/app/components/sections/TechStack';
import Contact from '@/app/components/sections/Contact';

export default function Home() {
  return (
    <>
      <SkipNav />
      <NavOverlay />

      <main>
        <Hero />

        {/* §02 Transition — 3D canvas arrives in M4 */}
        <div
          id="transition"
          aria-hidden="true"
          style={{ height: '2px', background: 'var(--border-rest)' }}
        />

        <SBCShowcase />
        <Experience />
        <TechStack />
        <Contact />
      </main>
    </>
  );
}
