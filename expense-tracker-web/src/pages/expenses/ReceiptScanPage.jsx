import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Camera, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getGroup } from '../../services/firebaseService';
import { scanReceipt } from '../../services/ocrService';
import Layout from '../../components/Layout';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import { formatCurrency } from '../../utils/formatters';
import { useEffect } from 'react';

const uid = () => Math.random().toString(36).slice(2, 10);

export default function ReceiptScanPage() {
  const { id: groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();
  const [group, setGroup] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [items, setItems] = useState([]);
  const [scanned, setScanned] = useState(false);
  const [ocrNote, setOcrNote] = useState('');
  const [dragging, setDragging] = useState(false);

  useEffect(() => { getGroup(groupId).then(setGroup); }, [groupId]);

  const members = group?.members || [];

  async function handleFile(f) {
    if (!f || !f.type.startsWith('image/')) return;
    setFile(f);
    setImageUrl(URL.createObjectURL(f));
    setScanning(true);
    setScanned(false);
    setOcrNote('');
    try {
      const { items: parsed } = await scanReceipt(f);
      if (parsed.length === 0) {
        setOcrNote('No items detected — add them manually.');
        setItems([{ id: uid(), name: '', price: '', participants: [] }]);
      } else {
        setOcrNote('OCR results — please verify and correct.');
        setItems(parsed.map((i) => ({ ...i, price: i.price.toString() })));
      }
      setScanned(true);
    } catch (err) {
      if (err.message.includes('not configured')) {
        setOcrNote('OCR not configured. Enter items manually.');
      } else {
        setOcrNote(`Scan failed: ${err.message}`);
      }
      setItems([{ id: uid(), name: '', price: '', participants: [] }]);
      setScanned(true);
    } finally {
      setScanning(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  const updateItem = (id, k, v) => setItems((p) => p.map((i) => i.id === id ? { ...i, [k]: v } : i));
  const addItem = () => setItems((p) => [...p, { id: uid(), name: '', price: '', participants: [] }]);
  const removeItem = (id) => setItems((p) => p.filter((i) => i.id !== id));

  const toggleParticipant = (itemId, m) =>
    setItems((p) => p.map((item) => {
      if (item.id !== itemId) return item;
      const has = item.participants.some((x) => x.id === m.id);
      return { ...item, participants: has ? item.participants.filter((x) => x.id !== m.id) : [...item.participants, { id: m.id, name: m.name }] };
    }));

  function handleContinue() {
    const valid = items.filter((i) => i.name.trim() && parseFloat(i.price) > 0);
    if (!valid.length) { alert('Add at least one item with a name and price.'); return; }
    navigate(`/groups/${groupId}/expenses/new`, {
      state: { items: valid, receiptFile: file },
    });
  }

  const total = items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Scan Receipt</h1>
          <p className="page-subtitle">{group?.name}</p>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: imageUrl ? '1fr 1fr' : '1fr', gap: 24, maxWidth: imageUrl ? '100%' : 560 }}>
          {/* Upload panel */}
          <div>
            {!imageUrl ? (
              <div
                className={`receipt-drop ${dragging ? 'dragover' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current.click()}
              >
                <Upload size={40} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Drop receipt here</div>
                <div style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 20 }}>or click to choose a file</div>
                <Button variant="secondary" size="sm">
                  <Camera size={15} /> Choose Image
                </Button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <img src={imageUrl} alt="Receipt" style={{ width: '100%', borderRadius: 'var(--radius-lg)', maxHeight: 480, objectFit: 'contain', background: 'var(--surface-alt)' }} />
                <button
                  style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,.55)', color: 'white', border: 'none', borderRadius: 99, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => { setImageUrl(null); setFile(null); setItems([]); setScanned(false); }}
                >
                  Change
                </button>
                {scanning && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-lg)', gap: 12 }}>
                    <div className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,.3)' }} />
                    <span style={{ color: 'white', fontWeight: 600 }}>Extracting items…</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Items editor */}
          {(scanned || items.length > 0) && !scanning && (
            <div>
              {ocrNote && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--warning)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 12px', marginBottom: 16 }}>
                  <AlertCircle size={15} />
                  {ocrNote}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="section-title">Items</div>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(total)}</span>
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
                        type="number" min="0" step="0.01" placeholder="0.00"
                      />
                    </div>
                    <button className="btn btn-icon btn-ghost" onClick={() => removeItem(item.id)} style={{ marginLeft: 4 }}>
                      <Trash2 size={15} color="var(--error)" />
                    </button>
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--text-sec)', marginBottom: 6 }}>Assign to:</div>
                  <div className="participant-chips">
                    {members.map((m) => {
                      const sel = item.participants.some((p) => p.id === m.id);
                      return (
                        <button
                          key={m.id}
                          className={`participant-chip ${sel ? 'selected' : ''}`}
                          onClick={() => toggleParticipant(item.id, m)}
                        >
                          <Avatar name={m.name} id={m.id} size={16} />
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
                style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontWeight: 600, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', marginBottom: 20 }}
                onClick={addItem}
              >
                <Plus size={16} /> Add item manually
              </button>

              <div className="divider" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ color: 'var(--text-sec)' }}>Total</span>
                <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--primary)' }}>{formatCurrency(total)}</span>
              </div>
              <Button full onClick={handleContinue}>Continue to Expense →</Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
