"use client"

import React, { useEffect, useState } from 'react';
import { AdminSidebar } from "@/components/AdminSidebar";
import { Eye, Ban, Flag } from "lucide-react";

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
    <div className="min-h-screen flex bg-gray-50">
      <div className="fixed md:static z-30">
        <AdminSidebar open={true} setOpen={() => {}} userImage={undefined} userName={undefined} />
      </div>
      <main className="flex-1 p-2 md:p-8 md:ml-64 transition-all duration-300">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-red-700 flex items-center gap-2">
          Members
        </h1>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <div className="flex flex-col gap-8">
          {/* Members List - now full width */}
          <div className="w-full">
            <div className="bg-white rounded-2xl shadow-lg p-2 md:p-4">
              <h2 className="text-lg font-semibold mb-4 text-red-700">All Members</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="sticky top-0 z-10 bg-white border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm tracking-wide">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm tracking-wide">Email</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm tracking-wide">Role</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm tracking-wide">Joined</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {members.map(m => (
                      <tr key={m.id} className="hover:bg-red-50 transition">
                        <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                        <td className="px-4 py-3 text-gray-700">{m.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${m.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{m.role}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{new Date(m.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              className="group p-2 rounded-full bg-gray-100 hover:bg-blue-100 transition"
                              onClick={() => fetchDetails(m.id)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4 text-blue-600 group-hover:text-blue-800" />
                            </button>
                            <button
                              className="group p-2 rounded-full bg-gray-100 hover:bg-yellow-100 transition"
                              disabled={actionLoading === m.id + 'suspend'}
                              onClick={() => handleAction(m.id, 'suspend')}
                              title="Suspend"
                            >
                              <Ban className="h-4 w-4 text-yellow-600 group-hover:text-yellow-800" />
                            </button>
                            <button
                              className="group p-2 rounded-full bg-gray-100 hover:bg-red-100 transition"
                              disabled={actionLoading === m.id + 'flag'}
                              onClick={() => handleAction(m.id, 'flag')}
                              title="Flag"
                            >
                              <Flag className="h-4 w-4 text-red-600 group-hover:text-red-800" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* Member Details */}
          <div className="w-full md:w-1/2">
            {selected && (
              <div className="bg-white rounded-2xl shadow-xl p-6 animate-fade-in mt-4 md:mt-0">
                <h2 className="text-xl font-bold text-red-700 mb-2">Profile: {selected.name}</h2>
                <div className="flex flex-col gap-1 text-gray-700 mb-4">
                  <span><b>Email:</b> {selected.email}</span>
                  <span><b>Username:</b> {selected.username}</span>
                  <span><b>Phone:</b> {selected.phone || '-'}</span>
                  <span><b>Address:</b> {selected.address || '-'}</span>
                  <span><b>Withdrawal Account:</b> {selected.withdrawalAccount || '-'}</span>
                </div>
                <div className="mb-4">
                  <h3 className="font-semibold text-red-700">Articles</h3>
                  <ul className="list-disc list-inside text-gray-600">
                    {selected.articles.map(a => <li key={a.id}>{a.title} <span className="text-xs text-gray-400">({a.status})</span></li>)}
                  </ul>
                </div>
                <div className="mb-4">
                  <h3 className="font-semibold text-red-700">Withdrawals</h3>
                  <ul className="list-disc list-inside text-gray-600">
                    {selected.withdrawals.map(w => <li key={w.id}>{w.amount} <span className="text-xs text-gray-400">({w.status})</span></li>)}
                  </ul>
                </div>
                <div className="mb-4">
                  <h3 className="font-semibold text-red-700">Earnings</h3>
                  <ul className="list-disc list-inside text-gray-600">
                    {selected.earnings.map(e => <li key={e.id}>{e.amount} <span className="text-xs text-gray-400">(rate: {e.rate})</span></li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-red-700">Activity Logs</h3>
                  <ul className="list-disc list-inside text-gray-600">
                    {selected.auditLogs.map(l => <li key={l.id}>{l.action} - {l.details || ''} <span className="text-xs text-gray-400">({new Date(l.createdAt).toLocaleString()})</span></li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminMembers;
