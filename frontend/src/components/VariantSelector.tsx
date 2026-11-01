import { useEffect, useState } from "react";

interface ProductVariant {
  id: number;
  product_id: number;
  attribute_name: string;
  attribute_value: string;
  price_delta: number;
  stock: number;
}

interface VariantSelectorProps {
  productId: number;
  basePrice: number;
  onVariantChange: (variant: ProductVariant | null) => void;
}

const API_URL = "http://127.0.0.1:8000";

function VariantSelector({
  productId,
  basePrice,
  onVariantChange,
}: VariantSelectorProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVariants = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/products/${productId}/variants`
        );

        if (!response.ok) {
          throw new Error("Failed to load variants");
        }

        const data: ProductVariant[] = await response.json();
        setVariants(data);

        const firstAvailable = data.find((variant) => variant.stock > 0);

        if (firstAvailable) {
          setSelectedVariant(firstAvailable);
          onVariantChange(firstAvailable);
        } else {
          setSelectedVariant(null);
          onVariantChange(null);
        }
      } catch (err) {
        setError("Unable to load product variants.");
        onVariantChange(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVariants();
  }, [productId, onVariantChange]);

  const handleVariantSelect = (variant: ProductVariant) => {
    if (variant.stock <= 0) {
      return;
    }

    setSelectedVariant(variant);
    onVariantChange(variant);
  };

  if (loading) {
    return (
      <div style={{ marginTop: "20px" }}>
        <strong>Loading sizes...</strong>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ marginTop: "20px", color: "#DC3545" }}>
        {error}
      </div>
    );
  }

  if (variants.length === 0) {
    return null;
  }

  const selectedPrice = selectedVariant
    ? basePrice + selectedVariant.price_delta
    : basePrice;

  return (
    <div style={{ marginTop: "24px" }}>
      <div
        style={{
          fontSize: "16px",
          fontWeight: 600,
          marginBottom: "12px",
          color: "#252A20",
        }}
      >
        {variants[0].attribute_name}
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        {variants.map((variant) => {
          const isSelected = selectedVariant?.id === variant.id;
          const isOutOfStock = variant.stock <= 0;

          return (
            <button
              key={variant.id}
              type="button"
              disabled={isOutOfStock}
              onClick={() => handleVariantSelect(variant)}
              style={{
                minWidth: "60px",
                padding: "10px 16px",
                borderRadius: "8px",
                border: isSelected
                  ? "2px solid #5F6B3A"
                  : "1px solid #E5E2D8",
                backgroundColor: isOutOfStock
                  ? "#F1F1F1"
                  : isSelected
                  ? "#E8EAD9"
                  : "#FFFFFF",
                color: isOutOfStock ? "#999999" : "#252A20",
                cursor: isOutOfStock ? "not-allowed" : "pointer",
                fontWeight: isSelected ? 600 : 500,
                textDecoration: isOutOfStock ? "line-through" : "none",
              }}
            >
              {variant.attribute_value}
            </button>
          );
        })}
      </div>

      {selectedVariant && (
        <div style={{ marginTop: "14px", color: "#6C7065" }}>
          <div>
            Price: <strong>₹{selectedPrice.toFixed(2)}</strong>
          </div>

          <div>
            {selectedVariant.stock} available
          </div>
        </div>
      )}

      {!selectedVariant && (
        <div style={{ marginTop: "14px", color: "#DC3545" }}>
          No variant is currently available.
        </div>
      )}
    </div>
  );
}

export default VariantSelector;