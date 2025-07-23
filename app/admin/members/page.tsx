import React, { useEffect, useState } from 'react';

type Member = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
  profileImage?: string;
  phone?: string;
  address?: string;
  withdrawalAccount?: string;
};

type MemberDetails = Member & {
  articles: any[];
  withdrawals: any[];
  earnings: any[];
  auditLogs: any[];
};

const AdminMembers = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<MemberDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/members');
      const data = await res.json();
      setMembers(data.users || []);
    } catch (e) {
      setError('Failed to fetch members');
    }
    setLoading(false);
  };

  const fetchDetails = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/members?id=${id}`);
      const data = await res.json();
      setSelected(data.user);
    } catch (e) {
      setError('Failed to fetch details');
    }
    setLoading(false);
  };

  const handleAction = async (id: string, action: string) => {
    setActionLoading(id + action);
    try {
      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      await res.json();
      fetchMembers();
      if (selected?.id === id) fetchDetails(id);
    } catch (e) {
      setError('Action failed');
    }
    setActionLoading(null);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  return (
    <div>
      <h1>Member Information</h1>
      {loading ? <p>Loading...</p> : null}
      {error ? <p style={{ color: 'red' }}>{error}</p> : null}
      <div style={{ display: 'flex', gap: 32 }}>
        <div style={{ flex: 1 }}>
          <h2>All Members</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.email}</td>
                  <td>{m.role}</td>
                  <td>{new Date(m.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => fetchDetails(m.id)}>View</button>{' '}
                    <button disabled={actionLoading === m.id + 'suspend'} onClick={() => handleAction(m.id, 'suspend')}>Suspend</button>{' '}
                    <button disabled={actionLoading === m.id + 'flag'} onClick={() => handleAction(m.id, 'flag')}>Flag</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ flex: 2 }}>
          {selected && (
            <div style={{ border: '1px solid #ccc', padding: 16, borderRadius: 8 }}>
              <h2>Profile: {selected.name}</h2>
              <p><b>Email:</b> {selected.email}</p>
              <p><b>Username:</b> {selected.username}</p>
              <p><b>Phone:</b> {selected.phone || '-'}</p>
              <p><b>Address:</b> {selected.address || '-'}</p>
              <p><b>Withdrawal Account:</b> {selected.withdrawalAccount || '-'}</p>
              <h3>Articles</h3>
              <ul>{selected.articles.map(a => <li key={a.id}>{a.title} ({a.status})</li>)}</ul>
              <h3>Withdrawals</h3>
              <ul>{selected.withdrawals.map(w => <li key={w.id}>{w.amount} ({w.status})</li>)}</ul>
              <h3>Earnings</h3>
              <ul>{selected.earnings.map(e => <li key={e.id}>{e.amount} (rate: {e.rate})</li>)}</ul>
              <h3>Activity Logs</h3>
              <ul>{selected.auditLogs.map(l => <li key={l.id}>{l.action} - {l.details || ''} ({new Date(l.createdAt).toLocaleString()})</li>)}</ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMembers;
