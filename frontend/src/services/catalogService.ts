import apiClient, { API_BASE_URL } from './apiClient';

// Shapes are kept loose because the Catalog module (Chandani) owns these APIs.
export interface HomeProduct {
  id: number | string;
  name: string;
  price: number | null;
  image: string | null;
}

export interface HomeCategory {
  id: number | string;
  name: string;
  slug?: string;
}

type AnyRecord = Record<string, unknown>;

// Accepts [..], {items:[..]}, {products:[..]}, {data:[..]}, {results:[..]}
function toList(data: unknown, key: string): AnyRecord[] {
  if (Array.isArray(data)) return data as AnyRecord[];
  if (data && typeof data === 'object') {
    const obj = data as AnyRecord;
    for (const k of [key, 'items', 'data', 'results']) {
      if (Array.isArray(obj[k])) return obj[k] as AnyRecord[];
    }
  }
  return [];
}

// Catalog stores images as paths like "/uploads/file.png", so prefix the backend URL
function resolveImage(path: string): string {
  if (/^https?:\/\//.test(path) || path.startsWith('data:')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

const IMAGE_KEYS = ['image_url', 'image_path', 'image', 'thumbnail', 'primary_image', 'url', 'path', 'file_path'];

function imageFrom(value: unknown): string | null {
  if (typeof value === 'string' && value) return value;
  if (value && typeof value === 'object') {
    const obj = value as AnyRecord;
    for (const k of IMAGE_KEYS) {
      if (typeof obj[k] === 'string' && obj[k]) return obj[k] as string;
    }
  }
  return null;
}

function pickImage(p: AnyRecord): string | null {
  for (const k of IMAGE_KEYS) {
    const found = imageFrom(p[k]);
    if (found) return resolveImage(found);
  }
  for (const k of ['images', 'product_images']) {
    const list = p[k];
    if (Array.isArray(list) && list.length > 0) {
      // prefer the image marked as primary, otherwise the first one
      const primary = (list as AnyRecord[]).find((img) => img && typeof img === 'object' && img.is_primary) ?? list[0];
      const found = imageFrom(primary);
      if (found) return resolveImage(found);
    }
  }
  return null;
}

export const catalogService = {
  async featuredProducts(limit = 8): Promise<HomeProduct[]> {
    const res = await apiClient.get('/api/products', { params: { page: 1 } });
    return toList(res.data, 'products')
      .slice(0, limit)
      .map((p) => ({
        id: (p.id as number | string) ?? String(p.name),
        name: String(p.name ?? 'Product'),
        price: p.price != null ? Number(p.price) : null,
        image: pickImage(p),
      }));
  },

  async categories(limit = 6): Promise<HomeCategory[]> {
    const res = await apiClient.get('/api/categories');
    return toList(res.data, 'categories')
      .slice(0, limit)
      .map((c) => ({
        id: (c.id as number | string) ?? String(c.name),
        name: String(c.name ?? 'Category'),
        slug: typeof c.slug === 'string' ? c.slug : undefined,
      }));
  },
};

export function formatPrice(value: number | null): string {
  if (value == null || Number.isNaN(value)) return '';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}