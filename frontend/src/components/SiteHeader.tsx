import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BagLeafIcon } from './BrandLogo';
import { useAuth } from '../hooks/useAuth';
import SearchBar from "../components/SearchBar.tsx";

const navLink = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium no-underline transition hover:text-viora-olive ${isActive ? 'text-viora-olive' : 'text-viora-ink'}`;

const mobileLink =
  'block rounded-xl px-4 py-3 text-base font-medium text-viora-ink no-underline hover:bg-viora-sage-soft';

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      {open ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8h12l1 12H5L6 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export default function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!overlay) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [overlay]);

  const transparent = overlay && !scrolled && !open;

  useEffect(() => setOpen(false), [location.pathname]);

  async function handleLogout() {
    setOpen(false);
    await logout();
    navigate('/', { replace: true });
  }

  return (
    <header
      className={`${overlay ? 'fixed inset-x-0' : 'sticky'} top-0 z-30 transition-colors duration-300 ${
        transparent ? 'border-b border-transparent bg-transparent text-viora-cream [&_a]:text-viora-cream [&_button]:text-viora-cream' : 'border-b border-viora-sage/40 bg-viora-cream/95 backdrop-blur-md text-viora-ink shadow-sm'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <Link to="/" className="flex shrink-0 items-center gap-2 text-viora-olive no-underline" aria-label="GRABBY home">
          <BagLeafIcon className="h-8 w-8 [--leaf-vein:#f4f4ee]" />
          <span className="font-display text-xl font-semibold tracking-[0.14em]">GRABBY</span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          <NavLink to="/" end className={navLink}>Home</NavLink>
          <NavLink to="/products" className={navLink}>Shop</NavLink>
          <a href="/#categories" className="text-sm font-medium text-viora-ink no-underline hover:text-viora-olive">Categories</a>
        </nav>

        {/* Desktop search */}
        <div className="hidden min-w-0 max-w-sm flex-1 md:block">
          <SearchBar />
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link to="/cart" className="flex h-11 w-11 items-center justify-center rounded-xl text-viora-ink no-underline hover:bg-viora-sage-soft" aria-label="Cart">
            <CartIcon />
          </Link>

          {/* Desktop account buttons */}
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <Link to="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-viora-ink no-underline hover:bg-viora-sage-soft">
                  Dashboard
                </Link>
                <Link to="/profile" className="rounded-lg px-3 py-2 text-sm font-medium text-viora-ink no-underline hover:bg-viora-sage-soft">
                  Hi, {user.name ? user.name.split(' ')[0] : 'User'}
                </Link>
                <button type="button" onClick={handleLogout} className="rounded-lg border border-viora-olive/40 bg-white px-3 py-2 text-sm font-medium text-viora-ink hover:bg-viora-sage-soft">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-viora-ink no-underline hover:bg-viora-sage-soft">Log in</Link>
                <Link to="/register" className="rounded-lg bg-viora-olive px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-viora-olive-dark">Sign up</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border-0 bg-transparent p-0 text-viora-ink hover:bg-viora-sage-soft md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="viora-rise border-t border-viora-sage/50 bg-viora-cream px-4 pb-5 pt-2 md:hidden">
          <div className="mb-3">
            <SearchBar />
          </div>
          <Link to="/" className={mobileLink}>Home</Link>
          <Link to="/products" className={mobileLink}>Shop</Link>
          <a href="/#categories" onClick={() => setOpen(false)} className={mobileLink}>Categories</a>
          <div className="my-3 h-px bg-viora-sage/50" />
          {user ? (
            <>
              <Link to="/dashboard" className={mobileLink}>Dashboard</Link>
              <Link to="/profile" className={mobileLink}>My profile</Link>
              <button type="button" onClick={handleLogout} className={`${mobileLink} w-full border-0 bg-transparent text-left`}>
                Log out
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3 px-1 pt-1">
              <Link to="/login" className="rounded-xl border border-viora-olive/40 py-3 text-center font-semibold text-viora-olive no-underline">Log in</Link>
              <Link to="/register" className="rounded-xl bg-viora-olive py-3 text-center font-semibold text-white no-underline">Sign up</Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}