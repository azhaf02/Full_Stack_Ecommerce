
import { useEffect, useState } from "react";
import axios from "axios";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import {
  createFaq,
  deleteFaq,
  getFaqs,
  updateFaq,
} from "../../services/adminService";
import type { Faq, FaqData } from "../../services/adminService";

const EMPTY: FaqData = {
  question: "",
  answer: "",
  sort_order: 0,
};

const sortFaqs = (list: Faq[]) =>
  [...list].sort(
    (a, b) => a.sort_order - b.sort_order || a.id - b.id
  );

const errorText = (err: unknown, fallback: string) => {
  const detail = axios.isAxiosError(err)
    ? err.response?.data?.detail
    : null;

  return typeof detail === "string" ? detail : fallback;
};

export default function AdminFaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<Faq | null>(null);
  const [form, setForm] = useState<FaqData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleting, setDeleting] = useState<Faq | null>(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadFaqs = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getFaqs();
        if (!cancelled) setFaqs(sortFaqs(data));
      } catch {
        if (!cancelled) {
          setError("Could not load FAQs. Check that the backend is running.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadFaqs();

    return () => {
      cancelled = true;
    };
  }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({
      ...EMPTY,
      sort_order: faqs.length
        ? Math.max(...faqs.map((faq) => faq.sort_order)) + 1
        : 0,
    });
    setFormError("");
  };

  const startEdit = (faq: Faq) => {
    setEditing(faq);
    setForm({
      question: faq.question,
      answer: faq.answer,
      sort_order: faq.sort_order,
    });
    setFormError("");
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const data: FaqData = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      sort_order: Number(form.sort_order) || 0,
    };

    if (data.question.length < 5) {
      setFormError("Please enter a question with at least 5 characters.");
      return;
    }

    if (!data.answer) {
      setFormError("Please enter an answer.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const saved = editing
        ? await updateFaq(editing.id, data)
        : await createFaq(data);

      setFaqs((current) =>
        sortFaqs(
          editing
            ? current.map((faq) =>
                faq.id === saved.id ? saved : faq
              )
            : [...current, saved]
        )
      );

      resetForm();
    } catch (err) {
      setFormError(errorText(err, "Could not save the FAQ. Try again."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;

    setSaving(true);
    setDeleteError("");

    try {
      await deleteFaq(deleting.id);
      setFaqs((current) =>
        current.filter((faq) => faq.id !== deleting.id)
      );
      setDeleting(null);
    } catch (err) {
      setDeleteError(errorText(err, "Could not delete the FAQ. Try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F2] -m-6 lg:-m-8 p-6 lg:p-8">
      <div className="mb-6 border-b border-[#E5E2D8] pb-4">
        <h2 className="text-xl font-bold text-[#263328]">
          FAQ Management Panel
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage public support questions and answers for your customers.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 items-start">
        {/* LEFT: ADD / EDIT FORM */}
        <section className="lg:col-span-2 rounded-xl border border-[#E5E2D8] bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            {editing ? (
              <Pencil size={18} className="text-[#5F6B3A]" />
            ) : (
              <Plus size={19} className="text-[#5F6B3A]" />
            )}

            <h3 className="font-bold text-[#394536]">
              {editing ? "Edit Support Article" : "Compose Fresh Article"}
            </h3>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Question Text
              </label>
              <input
                type="text"
                value={form.question}
                onChange={(e) =>
                  setForm({ ...form, question: e.target.value })
                }
                placeholder="Enter the FAQ question"
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#71804B] focus:ring-2 focus:ring-[#71804B]/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Answer
              </label>
              <textarea
                rows={5}
                value={form.answer}
                onChange={(e) =>
                  setForm({ ...form, answer: e.target.value })
                }
                placeholder="Write the answer for customers"
                required
                className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#71804B] focus:ring-2 focus:ring-[#71804B]/10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Sorting Order Rank
              </label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sort_order: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#71804B]"
              />
            </div>

            {formError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {formError}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#5F6B3A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4D5930] disabled:opacity-50"
              >
                <Save size={16} />
                {saving
                  ? "Saving..."
                  : editing
                    ? "Update Article"
                    : "Publish Article"}
              </button>

              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  <X size={16} />
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* RIGHT: FAQ LIST */}
        <section className="lg:col-span-3 rounded-xl border border-[#E5E2D8] bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-[#394536]">
                Active Public FAQ Repository
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Manage the questions displayed to customers.
              </p>
            </div>

            <span className="rounded-full bg-[#EDF0E5] px-3 py-1 text-xs font-semibold text-[#52613B]">
              {faqs.length} FAQs
            </span>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Loading FAQs...
            </p>
          ) : error ? (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          ) : faqs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 py-12 text-center">
              <p className="font-medium text-slate-600">
                No FAQs available yet.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Add your first FAQ using the form.
              </p>
            </div>
          ) : (
            <div className="max-h-[650px] space-y-3 overflow-y-auto pr-1">
              {faqs.map((faq) => (
                <article
                  key={faq.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-[#FAFAF8] p-4"
                >
                  <div className="min-w-0 flex-1">
                    <span className="mb-2 inline-block rounded bg-slate-200 px-2 py-1 font-mono text-[10px] text-slate-600">
                      Priority Rank: #{faq.sort_order}
                    </span>

                    <h4 className="text-sm font-bold leading-5 text-slate-800">
                      {faq.question}
                    </h4>

                    <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-500">
                      {faq.answer}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(faq)}
                      title="Edit FAQ"
                      className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-white hover:text-[#5F6B3A]"
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDeleting(faq);
                        setDeleteError("");
                      }}
                      title="Delete FAQ"
                      className="rounded-md border border-red-100 p-2 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {deleting && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">
                Delete this FAQ?
              </p>
              <p className="mt-1 text-xs text-red-600">
                {deleting.question}
              </p>

              {deleteError && (
                <p className="mt-2 text-xs text-red-700">{deleteError}</p>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? "Deleting..." : "Confirm Delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(null)}
                  disabled={saving}
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
