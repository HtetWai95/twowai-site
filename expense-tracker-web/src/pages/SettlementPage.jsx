import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { getGroup, getGroupExpenses } from '../services/firebaseService';
import { computeNetBalances, minimizeTransactions } from '../utils/settlement';
import { formatCurrency } from '../utils/formatters';
import Layout from '../components/Layout';
import Avatar from '../components/Avatar';

export default function SettlementPage() {
  const { id: groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [balances, setBalances] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [g, exps] = await Promise.all([getGroup(groupId), getGroupExpenses(groupId)]);
      setGroup(g);
      const bals = computeNetBalances(exps, g?.members || []);
      setBalances(bals);
      setTransactions(minimizeTransactions(bals));
      setLoading(false);
    }
    load();
  }, [groupId]);

  const members = group?.members || [];
  const getName = (id) => members.find((m) => m.id === id)?.name || id;
  const settled = transactions.length === 0;

  if (loading) return <Layout><div className="center-spinner"><div className="spinner" /></div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-icon btn-ghost" onClick={() => navigate(`/groups/${groupId}`)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">Settle Up</h1>
            <p className="page-subtitle">{group?.name}</p>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Hero */}
        <div className="card-primary" style={{ marginBottom: 24, textAlign: 'center' }}>
          {settled ? (
            <>
              <CheckCircle size={48} color="white" style={{ margin: '0 auto 12px' }} />
              <div className="summary-amount">All settled up!</div>
              <div className="summary-sub">Everyone in {group?.name} is even.</div>
            </>
          ) : (
            <>
              <div className="summary-label">To clear all debts in {group?.name}</div>
              <div className="summary-amount">{transactions.length} payment{transactions.length !== 1 ? 's' : ''} needed</div>
              <div className="summary-sub">Minimum transactions to settle everything</div>
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Suggested payments */}
          {transactions.length > 0 && (
            <div>
              <div className="section-title" style={{ marginBottom: 14 }}>Suggested Payments</div>
              {transactions.map((tx, idx) => (
                <div key={idx} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <Avatar name={getName(tx.from)} id={tx.from} size={44} />
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{getName(tx.from)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-sec)' }}>pays</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 16, marginBottom: 4 }}>
                        {formatCurrency(tx.amount)}
                      </div>
                      <ArrowRight size={22} color="var(--primary)" />
                    </div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <Avatar name={getName(tx.to)} id={tx.to} size={44} />
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{getName(tx.to)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-sec)' }}>receives</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* All balances */}
          <div>
            <div className="section-title" style={{ marginBottom: 14 }}>All Balances</div>
            {members.map((m) => {
              const bal = balances[m.id] || 0;
              const abs = Math.abs(bal);
              const isOwed = bal > 0.01;
              const owes = bal < -0.01;
              return (
                <div key={m.id} className="balance-row">
                  <Avatar name={m.name} id={m.id} size={36} />
                  <div className="balance-info">
                    <div className="balance-name">{m.name}</div>
                    <div
                      className="balance-status"
                      style={{ color: isOwed ? 'var(--success)' : owes ? 'var(--error)' : 'var(--text-sec)' }}
                    >
                      {abs < 0.01 ? 'Settled up' : isOwed ? `gets back ${formatCurrency(abs)}` : `owes ${formatCurrency(abs)}`}
                    </div>
                  </div>
                  <span className={`badge ${isOwed ? 'badge-success' : owes ? 'badge-error' : 'badge-neutral'}`}>
                    {abs < 0.01 ? '—' : (isOwed ? '+' : '') + formatCurrency(bal)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-dis)', marginTop: 24, display: 'flex', alignItems: 'center', gap: 6 }}>
          Balances recalculate automatically when new expenses are added.
          Record a payment as an expense to mark it settled.
        </div>
      </div>
    </Layout>
  );
}
