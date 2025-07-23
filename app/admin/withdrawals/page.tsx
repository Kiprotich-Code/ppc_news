import React, { useEffect, useState } from 'react';

type Withdrawal = {
  id: string;
  amount: number;
  status: string;
  flagged: boolean;
  note?: string;
  paidAt?: string;
  accountDetails: string;
  createdAt: string;
  processedAt?: string;
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
  };
};

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchWithdrawals = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/withdrawals');
      const data = await res.json();
      setWithdrawals(data.withdrawals || []);
    } catch (e) {
      setError('Failed to fetch withdrawals');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleAction = async (id: string, action: string) => {
    setActionLoading(id + action);
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      await res.json();
      fetchWithdrawals();
    } catch (e) {
      setError('Action failed');
    }
    setActionLoading(null);
  };

  return (
    <div>
      <h1>Withdrawal Management</h1>
      {loading ? <p>Loading...</p> : null}
      {error ? <p style={{ color: 'red' }}>{error}</p> : null}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr>
            <th>User</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Flagged</th>
            <th>Account</th>
            <th>Note</th>
            <th>Requested</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {withdrawals.map(w => (
            <tr key={w.id} style={{ background: w.flagged ? '#ffeaea' : 'inherit' }}>
              <td>{w.user.name} <br /> <span style={{ fontSize: 12 }}>{w.user.email}</span></td>
              <td>{w.amount}</td>
              <td>{w.status}</td>
              <td>{w.flagged ? 'Yes' : 'No'}</td>
              <td>{w.accountDetails}</td>
              <td>{w.note || '-'}</td>
              <td>{new Date(w.createdAt).toLocaleString()}</td>
              <td>
                <button disabled={actionLoading === w.id + 'approve'} onClick={() => handleAction(w.id, 'approve')}>Approve</button>{' '}
                <button disabled={actionLoading === w.id + 'reject'} onClick={() => handleAction(w.id, 'reject')}>Reject</button>{' '}
                <button disabled={actionLoading === w.id + 'flag'} onClick={() => handleAction(w.id, 'flag')}>Flag</button>{' '}
                <button disabled={actionLoading === w.id + 'paid'} onClick={() => handleAction(w.id, 'paid')}>Mark Paid</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminWithdrawals;
