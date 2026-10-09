import '../viora-auth.css';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import BackgroundVideo from '../components/BackgroundVideo';
import Reveal from '../components/Reveal';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import { BagLeafIcon, TAGLINE } from '../components/BrandLogo';
import { useAuth } from '../hooks/useAuth';
import { catalogService, type HomeCategory, type HomeProduct } from '../services/catalogService';

// Videos live in frontend/public/videos
const HERO_VIDEO = '/videos/hero.mp4';
const STORY_VIDEO = '/videos/story.mp4';

const marqueeWords = ['New arrivals', 'Everyday essentials', 'Thoughtfully picked', 'Easy returns', 'Track every order'];

/* ---------- 1. full-screen hero with giant wordmark ---------- */
function Hero() {
  return (
    <section className="relative isolate flex h-[100svh] min-h-[560px] flex-col justify-end overflow-hidden bg-viora-olive-dark text-viora-cream">
      <BackgroundVideo src={HERO_VIDEO} className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-viora-ink/50 via-transparent to-viora-ink/80" />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 pb-8 text-left md:flex-row md:items-end md:justify-between md:pb-12">
        <p className="viora-rise max-w-sm text-base text-viora-sage-soft md:text-lg" style={{ animationDelay: '300ms' }}>
          {TAGLINE}. Essentials and small upgrades, picked with care.
        </p>
        <Link
          to="/products"
          className="viora-rise group inline-flex items-center gap-3 self-start text-sm font-semibold uppercase tracking-[0.25em] text-viora-cream no-underline md:self-auto"
          style={{ animationDelay: '400ms' }}
        >
          Discover the collection
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-2" aria-hidden="true">→</span>
        </Link>
      </div>

      {/* giant brand word across the bottom */}
      <h1 className="viora-wordmark select-none px-3 pb-2 text-center font-display font-semibold leading-[0.8] tracking-[0.06em] text-viora-cream">
        VIORA
      </h1>
    </section>
  );
}

/* ---------- 2. moving text strip ---------- */
function Marquee() {
  const row = (
    <div className="flex shrink-0 items-center gap-10 pr-10" aria-hidden="true">
      {marqueeWords.map((w) => (
        <span key={w} className="flex items-center gap-10 whitespace-nowrap font-display text-2xl italic md:text-3xl">
          {w}
          <BagLeafIcon className="h-6 w-6 [--leaf-vein:#3e4f22]" />
        </span>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden border-y border-viora-olive/20 bg-viora-sage-soft py-5 text-viora-olive-dark">
      <p className="sr-only">{marqueeWords.join(', ')}</p>
      <div className="viora-marquee flex w-max">
        {row}
        {row}
      </div>
    </div>
  );
}

/* ---------- 3. editorial statement ---------- */
function Statement() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-20 text-center md:py-32">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-viora-olive">The VIORA way</p>
        <p className="mt-6 font-display text-3xl leading-snug text-viora-ink md:text-5xl md:leading-tight">
          Fewer, better things. Chosen for how they feel, how long they last, and how easily they fit into your day.
        </p>
      </Reveal>
    </section>
  );
}

/* ---------- 4. editorial product grid: one large + four small ---------- */
function FeaturedProducts() {
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = () => {
    setStatus('loading');
    catalogService
      .featuredProducts(5)
      .then((p) => {
        setProducts(p);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  };
  useEffect(load, []);

  const [hero, ...rest] = products;

  return (
    <section id="shop" className="mx-auto max-w-7xl scroll-mt-24 px-5 text-left">
      <Reveal className="flex flex-wrap items-end justify-between gap-4 border-b border-viora-olive/20 pb-5">
        <h2 className="font-display text-4xl font-semibold text-viora-ink md:text-6xl">Fresh picks</h2>
        <Link to="/products" className="text-xs font-semibold uppercase tracking-[0.25em] text-viora-olive no-underline hover:underline">
          View all →
        </Link>
      </Reveal>

      {status === 'loading' && (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      )}

      {status === 'ready' && hero && (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Reveal>
            <ProductCard product={hero} />
          </Reveal>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8">
            {rest.map((p, i) => (
              <Reveal key={p.id} delay={(i + 1) * 90}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </div>
      )}

      {status === 'ready' && !hero && (
        <p className="mt-8 rounded-2xl border border-dashed border-viora-sage px-5 py-12 text-center text-viora-muted">
          New arrivals are on their way. Check back soon.
        </p>
      )}
      {status === 'error' && (
        <div role="alert" className="mt-8 rounded-2xl border border-viora-sage bg-white px-5 py-12 text-center text-viora-muted">
          Products could not be loaded right now.{' '}
          <button type="button" onClick={load} className="border-0 bg-transparent p-0 font-semibold text-viora-olive underline">
            Try again
          </button>
        </div>
      )}
    </section>
  );
}

/* ---------- 5. categories as an editorial index ---------- */
function CategoryIndex() {
  const [items, setItems] = useState<HomeCategory[]>([]);
  useEffect(() => {
    catalogService.categories(6).then(setItems).catch(() => setItems([]));
  }, []);
  if (items.length === 0) return null;

  return (
    <section id="categories" className="mx-auto max-w-7xl scroll-mt-24 px-5 pt-24 text-left md:pt-32">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-viora-olive">Shop by category</p>
      </Reveal>
      <ul className="mt-6 border-t border-viora-olive/20">
        {items.map((c, i) => (
          <Reveal key={c.id} delay={i * 60}>
            <li className="border-b border-viora-olive/20">
              <Link
                to={`/products?category=${encodeURIComponent(c.slug ?? String(c.id))}`}
                className="group flex items-baseline gap-5 py-5 text-viora-ink no-underline md:py-7"
              >
                <span className="w-8 text-sm text-viora-muted">{String(i + 1).padStart(2, '0')}</span>
                <span className="font-display text-3xl font-semibold transition-transform duration-300 group-hover:translate-x-3 group-hover:text-viora-olive md:text-5xl">
                  {c.name}
                </span>
                <span className="ml-auto text-2xl text-viora-olive opacity-0 transition duration-300 group-hover:opacity-100" aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

/* ---------- 6. full-width video band ---------- */
function VideoBand() {
  return (
    <section className="relative isolate mt-24 flex min-h-[70svh] items-center overflow-hidden bg-viora-olive text-viora-cream md:mt-32">
      <BackgroundVideo src={STORY_VIDEO} className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-viora-olive-dark/60" />
      <BagLeafIcon className="viora-float pointer-events-none absolute -left-10 bottom-0 -z-10 h-64 w-64 opacity-10 md:h-96 md:w-96" />
      <Reveal className="mx-auto w-full max-w-7xl px-5 py-20 text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-viora-sage">The VIORA edit</p>
        <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-tight md:text-6xl">
          One place for the things you reach for every day
        </h2>
        <Link
          to="/products"
          className="mt-10 inline-block rounded-full border border-viora-cream/70 px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-viora-cream no-underline transition hover:bg-viora-cream hover:text-viora-olive-dark"
        >
          Shop now
        </Link>
      </Reveal>
    </section>
  );
}

/* ---------- 7. account invite ---------- */
function AccountInvite() {
  const { user } = useAuth();
  if (user) return null;
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 text-center md:py-32">
      <Reveal>
        <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold text-viora-ink md:text-5xl">Join VIORA</h2>
        <p className="mx-auto mt-4 max-w-md text-viora-muted">Save addresses, track orders and check out in a few taps.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/register" className="rounded-full bg-viora-olive px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white no-underline transition hover:bg-viora-olive-dark">
            Create account
          </Link>
          <Link to="/login" className="rounded-full border border-viora-olive/40 px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-viora-olive no-underline transition hover:bg-viora-sage-soft">
            Log in
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

export default function HomePage() {
    const location = useLocation();
  useEffect(() => {
    if (location.pathname === '/products') {
      document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.pathname]);
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-viora-cream font-body text-viora-ink">
      <SiteHeader overlay />
      <main>
        <Hero />
        <Marquee />
        <Statement />
        <FeaturedProducts />
        <CategoryIndex />
        <VideoBand />
        <AccountInvite />
      </main>
      <div className={user ? 'mt-24' : ''}>
        <SiteFooter />
      </div>
    </div>
  );
}
