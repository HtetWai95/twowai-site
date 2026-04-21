import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserGroupsWithMemberObjects, deleteGroup } from '../../services/firebaseService';
import Layout from '../../components/Layout';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';

export default function GroupListPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await getUserGroupsWithMemberObjects(user.uid);
      setGroups(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(g) {
    if (!confirm(`Delete group "${g.name}"? Expenses will not be deleted.`)) return;
    await deleteGroup(g.id);
    setGroups((prev) => prev.filter((x) => x.id !== g.id));
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hello, {profile?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Manage your shared expenses</p>
        </div>
        <Button onClick={() => navigate('/groups/new')}>
          <Plus size={16} /> New Group
        </Button>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="center-spinner"><div className="spinner" /></div>
        ) : groups.length === 0 ? (
          <div className="empty-state">
            <Users size={56} className="empty-state-icon" />
            <h2 className="empty-state-title">No groups yet</h2>
            <p className="empty-state-text">Create a group to start splitting expenses with friends.</p>
            <Button onClick={() => navigate('/groups/new')} style={{ marginTop: 20 }}>
              <Plus size={16} /> Create Group
            </Button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {groups.map((g) => (
              <div
                key={g.id}
                className="card"
                style={{ cursor: 'pointer', transition: 'box-shadow .15s' }}
                onClick={() => navigate(`/groups/${g.id}`)}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={22} color="var(--primary)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{g.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-sec)' }}>{g.members?.length || 0} members</div>
                    </div>
                  </div>
                  {g.createdBy === user.uid && (
                    <button
                      className="btn btn-icon btn-ghost"
                      onClick={(e) => { e.stopPropagation(); handleDelete(g); }}
                      title="Delete group"
                    >
                      <Trash2 size={16} color="var(--error)" />
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {g.members?.slice(0, 5).map((m) => (
                    <div key={m.id} style={{ marginRight: -8 }}>
                      <Avatar name={m.name} id={m.id} size={28} />
                    </div>
                  ))}
                  {g.members?.length > 5 && (
                    <span style={{ fontSize: 11, color: 'var(--text-sec)', marginLeft: 16 }}>
                      +{g.members.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
