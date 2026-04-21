import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { getExpense } from '../../services/firebaseService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Layout from '../../components/Layout';
import Avatar from '../../components/Avatar';

function computePersonTotals(items) {
  const totals = {};
  for (const item of items || []) {
    if (!item.participants?.length) continue;
    const share = item.price / item.participants.length;
    for (const p of item.participants) {
      totals[p.id] = totals[p.id] || { id: p.id, name: p.name, total: 0 };
      totals[p.id].total += share;
    }
  }
  return Object.values(totals).sort((a, b) => b.total - a.total);
}

export default function ExpenseDetailPage() {
  const { id: groupId, expenseId } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getExpense(expenseId).then(setExpense).finally(() => setLoading(false)); }, [expenseId]);

  if (loading) return <Layout><div className="center-spinner"><div className="spinner" /></div></Layout>;
  if (!expense) return <Layout><div className="page-body">Expense not found.</div></Layout>;

  const perPerson = computePersonTotals(expense.items);

  return (
    <Layout>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-icon btn-ghost" onClick={() => navigate(`/groups/${groupId}`)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">{expense.title}</h1>
            <p className="page-subtitle">{formatDate(expense.date)}</p>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          <div>
            {/* Summary */}
            <div className="card-primary" style={{ marginBottom: 16 }}>
              <div className="summary-label">Total Amount</div>
              <div className="summary-amount">{formatCurrency(expense.totalAmount)}</div>
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,.75)' }}>
                  <User size={13} /> Paid by {expense.paidBy?.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,.75)' }}>
                  <Calendar size={13} /> {formatDate(expense.date)}
                </div>
              </div>
            </div>

            {/* Paid by */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="input-label" style={{ marginBottom: 12 }}>Paid by</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={expense.paidBy?.name} id={expense.paidBy?.id} size={44} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{expense.paidBy?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-sec)' }}>covered the full amount</div>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 16 }}>
                  {formatCurrency(expense.totalAmount)}
                </span>
              </div>
            </div>

            {/* Receipt */}
            {expense.receiptImageUrl && (
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="input-label" style={{ marginBottom: 10 }}>Receipt</div>
                <img src={expense.receiptImageUrl} alt="Receipt" className="receipt-preview" />
              </div>
            )}
          </div>

          <div>
            {/* Items breakdown */}
            {expense.items?.length > 0 && (
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="input-label" style={{ marginBottom: 12 }}>Items</div>
                {expense.items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    style={{ paddingBottom: 12, marginBottom: 12, borderBottom: idx < expense.items.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</span>
                      <span style={{ fontWeight: 700 }}>{formatCurrency(item.price)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      {item.participants?.map((p) => (
                        <div key={p.id} style={{ marginRight: -4 }}>
                          <Avatar name={p.name} id={p.id} size={20} />
                        </div>
                      ))}
                      {item.participants?.length > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--text-sec)', marginLeft: 10 }}>
                          {formatCurrency(item.price / item.participants.length)} each
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 700 }}>Total</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 16 }}>{formatCurrency(expense.totalAmount)}</span>
                </div>
              </div>
            )}

            {/* Per person */}
            {perPerson.length > 0 && (
              <div className="card">
                <div className="input-label" style={{ marginBottom: 12 }}>Per Person</div>
                {perPerson.map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <Avatar name={p.name} id={p.id} size={32} />
                    <span style={{ flex: 1, fontWeight: 500 }}>{p.name}</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(p.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
