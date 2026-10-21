import { useEffect, useState } from "react";
import {
  Category,
  createCategory,
  deactivateCategory,
  getCategories,
  updateCategory,
} from "../../services/adminService";


interface CategoryFormData {
  name: string;
  description: string;
}



export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(
    null
  );

  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
  });

const fetchCategories = async () => {
  try {
    setLoading(true);
    setError("");

    const data = await getCategories(true);
    setCategories(data);
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Something went wrong"
    );
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddForm = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
    });
    setIsFormOpen(true);
    setError("");
  };

  const openEditForm = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description ?? "",
    });
    setIsFormOpen(true);
    setError("");
  };

  const closeForm = () => {
    if (saving) return;

    setIsFormOpen(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
    });
  };

  const handleInputChange = (
    field: keyof CategoryFormData,
    value: string
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

 const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  if (formData.name.trim().length < 2) {
    setError("Category name must contain at least 2 characters.");
    return;
  }

  try {
    setSaving(true);
    setError("");

    const data = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
    };

    if (editingCategory) {
      await updateCategory(editingCategory.id, data);
    } else {
      await createCategory(data);
    }

    closeForm();
    await fetchCategories();
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Something went wrong"
    );
  } finally {
    setSaving(false);
  }
};

  const handleDeactivate = async (category: Category) => {
  const confirmed = window.confirm(
    `Are you sure you want to deactivate "${category.name}"?`
  );

  if (!confirmed) return;

  try {
    setError("");

    await deactivateCategory(category.id);

    await fetchCategories();
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Something went wrong"
    );
  }
};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Categories
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create, edit and manage product categories.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
        >
          + Add Category
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      {isFormOpen && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingCategory ? "Edit Category" : "Add Category"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {editingCategory
                ? "Update the category details."
                : "Create a new product category."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Category Name
              </label>

              <input
                type="text"
                value={formData.name}
                onChange={(event) =>
                  handleInputChange("name", event.target.value)
                }
                placeholder="e.g. Electronics"
                maxLength={100}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Description
              </label>

              <textarea
                value={formData.description}
                onChange={(event) =>
                  handleInputChange("description", event.target.value)
                }
                placeholder="Describe this category..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingCategory
                  ? "Update Category"
                  : "Create Category"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-gray-700">
              No categories found
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Create your first category to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {category.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {category.id}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="max-w-md text-sm text-gray-600">
                        {category.description || "No description"}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          category.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {category.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(category)}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>

                        {category.is_active && (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(category)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
  </div>
    </div>
  );
}