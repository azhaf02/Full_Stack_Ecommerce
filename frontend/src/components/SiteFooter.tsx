import { Link } from 'react-router-dom';
import { BagLeafIcon, TAGLINE } from './BrandLogo';

export default function SiteFooter() {
  return (
    <footer className="bg-viora-ink text-viora-sage-soft">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 text-viora-cream">
            <BagLeafIcon className="h-9 w-9 [--leaf-vein:#23291c]" />
            <span className="font-display text-2xl font-semibold tracking-[0.14em]">VIORA</span>
          </div>
          <p className="mt-3 max-w-xs text-sm">{TAGLINE}</p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-viora-cream">Shop</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/products" className="text-viora-sage-soft no-underline hover:text-white">All products</Link></li>
            <li><a href="/#categories" className="text-viora-sage-soft no-underline hover:text-white">Categories</a></li>
            <li><Link to="/cart" className="text-viora-sage-soft no-underline hover:text-white">Cart</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-viora-cream">Account</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/login" className="text-viora-sage-soft no-underline hover:text-white">Log in</Link></li>
            <li><Link to="/register" className="text-viora-sage-soft no-underline hover:text-white">Create account</Link></li>
            <li><Link to="/profile" className="text-viora-sage-soft no-underline hover:text-white">My profile</Link></li>
          </ul>
        </div>
      </div>
      <p className="border-t border-white/10 py-5 text-center text-xs text-viora-sage-soft/70">© {new Date().getFullYear()} VIORA</p>
    </footer>
  );
}
