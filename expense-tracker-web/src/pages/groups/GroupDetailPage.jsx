import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Receipt, ArrowRightLeft, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getGroup, getGroupExpenses, deleteExpense } from '../../services/firebaseService';
import { computeNetBalances } from '../../utils/settlement';
import { formatCurrency, formatRelativeDate } from '../../utils/formatters';
import Layout from '../../components/Layout';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';

export default function GroupDetailPage() {
  const { id: groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);

  async function load() {
    const [g, exps] = await Promise.all([getGroup(groupId), getGroupExpenses(groupId)]);
    setGroup(g);
    setExpenses(exps);
    if (g?.members) setBalances(computeNetBalances(exps, g.members));
    setLoading(false);
  }

  useEffect(() => { load(); }, [groupId]);

  async function handleDelete(expense, e) {
    e.stopPropagation();
    if (expense.paidBy?.id !== user.uid) { alert('Only the payer can delete this expense.'); return; }
    if (!confirm(`Delete "${expense.title}"?`)) return;
    await deleteExpense(expense.id);
    load();
  }

  const myBal = balances[user.uid] || 0;
  const members = group?.members || [];
  const hasDebts = Object.values(balances).some((b) => Math.abs(b) > 0.01);

  if (loading) return <Layout><div className="center-spinner"><div className="spinner" /></div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">{group?.name}</h1>
          <p className="page-subtitle">{members.length} members</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {hasDebts && (
            <Button variant="secondary" onClick={() => navigate(`/groups/${groupId}/settle`)}>
              <ArrowRightLeft size={16} /> Settle Up
            </Button>
          )}
          <Button onClick={() => navigate(`/groups/${groupId}/expenses/new`)}>
            <Plus size={16} /> Add Expense
          </Button>
        </div>
      </div>

      <div className="page-body">
        {/* Balance summary card */}
        <div className="card-primary" style={{ marginBottom: 24 }}>
          <div className="summary-label">Your balance in this group</div>
          <div className="summary-amount">
            {Math.abs(myBal) < 0.01
              ? 'All settled up ✓'
              : myBal > 0
              ? `You are owed ${formatCurrency(myBal)}`
              : `You owe ${formatCurrency(-myBal)}`}
          </div>
          <div style={{ display: 'flex', gap: -8, marginTop: 12 }}>
            {members.slice(0, 6).map((m) => (
              <div key={m.id} style={{ marginRight: -8 }}><Avatar name={m.name} id={m.id} size={30} /></div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Balances */}
          <div>
            <div className="section-header">
              <div className="section-title">Balances</div>
            </div>
            {members.map((m) => {
              const bal = balances[m.id] || 0;
              const abs = Math.abs(bal);
              const isMe = m.id === user.uid;
              return (
                <div key={m.id} className="balance-row">
                  <Avatar name={m.name} id={m.id} size={36} />
                  <div className="balance-info">
                    <div className="balance-name">{isMe ? 'You' : m.name}</div>
                    <div
                      className="balance-status"
                      style={{ color: bal > 0.01 ? 'var(--success)' : bal < -0.01 ? 'var(--error)' : 'var(--text-sec)' }}
                    >
                      {abs < 0.01 ? 'Settled up' : bal > 0 ? `gets back ${formatCurrency(abs)}` : `owes ${formatCurrency(abs)}`}
                    </div>
                  </div>
                  <span
                    className={`badge ${bal > 0.01 ? 'badge-success' : bal < -0.01 ? 'badge-error' : 'badge-neutral'}`}
                  >
                    {abs < 0.01 ? '—' : (bal > 0 ? '+' : '') + formatCurrency(bal)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Expenses */}
          <div>
            <div className="section-header">
              <div className="section-title">Expenses</div>
            </div>
            {expenses.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-sec)' }}>
                <Receipt size={32} style={{ margin: '0 auto 8px', color: 'var(--text-dis)' }} />
                <div style={{ fontSize: 14 }}>No expenses yet. Add one to get started.</div>
              </div>
            ) : (
              expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="expense-card"
                  onClick={() => navigate(`/groups/${groupId}/expenses/${exp.id}`)}
                >
                  <div className="expense-icon">
                    <Receipt size={20} color="var(--primary)" />
                  </div>
                  <div className="expense-info">
                    <div className="expense-title truncate">{exp.title}</div>
                    <div className="expense-meta">
                      {exp.paidBy?.id === user.uid ? 'You' : exp.paidBy?.name} paid · {formatRelativeDate(exp.date)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="expense-amount">{formatCurrency(exp.totalAmount)}</span>
                    {exp.paidBy?.id === user.uid && (
                      <button className="btn btn-icon btn-ghost" onClick={(e) => handleDelete(exp, e)} title="Delete">
                        <Trash2 size={14} color="var(--error)" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
