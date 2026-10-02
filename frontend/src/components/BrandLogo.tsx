interface BrandLogoProps {
  tone?: 'olive' | 'cream';
  showTagline?: boolean;
  animated?: boolean;
}

export const TAGLINE = 'Everything You Need, All in One Place';

// VIORA mark: shopping bag with a leaf
export function BagLeafIcon({ className = '', animated = false }: { className?: string; animated?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none">
      <path d="M23 23v-6a9 9 0 0 1 18 0v6" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path
        d="M15 23h34l4 30a4 4 0 0 1-4 4.5H15a4 4 0 0 1-4-4.5z"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <circle cx="23" cy="26" r="2" fill="currentColor" />
      <circle cx="41" cy="26" r="2" fill="currentColor" />
      <g className={animated ? 'viora-leaf' : undefined}>
        <path d="M25 51c0-11 7-18 18-19 0 11-7 18-18 19z" fill="currentColor" />
        <path d="M27 50c3-6 7-10 12-13" stroke="var(--leaf-vein, #F6F4EE)" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export default function BrandLogo({ tone = 'olive', showTagline = false, animated = false }: BrandLogoProps) {
  const color = tone === 'olive' ? 'text-viora-olive' : 'text-viora-cream';
  return (
    <div className={color}>
      <div className="flex items-center gap-3">
        <BagLeafIcon className="h-10 w-10" animated={animated} />
        <span className="font-display text-3xl font-semibold tracking-[0.14em]">VIORA</span>
      </div>
      {showTagline && (
        <p className={`mt-2 text-sm ${tone === 'olive' ? 'text-viora-muted' : 'text-viora-sage-soft'}`}>{TAGLINE}</p>
      )}
    </div>
  );
}
