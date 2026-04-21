import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createGroup, findUserByEmail } from '../../services/firebaseService';
import Layout from '../../components/Layout';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';

export default function CreateGroupPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [members, setMembers] = useState([
    { id: user.uid, name: profile?.name || 'You', email: profile?.email || '', isCreator: true },
  ]);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAddMember(e) {
    e.preventDefault();
    const email = memberEmail.trim().toLowerCase();
    if (!email) return;
    if (!/\S+@\S+\.\S+/.test(email)) { setAddError('Enter a valid email'); return; }
    if (members.some((m) => m.email === email)) { setAddError('Already added'); return; }
    setAdding(true); setAddError('');
    try {
      const found = await findUserByEmail(email);
      if (!found) { setAddError('No account found with that email. They need to sign up first.'); return; }
      setMembers((prev) => [...prev, { id: found.id, name: found.name, email: found.email }]);
      setMemberEmail('');
    } catch {
      setAddError('Could not search. Check your connection.');
    } finally {
      setAdding(false);
    }
  }

  async function handleCreate() {
    if (!name.trim()) { setNameError('Group name is required'); return; }
    if (members.length < 2) { alert('Add at least one other member.'); return; }
    setSaving(true);
    try {
      const id = await createGroup({ name: name.trim(), members, createdBy: user.uid });
      navigate(`/groups/${id}`);
    } catch {
      alert('Could not create group. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Group</h1>
          <p className="page-subtitle">Add members and start splitting</p>
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: 560 }}>
        <Input
          label="Group Name"
          placeholder="e.g. Trip to Bali, Housemates"
          value={name}
          onChange={(e) => { setName(e.target.value); setNameError(''); }}
          error={nameError}
        />

        <div style={{ marginBottom: 24 }}>
          <div className="input-label" style={{ marginBottom: 8 }}>Add Members by Email</div>
          <form onSubmit={handleAddMember} style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div className={`input-container ${addError ? 'error' : ''}`}>
                <input
                  type="email"
                  placeholder="member@email.com"
                  value={memberEmail}
                  onChange={(e) => { setMemberEmail(e.target.value); setAddError(''); }}
                />
              </div>
              {addError && <span className="input-error">{addError}</span>}
            </div>
            <Button type="submit" loading={adding} size="sm">
              <UserPlus size={15} /> Add
            </Button>
          </form>
        </div>

        <div className="section-title" style={{ marginBottom: 12 }}>
          Members ({members.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
          {members.map((m) => (
            <div key={m.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
              <Avatar name={m.name} id={m.id} size={38} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}{m.isCreator ? ' (you)' : ''}</div>
                <div style={{ fontSize: 12, color: 'var(--text-sec)' }}>{m.email}</div>
              </div>
              {!m.isCreator && (
                <button className="btn btn-icon btn-ghost" onClick={() => setMembers((p) => p.filter((x) => x.id !== m.id))}>
                  <X size={16} color="var(--error)" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="outline" onClick={() => navigate('/')}>Cancel</Button>
          <Button loading={saving} onClick={handleCreate}>Create Group</Button>
        </div>
      </div>
    </Layout>
  );
}
