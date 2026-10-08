import '../viora-auth.css';
import type { ReactNode } from 'react';
import BrandLogo, { BagLeafIcon, TAGLINE } from '../components/BrandLogo';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

const perks = [
  { title: 'Track every order', text: 'See where your package is, from checkout to doorstep.' },
  { title: 'Save your addresses', text: 'Home, office or family, ready at checkout.' },
  { title: 'Check out faster', text: 'Your details are filled in, so it takes a few taps.' },
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.18" />
      <path d="M6 10.5l2.5 2.5L14 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Olive brand panel (top band on mobile, left half on desktop) + form on cream.
// text-left everywhere because the global Vite CSS centers text.
export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-viora-cream text-left font-body text-viora-ink lg:grid lg:grid-cols-[5fr_6fr]">
      <aside className="viora-fade relative flex flex-col overflow-hidden bg-gradient-to-br from-viora-olive to-viora-olive-dark px-6 pb-10 pt-8 text-left text-viora-cream [--leaf-vein:#4a5d29] lg:min-h-screen lg:justify-between lg:px-14 lg:py-12">
        <BrandLogo tone="cream" animated />

        <div className="relative z-10 mt-8 lg:mt-0">
          <p className="max-w-sm font-display text-2xl leading-snug lg:text-[2.6rem] lg:leading-[1.15]">{TAGLINE}</p>
          <ul className="mt-10 hidden space-y-5 lg:block">
            {perks.map((p) => (
              <li key={p.title} className="flex gap-3 text-viora-sage-soft">
                <CheckIcon />
                <div>
                  <p className="font-semibold text-viora-cream">{p.title}</p>
                  <p className="text-sm">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 mt-10 hidden text-xs text-viora-sage-soft/80 lg:block">© {new Date().getFullYear()} VIORA</p>

        <BagLeafIcon className="pointer-events-none absolute -bottom-16 -right-16 h-60 w-60 text-viora-cream opacity-[0.07] lg:h-[28rem] lg:w-[28rem]" />
      </aside>

      <main className="flex justify-center px-6 py-12 lg:items-center lg:px-16">
        <div className="w-full max-w-[26rem] text-left">
          <h1 className="viora-rise font-display text-4xl font-semibold leading-tight text-viora-ink lg:text-5xl">{title}</h1>
          <p className="viora-rise mt-3 text-base text-viora-muted" style={{ animationDelay: '80ms' }}>
            {subtitle}
          </p>
          <div className="viora-rise mt-10" style={{ animationDelay: '160ms' }}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
