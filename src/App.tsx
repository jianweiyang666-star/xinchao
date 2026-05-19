import { useState, useEffect } from 'react';
import TodayPage from './app/(app)/today/page';
import JournalPage from './app/(app)/journal/page';
import AboutPage from './app/(app)/about/page';

export default function App() {
  const [route, setRoute] = useState('/today');

  // Extremely basic router for Vite preview
  useEffect(() => {
    const handleNavigation = () => {
      setRoute(window.location.hash.slice(1) || '/today');
    };
    window.addEventListener('hashchange', handleNavigation);
    handleNavigation(); // initialization
    return () => window.removeEventListener('hashchange', handleNavigation);
  }, []);

  const isToday = route === '/today';

  return (
    <div className="relative min-h-screen bg-void-bg text-void-text antialiased">
      {/* Global SVG Filters for Metaball and noise */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <filter id="fluid">
            <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -15" result="fluid" />
            <feBlend in="SourceGraphic" in2="fluid" />
          </filter>
          <filter id="fluid-soft">
            <feGaussianBlur in="SourceGraphic" stdDeviation="22" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -15" result="fluid" />
            <feBlend in="SourceGraphic" in2="fluid" />
          </filter>
          <filter id="paper-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.08 0" in="noise" result="coloredNoise" />
            <feBlend in="SourceGraphic" in2="coloredNoise" mode="multiply" />
          </filter>
        </defs>
      </svg>

      {/* Basic page renderer */}
      <div 
        className="mx-auto max-w-md min-h-screen shadow-2xl relative overflow-hidden"
        style={
          isToday ? {
            background: "linear-gradient(180deg, #D0C5E6 0%, #EED8D5 50%, #FDF0CC 100%)",
            color: "var(--void-text)"
          } : {}
        }
      >
        {route === '/today' && <TodayPage />}
        {route === '/journal' && <JournalPage />}
        {route === '/about' && <AboutPage />}
      </div>
    </div>
  );
}

