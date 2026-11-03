
import React from "react";

export interface ProductFilters {
  category_id: number | "";
  min_price: string;
  max_price: string;
  in_stock: boolean | null;
}

interface ProductFilterProps {
  filters: ProductFilters;
  onChange: (filters: ProductFilters) => void;
}

const ProductFilter: React.FC<ProductFilterProps> = ({
  filters,
  onChange,
}) => {
  const updateFilter = <K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K]
  ) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-[#E5E2D8] bg-[#FDFCFA] px-4 py-3 text-sm text-[#252A20] outline-none transition placeholder:text-[#9A9C92] focus:border-[#5F6B3A] focus:ring-2 focus:ring-[#5F6B3A]/15";

  const labelClass =
    "text-sm font-semibold text-[#343A20]";

  return (
    <aside className="rounded-2xl border border-[#E5E2D8] bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#252A20]">
            Refine Products
          </h3>
          <p className="mt-1 text-xs text-[#6C7065]">
            Find exactly what you're looking for
          </p>
        </div>

        <span className="rounded-xl bg-[#E8EAD9] p-3 text-[#5F6B3A]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 7h16M7 12h10m-7 5h4" />
          </svg>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="category_id" className={labelClass}>
            Category ID
          </label>
          <input
            id="category_id"
            type="number"
            min="1"
            value={filters.category_id}
            onChange={(event) =>
              updateFilter(
                "category_id",
                event.target.value === ""
                  ? ""
                  : Number(event.target.value)
              )
            }
            placeholder="Enter category ID"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="min_price" className={labelClass}>
            Minimum Price
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#6C7065]">
              ₹
            </span>
            <input
              id="min_price"
              type="number"
              min="0"
              step="0.01"
              value={filters.min_price}
              onChange={(event) =>
                updateFilter("min_price", event.target.value)
              }
              placeholder="0.00"
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="max_price" className={labelClass}>
            Maximum Price
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#6C7065]">
              ₹
            </span>
            <input
              id="max_price"
              type="number"
              min="0"
              step="0.01"
              value={filters.max_price}
              onChange={(event) =>
                updateFilter("max_price", event.target.value)
              }
              placeholder="Any price"
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="in_stock" className={labelClass}>
            Availability
          </label>
          <select
            id="in_stock"
            value={
              filters.in_stock === null
                ? "all"
                : filters.in_stock
                  ? "in_stock"
                  : "out_of_stock"
            }
            onChange={(event) => {
              const value = event.target.value;

              updateFilter(
                "in_stock",
                value === "all"
                  ? null
                  : value === "in_stock"
              );
            }}
            className={inputClass}
          >
            <option value="all">All Products</option>
            <option value="in_stock">In Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex justify-end border-t border-[#E5E2D8] pt-5">
        <button
          type="button"
          onClick={() =>
            onChange({
              category_id: "",
              min_price: "",
              max_price: "",
              in_stock: null,
            })
          }
          className="rounded-xl border border-[#5F6B3A] px-5 py-2.5 text-sm font-semibold text-[#5F6B3A] transition hover:bg-[#E8EAD9]"
        >
          Clear all filters
        </button>
      </div>
    </aside>
  );
};

export default ProductFilter;
