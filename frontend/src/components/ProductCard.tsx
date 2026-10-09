import { Link } from 'react-router-dom';
import { BagLeafIcon } from './BrandLogo';
import { formatPrice, type HomeProduct } from '../services/catalogService';

export default function ProductCard({ product }: { product: HomeProduct }) {
  return (
    <Link
      to={`/product/${product.id}`}
      className="group block rounded-2xl text-viora-ink no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-viora-olive"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-viora-sage-soft">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-viora-olive/40">
            <BagLeafIcon className="h-16 w-16" />
          </div>
        )}
      </div>
      <p className="mt-3 line-clamp-1 text-sm font-medium">{product.name}</p>
      {product.price != null && <p className="mt-0.5 text-sm font-semibold text-viora-olive">{formatPrice(product.price)}</p>}
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="aspect-[4/5] animate-pulse rounded-2xl bg-viora-sage-soft" />
      <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-viora-sage-soft" />
      <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-viora-sage-soft" />
    </div>
  );
}
