export interface ProductImage {
  id: number;
  image_url: string;
  is_primary: boolean;
}

export interface RelatedProduct {
  id: number;
  name: string;
  price: number;
  status: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  stock_status: "in_stock" | "low_stock" | "out_of_stock";
  status: string;
  category_id: number;
  category_name: string | null;
  images: ProductImage[];
  related_products: RelatedProduct[];
}