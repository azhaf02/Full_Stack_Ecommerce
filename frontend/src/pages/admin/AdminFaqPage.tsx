import { useEffect, useState } from "react";
import axios from "axios";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import LoadingRows from "../../components/admin/LoadingRows";
import Modal from "../../components/admin/Modal";
import { createFaq, deleteFaq, getFaqs, updateFaq } from "../../services/adminService";
import type { Faq, FaqData } from "../../services/adminService";

const EMPTY: FaqData = { question: "", answer: "", sort_order: 0 };

const errorText = (err: unknown, fallback: string) => {
  const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
  return typeof detail === "string" ? detail : fallback;
};

const sortFaqs = (list: Faq[]) => [...list].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);

export default function AdminFaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0); // changing this loads the list again
  const [openId, setOpenId] = useState<number | null>(null); // answer shown under the question

  // Add / edit popup (editing === null means "add")
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [form, setForm] = useState<FaqData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete popup
  const [deleting, setDeleting] = useState<Faq | null>(null);
  const [deleteError, setDeleteError] = useState("");

  // Load FAQs from GET /api/support/admin/faq
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getFaqs()
      .then((data) => {
        if (!cancelled) setFaqs(sortFaqs(data));
      })
      .catch(() => {
        if (!cancelled) setError("Could not load FAQs. Check that the backend is running.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const openAdd = () => {
    setEditing(null);
    // New questions go to the end by default
    setForm({ ...EMPTY, sort_order: faqs.length ? Math.max(...faqs.map((f) => f.sort_order)) + 1 : 0 });
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (faq: Faq) => {
    setEditing(faq);
    setForm({ question: faq.question, answer: faq.answer, sort_order: faq.sort_order });
    setFormError("");
    setFormOpen(true);
  };

  // POST or PUT /api/support/admin/faq
  const saveFaq = async () => {
    const data = { question: form.question.trim(), answer: form.answer.trim(), sort_order: Number(form.sort_order) || 0 };
    if (data.question.length < 5) {
      setFormError("Please write a question (at least 5 characters).");
      return;
    }
    if (!data.answer) {
      setFormError("Please write an answer.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const saved = editing ? await updateFaq(editing.id, data) : await createFaq(data);
      setFaqs((current) => sortFaqs(editing ? current.map((f) => (f.id === saved.id ? saved : f)) : [...current, saved]));
      setFormOpen(false);
    } catch (err) {
      setFormError(errorText(err, "Could not save the FAQ. Try again."));
    } finally {
      setSaving(false);
    }
  };

  // DELETE /api/support/admin/faq/{id}
  const confirmDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    setDeleteError("");
    try {
      await deleteFaq(deleting.id);
      setFaqs((current) => current.filter((f) => f.id !== deleting.id));
      setDeleting(null);
    } catch (err) {
      setDeleteError(errorText(err, "Could not delete the FAQ. Try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-sm text-slate-500">
          Questions shown to customers on the help page, in this order.
        </p>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg bg-primary-600 hover:bg-primary-700"
        >
          <Plus size={16} /> Add FAQ
        </button>
      </div>

      {loading && <LoadingRows />}

      {!loading && error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">{error}</p>
          <button
            onClick={() => setReloadKey(reloadKey + 1)}
            className="text-sm font-medium px-3 py-1 rounded-lg border border-rose-300 hover:bg-rose-100"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && faqs.length === 0 && (
        <p className="text-sm text-slate-500 py-8 text-center">No FAQs yet. Add the first one.</p>
      )}

      {!loading && !error && faqs.length > 0 && (
        <ul className="divide-y rounded-xl border">
          {faqs.map((faq) => {
            const open = openId === faq.id;
            return (
              <li key={faq.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-xs font-semibold text-slate-400 w-6 shrink-0">{faq.sort_order}</span>
                  <button
                    onClick={() => setOpenId(open ? null : faq.id)}
                    className="flex-1 text-left flex items-start justify-between gap-2"
                    aria-expanded={open}
                  >
                    <span className="text-sm font-medium text-slate-800">{faq.question}</span>
                    <ChevronDown
                      size={16}
                      className={`mt-0.5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(faq)}
                      aria-label={`Edit "${faq.question}"`}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-cream-200 hover:text-slate-800"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteError("");
                        setDeleting(faq);
                      }}
                      aria-label={`Delete "${faq.question}"`}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                {open && <p className="mt-2 ml-9 text-sm text-slate-600 whitespace-pre-wrap">{faq.answer}</p>}
              </li>
            );
          })}
        </ul>
      )}

      {/* Add / edit popup */}
      {formOpen && (
        <Modal title={editing ? "Edit FAQ" : "Add FAQ"} onClose={() => setFormOpen(false)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="faq-question" className="block text-sm font-medium text-slate-700 mb-1">
                Question
              </label>
              <input
                id="faq-question"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                maxLength={500}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label htmlFor="faq-answer" className="block text-sm font-medium text-slate-700 mb-1">
                Answer
              </label>
              <textarea
                id="faq-answer"
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                rows={5}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label htmlFor="faq-order" className="block text-sm font-medium text-slate-700 mb-1">
                Position
              </label>
              <input
                id="faq-order"
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="w-28 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-slate-500 mt-1">Lower numbers are shown first.</p>
            </div>

            {formError && (
              <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-cream-100">
                Cancel
              </button>
              <button
                onClick={saveFaq}
                disabled={saving}
                className="px-4 py-2 text-sm text-white rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : editing ? "Save changes" : "Add FAQ"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete popup */}
      {deleting && (
        <Modal title="Delete this FAQ?" onClose={() => setDeleting(null)}>
          <p className="text-sm text-slate-600">"{deleting.question}" will be removed from the help page.</p>
          {deleteError && (
            <p role="alert" className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {deleteError}
            </p>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setDeleting(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-cream-100">
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={saving}
              className="px-4 py-2 text-sm text-white rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60"
            >
              {saving ? "Deleting..." : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
