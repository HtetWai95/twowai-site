import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Trash2, Camera } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getGroup, createExpense, uploadReceiptImage } from '../../services/firebaseService';
import Layout from '../../components/Layout';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import { formatCurrency } from '../../utils/formatters';

const uid = () => Math.random().toString(36).slice(2, 10);

export default function AddExpensePage() {
  const { id: groupId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const prefill = location.state || {};
  const [group, setGroup] = useState(null);
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [paidBy, setPaidBy] = useState({ id: user.uid, name: profile?.name || 'Me' });
  const [items, setItems] = useState(
    prefill.items?.length
      ? prefill.items
      : [{ id: uid(), name: '', price: '', participants: [] }]
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => { getGroup(groupId).then(setGroup); }, [groupId]);

  const members = group?.members || [];
  const total = items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);

  const updateItem = (id, k, v) => setItems((p) => p.map((i) => i.id === id ? { ...i, [k]: v } : i));
  const addItem = () => setItems((p) => [...p, { id: uid(), name: '', price: '', participants: [] }]);
  const removeItem = (id) => items.length > 1 && setItems((p) => p.filter((i) => i.id !== id));

  const toggleParticipant = (itemId, m) =>
    setItems((p) => p.map((item) => {
      if (item.id !== itemId) return item;
      const has = item.participants.some((x) => x.id === m.id);
      return { ...item, participants: has ? item.participants.filter((x) => x.id !== m.id) : [...item.participants, { id: m.id, name: m.name }] };
    }));

  const selectAll = (itemId) =>
    setItems((p) => p.map((item) => {
      if (item.id !== itemId) return item;
      const all = item.participants.length === members.length;
      return { ...item, participants: all ? [] : members.map((m) => ({ id: m.id, name: m.name })) };
    }));

  function validate() {
    const e = {};
    if (!title.trim()) e.title = 'Expense title is required';
    if (items.some((i) => !i.name.trim())) e.items = 'All items need a name';
    if (items.some((i) => !i.price || parseFloat(i.price) <= 0)) e.price = 'All items need a valid price';
    if (items.some((i) => !i.participants.length)) e.participants = 'Each item must have at least one participant';
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      let receiptImageUrl = null;
      const expenseId = uid();
      if (prefill.receiptFile) {
        receiptImageUrl = await uploadReceiptImage(prefill.receiptFile, expenseId).catch(() => null);
      }
      await createExpense({
        groupId,
        title: title.trim(),
        totalAmount: total,
        paidBy,
        date: new Date(),
        items: items.map((i) => ({ ...i, price: parseFloat(i.price) })),
        receiptImageUrl,
      });
      navigate(`/groups/${groupId}`);
    } catch {
      alert('Could not save expense. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Add Expense</h1>
          <p className="page-subtitle">{group?.name}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate(`/groups/${groupId}/receipt-scan`)}>
          <Camera size={16} /> Scan Receipt
        </Button>
      </div>

      <div className="page-body" style={{ maxWidth: 680 }}>
        {Object.keys(errors).length > 0 && (
          <div className="alert alert-error">
            {Object.values(errors)[0]}
          </div>
        )}

        <Input
          label="Expense Title"
          placeholder="e.g. Dinner at Nobu"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setTitleError(''); }}
          error={titleError}
        />

        {/* Paid By */}
        <div style={{ marginBottom: 20 }}>
          <div className="input-label" style={{ marginBottom: 8 }}>Paid By</div>
          <div className="paidby-chips">
            {members.map((m) => (
              <button
                key={m.id}
                className={`paidby-chip ${paidBy.id === m.id ? 'selected' : ''}`}
                onClick={() => setPaidBy({ id: m.id, name: m.name })}
              >
                <Avatar name={m.name} id={m.id} size={22} />
                {m.id === user.uid ? 'You' : m.name?.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Items */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="input-label">Items</div>
          <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 15 }}>{formatCurrency(total)}</span>
        </div>

        {items.map((item, idx) => (
          <div key={item.id} className="item-card">
            <div className="item-top">
              <input
                className="item-name-input"
                value={item.name}
                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                placeholder={`Item ${idx + 1}`}
              />
              <div className="item-price-wrap">
                <span className="item-price-symbol">$</span>
                <input
                  className="item-price-input"
                  value={item.price}
                  onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                  placeholder="0.00"
                  type="number"
                  min="0"
                  step="0.01"
                />
              </div>
              <button
                className="btn btn-icon btn-ghost"
                onClick={() => removeItem(item.id)}
                disabled={items.length === 1}
                style={{ marginLeft: 4 }}
              >
                <Trash2 size={16} color={items.length === 1 ? 'var(--text-dis)' : 'var(--error)'} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-sec)' }}>Split between ({item.participants.length}/{members.length}):</span>
              <button
                style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => selectAll(item.id)}
              >
                {item.participants.length === members.length ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="participant-chips">
              {members.map((m) => {
                const sel = item.participants.some((p) => p.id === m.id);
                return (
                  <button
                    key={m.id}
                    className={`participant-chip ${sel ? 'selected' : ''}`}
                    onClick={() => toggleParticipant(item.id, m)}
                  >
                    <Avatar name={m.name} id={m.id} size={18} />
                    {m.id === user.uid ? 'You' : m.name?.split(' ')[0]}
                  </button>
                );
              })}
            </div>

            {item.participants.length > 0 && parseFloat(item.price) > 0 && (
              <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--success)', marginTop: 6, fontWeight: 600 }}>
                {formatCurrency(parseFloat(item.price) / item.participants.length)} each
              </div>
            )}
          </div>
        ))}

        <button
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontWeight: 600, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0', marginBottom: 24 }}
          onClick={addItem}
        >
          <Plus size={18} /> Add item
        </button>

        <div className="divider" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 14, color: 'var(--text-sec)' }}>Total</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(total)}</div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="outline" onClick={() => navigate(`/groups/${groupId}`)}>Cancel</Button>
          <Button loading={saving} onClick={handleSave}>Save Expense</Button>
        </div>
      </div>
    </Layout>
  );
}
