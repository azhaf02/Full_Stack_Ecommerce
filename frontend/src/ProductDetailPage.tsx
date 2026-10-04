import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Product, ProductImage } from "./types/product";
import { getProductById } from "./services/productService";

function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] =
    useState<ProductImage | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [imageChanging, setImageChanging] = useState(false);
  const [wishlistAdded, setWishlistAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");
        setSelectedImage(null);
        setQuantity(1);
        setWishlistAdded(false);

        const data: Product = await getProductById(id!);

        setProduct(data);

        if (data.images.length > 0) {
          const primaryImage =
            data.images.find((image) => image.is_primary) ||
            data.images[0];

          setSelectedImage(primaryImage);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load product details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const changeImage = (image: ProductImage) => {
    if (selectedImage?.id === image.id) return;

    setImageChanging(true);

    setTimeout(() => {
      setSelectedImage(image);
      setImageChanging(false);
    }, 180);
  };

  const increaseQuantity = () => {
    if (!product) return;

    setQuantity((current) =>
      Math.min(current + 1, product.stock_quantity)
    );
  };

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(current - 1, 1));
  };

  if (loading) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{
          minHeight: "100vh",
          backgroundColor: "#F8F7F2",
        }}
      >
        <div className="text-center">
          <div
            className="spinner-border mb-3"
            role="status"
            style={{
              width: "2.5rem",
              height: "2.5rem",
              color: "#5F6B3A",
            }}
          />

          <p
            className="mb-0"
            style={{
              color: "#6C7065",
              fontSize: "14px",
            }}
          >
            Loading product...
          </p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{
          minHeight: "100vh",
          backgroundColor: "#F8F7F2",
          padding: "24px",
        }}
      >
        <div
          className="text-center"
          style={{
            width: "100%",
            maxWidth: "430px",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E2D8",
            borderRadius: "18px",
            padding: "40px 32px",
            boxShadow: "0 10px 30px rgba(37, 42, 32, 0.06)",
            animation: "productFadeUp 0.45s ease both",
          }}
        >
          <div
            style={{
              width: "58px",
              height: "58px",
              margin: "0 auto 18px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#FFE6E6",
              color: "#DC3545",
              fontSize: "25px",
              fontWeight: 700,
            }}
          >
            !
          </div>

          <h3
            style={{
              marginBottom: "10px",
              color: "#252A20",
              fontWeight: 700,
            }}
          >
            Product not found
          </h3>

          <p
            style={{
              marginBottom: "24px",
              color: "#6C7065",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            {error || "The requested product could not be found."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              border: "none",
              borderRadius: "9px",
              padding: "11px 24px",
              backgroundColor: "#5F6B3A",
              color: "#FFFFFF",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const isInStock = product.stock_status !== "out_of_stock";
  const isLowStock = product.stock_status === "low_stock";

  const selectedImageUrl =
    selectedImage?.image_url || null;

  return (
    <>
      <style>
        {`
          @keyframes productFadeUp {
            from {
              opacity: 0;
              transform: translateY(14px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes imageFade {
            from {
              opacity: 0;
              transform: scale(0.97);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes heartPop {
            0% {
              transform: scale(1);
            }
            45% {
              transform: scale(1.25);
            }
            100% {
              transform: scale(1);
            }
          }

          .product-page {
            min-height: 100vh;
            background: #F8F7F2;
            color: #252A20;
            animation: productFadeUp 0.45s ease both;
          }

          .product-container {
            width: min(1180px, calc(100% - 32px));
            margin: 0 auto;
            padding: 28px 0 60px;
          }

          .product-breadcrumb {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 24px;
            font-size: 13px;
            color: #6C7065;
          }

          .product-breadcrumb-home {
            color: #5F6B3A;
            font-weight: 600;
            cursor: pointer;
          }

          .product-main {
            display: grid;
            grid-template-columns: minmax(0, 1.08fr) minmax(380px, 0.92fr);
            gap: 34px;
            align-items: start;
          }

          .gallery-panel {
            background: #FFFFFF;
            border: 1px solid #E5E2D8;
            border-radius: 18px;
            padding: 18px;
            box-shadow: 0 8px 28px rgba(37, 42, 32, 0.055);
          }

          .main-image-wrapper {
            position: relative;
            width: 100%;
            height: 500px;
            overflow: hidden;
            border-radius: 14px;
            background: #F8F7F2;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .main-product-image {
            width: 100%;
            height: 100%;
            object-fit: contain;
            padding: 18px;
            transition:
              transform 0.35s ease,
              opacity 0.18s ease;
            animation: imageFade 0.35s ease both;
          }

          .main-product-image:hover {
            transform: scale(1.035);
          }

          .thumbnail-row {
            display: flex;
            gap: 10px;
            margin-top: 14px;
            overflow-x: auto;
            padding: 2px;
          }

          .thumbnail-button {
            flex: 0 0 72px;
            width: 72px;
            height: 72px;
            padding: 3px;
            border: 2px solid #E5E2D8;
            border-radius: 10px;
            background: #FFFFFF;
            cursor: pointer;
            transition:
              border-color 0.2s ease,
              transform 0.2s ease,
              box-shadow 0.2s ease;
          }

          .thumbnail-button:hover {
            transform: translateY(-2px);
            border-color: #7A8450;
          }

          .thumbnail-button.selected {
            border-color: #5F6B3A;
            box-shadow: 0 0 0 2px #E8EAD9;
          }

          .thumbnail-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 6px;
          }

          .no-image {
            color: #6C7065;
            font-size: 14px;
          }

          .details-panel {
            position: sticky;
            top: 24px;
            background: #FFFFFF;
            border: 1px solid #E5E2D8;
            border-radius: 18px;
            padding: 30px;
            box-shadow: 0 8px 28px rgba(37, 42, 32, 0.055);
          }

          .category-badge {
            display: inline-flex;
            align-items: center;
            padding: 6px 11px;
            border-radius: 999px;
            background: #E8EAD9;
            color: #5F6B3A;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.7px;
            text-transform: uppercase;
            margin-bottom: 14px;
          }

          .product-title {
            margin: 0;
            color: #252A20;
            font-size: clamp(28px, 4vw, 40px);
            line-height: 1.16;
            font-weight: 750;
            letter-spacing: -0.5px;
          }

          .product-price {
            margin-top: 15px;
            color: #5F6B3A;
            font-size: 30px;
            line-height: 1;
            font-weight: 750;
          }

          .availability-row {
            display: flex;
            align-items: center;
            gap: 9px;
            margin-top: 14px;
            font-size: 13px;
          }

          .availability-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }

          .description-section {
            margin-top: 25px;
            padding-top: 22px;
            border-top: 1px solid #E5E2D8;
          }

          .section-label {
            margin-bottom: 8px;
            color: #252A20;
            font-size: 14px;
            font-weight: 700;
          }

          .description-text {
            margin: 0;
            color: #6C7065;
            font-size: 14px;
            line-height: 1.75;
          }

          .purchase-row {
            display: flex;
            gap: 10px;
            margin-top: 25px;
          }

          .quantity-control {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 118px;
            height: 48px;
            border: 1px solid #E5E2D8;
            border-radius: 9px;
            background: #FFFFFF;
            overflow: hidden;
          }

          .quantity-button {
            width: 38px;
            height: 100%;
            border: none;
            background: transparent;
            color: #5F6B3A;
            font-size: 18px;
            cursor: pointer;
          }

          .quantity-button:hover {
            background: #E8EAD9;
          }

          .quantity-value {
            color: #252A20;
            font-weight: 700;
            font-size: 14px;
          }

          .cart-button {
            flex: 1;
            height: 48px;
            border: none;
            border-radius: 9px;
            background: #5F6B3A;
            color: #FFFFFF;
            font-weight: 700;
            cursor: pointer;
            transition:
              background 0.2s ease,
              transform 0.2s ease,
              box-shadow 0.2s ease;
          }

          .cart-button:hover:not(:disabled) {
            background: #4D572F;
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(95, 107, 58, 0.2);
          }

          .cart-button:disabled {
            background: #6C757D;
            cursor: not-allowed;
          }

          .wishlist-button {
            width: 48px;
            height: 48px;
            border: 1px solid #5F6B3A;
            border-radius: 9px;
            background: #FFFFFF;
            color: #5F6B3A;
            font-size: 21px;
            cursor: pointer;
            transition:
              background 0.2s ease,
              transform 0.2s ease;
          }

          .wishlist-button:hover {
            background: #E8EAD9;
            transform: translateY(-1px);
          }

          .wishlist-button.added {
            background: #E8EAD9;
            animation: heartPop 0.3s ease;
          }

          .product-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 20px;
          }

          .meta-item {
            padding: 12px;
            border-radius: 10px;
            background: #F8F7F2;
          }

          .meta-label {
            display: block;
            margin-bottom: 4px;
            color: #6C7065;
            font-size: 11px;
          }

          .meta-value {
            color: #252A20;
            font-size: 13px;
            font-weight: 700;
          }

          .related-section {
            margin-top: 42px;
          }

          .related-heading {
            display: flex;
            align-items: end;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 17px;
          }

          .related-title {
            margin: 0;
            color: #252A20;
            font-size: 22px;
            font-weight: 750;
          }

          .related-subtitle {
            margin: 4px 0 0;
            color: #6C7065;
            font-size: 13px;
          }

          .related-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 16px;
          }

          .related-card {
            background: #FFFFFF;
            border: 1px solid #E5E2D8;
            border-radius: 14px;
            padding: 14px;
            cursor: pointer;
            transition:
              transform 0.22s ease,
              box-shadow 0.22s ease,
              border-color 0.22s ease;
          }

          .related-card:hover {
            transform: translateY(-5px);
            border-color: #C8CCB5;
            box-shadow: 0 12px 25px rgba(37, 42, 32, 0.08);
          }

          .related-image {
            height: 145px;
            border-radius: 10px;
            background: #F8F7F2;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }

          .related-image-placeholder {
            color: #7A8450;
            font-size: 12px;
            font-weight: 600;
          }

          .related-name {
            margin: 13px 0 6px;
            color: #252A20;
            font-size: 14px;
            font-weight: 650;
            line-height: 1.4;
          }

          .related-price {
            margin: 0;
            color: #5F6B3A;
            font-size: 16px;
            font-weight: 750;
          }

          @media (max-width: 900px) {
            .product-main {
              grid-template-columns: 1fr;
            }

            .details-panel {
              position: static;
            }

            .related-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 576px) {
            .product-container {
              width: min(100% - 20px, 1180px);
              padding-top: 18px;
            }

            .gallery-panel {
              padding: 10px;
              border-radius: 14px;
            }

            .main-image-wrapper {
              height: 330px;
            }

            .details-panel {
              padding: 21px;
              border-radius: 14px;
            }

            .purchase-row {
              flex-wrap: wrap;
            }

            .quantity-control {
              width: 105px;
            }

            .cart-button {
              min-width: 0;
            }

            .product-meta {
              grid-template-columns: 1fr;
            }

            .related-grid {
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }

            .related-card {
              padding: 10px;
            }

            .related-image {
              height: 115px;
            }
          }
        `}
      </style>

      <div className="product-page">
        <div className="product-container">

          {/* Breadcrumb */}
          <div className="product-breadcrumb">
            <span
              className="product-breadcrumb-home"
              onClick={() => navigate("/")}
            >
              Home
            </span>

            <span>/</span>

            <span>Products</span>

            <span>/</span>

            <span style={{ color: "#252A20" }}>
              {product.name}
            </span>
          </div>

          {/* Main Product Area */}
          <div className="product-main">

            {/* Gallery */}
            <div className="gallery-panel">
              <div className="main-image-wrapper">
                {selectedImageUrl ? (
<div className="main-image-wrapper">
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#F8F7F2",
      color: "#333",
    }}
  >
    <div style={{ fontSize: "64px", marginBottom: "20px" }}>👕</div>
    <div style={{ fontSize: "28px", fontWeight: 700 }}>
      {product.name}
    </div>
    <div style={{ marginTop: "8px", color: "#777" }}>
      Product Image
    </div>
  </div>
</div>
                ) : (
                  <div className="no-image">
                    No image available
                  </div>
                )}
              </div>

              {product.images.length > 0 && (
                <div className="thumbnail-row">
                  {product.images.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      className={`thumbnail-button ${
                        selectedImage?.id === image.id
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => changeImage(image)}
                    >
                      <img
                        src={image.image_url}
                        alt={`${product.name} thumbnail`}
                        className="thumbnail-image"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="details-panel">
              {product.category_name && (
                <div className="category-badge">
                  {product.category_name}
                </div>
              )}

              <h1 className="product-title">
                {product.name}
              </h1>

              <div className="product-price">
                ₹{Number(product.price).toFixed(2)}
              </div>

              <div className="availability-row">
                <span
                  className="availability-dot"
                  style={{
                    backgroundColor: isInStock
                      ? "#198754"
                      : "#DC3545",
                  }}
                />

                <span
                  style={{
                    color: isInStock
                      ? "#198754"
                      : "#DC3545",
                    fontWeight: 600,
                  }}
                >
                  {product.stock_status === "in_stock" &&
                    `${product.stock_quantity} units available`}

                  {isLowStock &&
                    `Only ${product.stock_quantity} units left - Low Stock`}

                  {product.stock_status === "out_of_stock" &&
                    "Currently out of stock"}
                </span>
              </div>

              {isLowStock && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    marginTop: "10px",
                    padding: "5px 10px",
                    borderRadius: "999px",
                    backgroundColor: "#FFF3CD",
                    color: "#856404",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  Low Stock
                </div>
              )}
              {/* Description */}
              <div className="description-section">
                <div className="section-label">
                  Description
                </div>

                <p className="description-text">
                  {product.description ||
                    "No description available for this product."}
                </p>
              </div>

              {/* Purchase Controls */}
              <div className="purchase-row">
                <div className="quantity-control">
                  <button
                    type="button"
                    className="quantity-button"
                    onClick={decreaseQuantity}
                    disabled={!isInStock}
                  >
                    −
                  </button>

                  <span className="quantity-value">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    className="quantity-button"
                    onClick={increaseQuantity}
                    disabled={
                      !isInStock ||
                      quantity >= product.stock_quantity
                    }
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="cart-button"
                  disabled={!isInStock}
                >
                  Add to Cart
                </button>

                <button
                  type="button"
                  className={`wishlist-button ${
                    wishlistAdded ? "added" : ""
                  }`}
                  onClick={() =>
                    setWishlistAdded((current) => !current)
                  }
                  aria-label="Add to wishlist"
                >
                  {wishlistAdded ? "♥" : "♡"}
                </button>
              </div>

              {/* Small Product Information */}
              <div className="product-meta">
                <div className="meta-item">
                  <span className="meta-label">
                    Product ID
                  </span>

                  <span className="meta-value">
                    #{product.id}
                  </span>
                </div>

                <div className="meta-item">
                  <span className="meta-label">
                    Status
                  </span>

                  <span
                    className="meta-value"
                    style={{
                      color:
                        product.status === "ACTIVE"
                          ? "#198754"
                          : "#6C757D",
                    }}
                  >
                    {product.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {product.related_products.length > 0 && (
            <section className="related-section">
              <div className="related-heading">
                <div>
                  <h2 className="related-title">
                    You may also like
                  </h2>

                  <p className="related-subtitle">
                    More products from the same category
                  </p>
                </div>
              </div>

              <div className="related-grid">
                {product.related_products.map(
                  (relatedProduct) => (
                    <div
                      key={relatedProduct.id}
                      className="related-card"
                      onClick={() =>
                        navigate(
                          `/products/${relatedProduct.id}`
                        )
                      }
                    >
                      <div className="related-image">
                        <span className="related-image-placeholder">
                          Product
                        </span>
                      </div>

                      <h3 className="related-name">
                        {relatedProduct.name}
                      </h3>

                      <p className="related-price">
                        ₹
                        {Number(
                          relatedProduct.price
                        ).toFixed(2)}
                      </p>
                    </div>
                  )
                )}
              </div>
            </section>
          )}

        </div>
      </div>
    </>
  );
}

export default ProductDetailPage;
