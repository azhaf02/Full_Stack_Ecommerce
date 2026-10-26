import React, { useState, useEffect } from 'react';
import apiClient, { getErrorMessage } from '../../services/apiClient';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  sort_order: number;
}

const FaqAdminPage: React.FC = () => {
  
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [editingId, setEditingId] = useState<number | null>(null);

  const refreshFaqs = async () => {
try {
const res = await apiClient.get('/api/support/faq');
setFaqs(res.data);
} catch (err) {
console.error('Failed to load FAQs:', getErrorMessage(err));
setFaqs([]);
}
};
  useEffect(() => { refreshFaqs(); }, []);

  const handleSaveFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    const url = editingId ? `/api/support/admin/faq/${editingId}` : '/api/support/admin/faq';
    

    
try {
const payload = { question, answer, sort_order: sortOrder };

if (editingId) {
await apiClient.put(url, payload);
} else {
await apiClient.post(url, payload);
}
} catch (err) {
alert(getErrorMessage(err, 'Failed to save FAQ.'));
return;
}

    await refreshFaqs();


setQuestion('');
setAnswer('');
setSortOrder(0);
setEditingId(null);


};

const handleStartEdit = (f: FAQItem) => {
setEditingId(f.id);
setQuestion(f.question);
setAnswer(f.answer);
setSortOrder(f.sort_order);
};

  const handleDeleteFAQ = async (id: number) => {
try {
await apiClient.delete(`/api/support/admin/faq/${id}`);
await refreshFaqs();
} catch (err) {
alert(getErrorMessage(err, 'Failed to delete FAQ.'));
}
};

  return (
    <div style={{ minHeight: 'auto', backgroundColor: '#F8F7F2', paddingBottom: '10px' }}>
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
          <div><h4 className="fw-bold text-dark mb-1">FAQ Management Panel</h4><p className="text-muted small mb-0">Maintain public support articles upfront to minimize incoming operations load pressures.</p></div>
        </div>

        <div className="row g-4">
          <div className="col-12 col-md-4">
            <div className="card p-4 border shadow-sm bg-white" style={{ borderColor: '#E5E2D8' }}>
              <h6 className="fw-bold mb-3 text-secondary"><i className="bi bi-pencil-square me-2"></i>{editingId ? 'Edit Support Article' : 'Compose Fresh Article'}</h6>
              <form onSubmit={handleSaveFAQ} className="d-flex flex-column gap-3">
                <div><label className="form-label small fw-bold text-muted mb-1">Question Text</label><input type="text" className="form-control form-control-sm" value={question} onChange={e => setQuestion(e.target.value)} required /></div>
                <div><label className="form-label small fw-bold text-muted mb-1">Answer Narrative</label><textarea className="form-control form-control-sm" rows={4} value={answer} onChange={e => setAnswer(e.target.value)} required /></div>
                <div><label className="form-label small fw-bold text-muted mb-1">Sorting Order Rank</label><input type="number" className="form-control form-control-sm" value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)} /></div>
                <div className="d-flex gap-2 mt-2">
                  <button type="submit" className="btn btn-sm btn-dark text-white fw-bold flex-grow-1" style={{ backgroundColor: '#5F6B3A', borderColor: '#5F6B3A' }}>{editingId ? 'Update Article' : 'Publish Article'}</button>
                  {editingId && <button type="button" onClick={() => { setEditingId(null); setQuestion(''); setAnswer(''); setSortOrder(0); }} className="btn btn-sm btn-light border small text-muted">Cancel</button>}
                </div>
              </form>
            </div>
          </div>

          <div className="col-12 col-md-8">
            <div className="card p-4 border shadow-sm bg-white" style={{ borderColor: '#E5E2D8' }}>
              <h6 className="fw-bold mb-3 text-secondary"><i className="bi bi-list-columns me-2"></i>Active Public FAQ Repository Database</h6>
              <div className="d-flex flex-column gap-3 overflow-auto" style={{ maxHeight: '320px' }}>
                {faqs.map(f => (
                  <div key={f.id} className="p-3 border rounded bg-light d-flex justify-content-between align-items-start">
                    <div className="pe-3">
                      <span className="badge bg-secondary small font-monospace mb-2" style={{ fontSize: '10px' }}>Priority Rank: #{f.sort_order}</span>
                      <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '14px' }}>{f.question}</h6>
                      <p className="text-muted small mb-0 lh-sm">{f.answer}</p>
                    </div>
                    <div className="d-flex gap-1">
                      <button onClick={() => handleStartEdit(f)} className="btn btn-xs btn-outline-secondary p-1 px-2 small"><i className="bi bi-pencil-fill"></i></button>
                      <button onClick={() => handleDeleteFAQ(f.id)} className="btn btn-xs btn-outline-danger p-1 px-2 small"><i className="bi bi-trash3-fill"></i></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
  );
};

export default FaqAdminPage;
