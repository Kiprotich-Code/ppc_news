import React, { useEffect, useState } from 'react';

type Article = {
  id: string;
  title: string;
  content: string;
  status: string;
  moderationNote?: string;
  isBoosted: boolean;
  boostLevel?: string;
  boostExpiry?: string;
  clickValue?: number;
  publishedAt?: string;
  author: { name: string; email: string; };
};

const AdminArticles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Article | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/articles');
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (e) {
      setError('Failed to fetch articles');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const moderateArticle = async (id: string, status: string) => {
    setActionLoading(id + status);
    try {
      await fetch('/api/admin/articles/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: id, status, note }),
      });
      fetchArticles();
      setSelected(null);
      setNote('');
    } catch (e) {
      setError('Moderation failed');
    }
    setActionLoading(null);
  };

  const boostArticle = async (id: string, isBoosted: boolean, boostLevel?: string, boostExpiry?: string) => {
    setActionLoading(id + 'boost');
    try {
      await fetch('/api/admin/articles/boost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: id, isBoosted, boostLevel, boostExpiry }),
      });
      fetchArticles();
    } catch (e) {
      setError('Boost failed');
    }
    setActionLoading(null);
  };

  return (
    <div>
      <h1>Manage Articles</h1>
      {loading ? <p>Loading...</p> : null}
      {error ? <p style={{ color: 'red' }}>{error}</p> : null}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Boosted</th>
            <th>Author</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {articles.map(a => (
            <tr key={a.id} style={{ background: a.isBoosted ? '#eaffea' : 'inherit' }}>
              <td>{a.title}</td>
              <td>{a.status}</td>
              <td>{a.isBoosted ? `${a.boostLevel || 'Yes'}${a.boostExpiry ? ' (until ' + new Date(a.boostExpiry).toLocaleDateString() + ')' : ''}` : 'No'}</td>
              <td>{a.author.name}</td>
              <td>
                <button onClick={() => setSelected(a)}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selected && (
        <div style={{ border: '1px solid #ccc', padding: 16, marginTop: 24, borderRadius: 8 }}>
          <h2>{selected.title}</h2>
          <p><b>Status:</b> {selected.status}</p>
          <p><b>Author:</b> {selected.author.name} ({selected.author.email})</p>
          <p><b>Content:</b> {selected.content}</p>
          <p><b>Moderation Note:</b> {selected.moderationNote || '-'}</p>
          <div style={{ marginTop: 16 }}>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add moderation note (optional)" rows={2} style={{ width: '100%' }} />
            <button disabled={actionLoading === selected.id + 'APPROVED'} onClick={() => moderateArticle(selected.id, 'APPROVED')}>Approve</button>{' '}
            <button disabled={actionLoading === selected.id + 'REJECTED'} onClick={() => moderateArticle(selected.id, 'REJECTED')}>Reject</button>
          </div>
          <div style={{ marginTop: 16 }}>
            <label>
              <input type="checkbox" checked={selected.isBoosted} onChange={e => boostArticle(selected.id, e.target.checked)} /> Boosted
            </label>
            <select value={selected.boostLevel || ''} onChange={e => boostArticle(selected.id, true, e.target.value)}>
              <option value="">Set Boost Level</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <input type="date" onChange={e => boostArticle(selected.id, true, selected.boostLevel, e.target.value)} />
          </div>
          <div style={{ marginTop: 16 }}>
            <form onSubmit={async e => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const value = parseFloat((form.elements.namedItem('clickValue') as HTMLInputElement).value);
              if (!isNaN(value)) {
                setActionLoading(selected.id + 'clickValue');
                await fetch('/api/admin/articles/click-value', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ articleId: selected.id, clickValue: value }),
                });
                fetchArticles();
                setActionLoading(null);
              }
            }}>
              <label>
                PPC Rate (click value):
                <input name="clickValue" type="number" step="0.01" defaultValue={selected.clickValue || ''} style={{ marginLeft: 8 }} />
              </label>
              <button type="submit" disabled={actionLoading === selected.id + 'clickValue'} style={{ marginLeft: 8 }}>Update</button>
            </form>
          </div>
          <button style={{ marginTop: 16 }} onClick={() => setSelected(null)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default AdminArticles;
