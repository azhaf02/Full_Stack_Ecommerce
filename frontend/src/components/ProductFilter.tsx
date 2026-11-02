import React from 'react';

export interface ProductFilters {
  category_id: number | '';
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
    value: ProductFilters[K],
  ) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <aside className="product-filter">
      <h3>Filter Products</h3>

      <div className="filter-group">
        <label htmlFor="category_id">Category ID</label>
        <input
          id="category_id"
          type="number"
          min="1"
          value={filters.category_id}
          onChange={(event) =>
            updateFilter(
              'category_id',
              event.target.value === ''
                ? ''
                : Number(event.target.value),
            )
          }
          placeholder="Enter category ID"
        />
      </div>

      <div className="filter-group">
        <label htmlFor="min_price">Minimum Price</label>
        <input
          id="min_price"
          type="number"
          min="0"
          step="0.01"
          value={filters.min_price}
          onChange={(event) =>
            updateFilter('min_price', event.target.value)
          }
          placeholder="Min price"
        />
      </div>

      <div className="filter-group">
        <label htmlFor="max_price">Maximum Price</label>
        <input
          id="max_price"
          type="number"
          min="0"
          step="0.01"
          value={filters.max_price}
          onChange={(event) =>
            updateFilter('max_price', event.target.value)
          }
          placeholder="Max price"
        />
      </div>

      <div className="filter-group">
        <label htmlFor="in_stock">Availability</label>
        <select
          id="in_stock"
          value={
            filters.in_stock === null
              ? 'all'
              : filters.in_stock
                ? 'in_stock'
                : 'out_of_stock'
          }
          onChange={(event) => {
            const value = event.target.value;

            updateFilter(
              'in_stock',
              value === 'all'
                ? null
                : value === 'in_stock',
            );
          }}
        >
          <option value="all">All Products</option>
          <option value="in_stock">In Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      <button
        type="button"
        onClick={() =>
          onChange({
            category_id: '',
            min_price: '',
            max_price: '',
            in_stock: null,
          })
        }
      >
        Clear Filters
      </button>
    </aside>
  );
};

export default ProductFilter;
