"use client";

import React, { useEffect, useState } from 'react';
import { AdminSidebar, SIDEBAR_WIDTH_OPEN, SIDEBAR_WIDTH_CLOSED } from "@/components/AdminSidebar";
import { Eye, Ban, Flag, Search, UserPlus, ChevronDown, ChevronUp, Loader2, Shield, FileText, Calendar, AlertCircle, RefreshCw, User, Trash2, XCircle } from "lucide-react";
import { useRouter } from 'next/navigation';
import { AdminMobileNav } from "@/components/AdminMobileNav";

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
  articles?: any[];
  withdrawals?: any[];
  earnings?: any[];
  auditLogs?: any[];
};

const AdminMembers = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const router = useRouter();
  const [isMdUp, setIsMdUp] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    const checkScreen = () => {
      setIsMdUp(window.matchMedia('(min-width: 768px)').matches);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/members');
      if (!res.ok) throw new Error('Failed to fetch members');
      const data = await res.json();
      setMembers(data.users || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: string) => {
    setActionLoading(id + action);
    try {
      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) throw new Error('Action failed');
      await fetchMembers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/members?id=${memberToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete member');
      }
      
      const data = await res.json();
      setSuccessMessage(`Member "${memberToDelete.name}" has been deleted successfully.`);
      setShowDeleteModal(false);
      setMemberToDelete(null);
      await fetchMembers();
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete member');
    } finally {
      setDeleteLoading(false);
    }
  };

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedMembers = React.useMemo(() => {
    if (!sortConfig) return members;
    return [...members].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Member] ?? '';
      const bValue = b[sortConfig.key as keyof Member] ?? '';
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [members, sortConfig]);

  const filteredMembers = React.useMemo(() => {
    if (!searchTerm) return sortedMembers;
    return sortedMembers.filter(member => {
      return (
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [sortedMembers, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

  // Reset to first page when search term changes, or adjust page if current page is empty
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Adjust current page if it becomes invalid after data changes
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const startItem = startIndex + 1;
    const endItem = Math.min(endIndex, filteredMembers.length);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200 gap-4">
        <div className="flex items-center text-sm text-gray-700">
          Showing {startItem} to {endItem} of {filteredMembers.length} results
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-2 sm:px-3 py-1 rounded-md text-sm font-medium ${
              currentPage === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:text-red-600 hover:bg-gray-100'
            }`}
          >
            Previous
          </button>
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-2 sm:px-3 py-1 rounded-md text-sm font-medium ${
                    page === currentPage
                      ? 'bg-red-600 text-white'
                      : 'text-gray-700 hover:text-red-600 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-2 sm:px-3 py-1 rounded-md text-sm font-medium ${
              currentPage === totalPages
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:text-red-600 hover:bg-gray-100'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronDown className="w-4 h-4 ml-1 opacity-0" />;
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="w-4 h-4 ml-1" /> : 
      <ChevronDown className="w-4 h-4 ml-1" />;
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Clear error when success message is shown
  useEffect(() => {
    if (successMessage) {
      setError(null);
    }
  }, [successMessage]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Sidebar for md+ */}
      <div className="hidden md:block">
        <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={undefined} />
      </div>
      
      <main
        className="flex-1 p-4 md:p-8 pb-20 transition-all duration-300"
        style={isMdUp ? { marginLeft: sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED } : {}}
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Members</h1>
            <p className="text-gray-600 text-sm mt-1">
              {members.length} {members.length === 1 ? 'member' : 'members'} total
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search members..."
                className="pl-10 pr-4 py-2 border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* <button className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
              <UserPlus className="w-5 h-5 mr-2" />
              Add Member
            </button> */}
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setSuccessMessage('')}
                    className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
                  >
                    <span className="sr-only">Dismiss</span>
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{members.length}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <UserPlus className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {members.filter(m => m.role === 'ADMIN').length}
                </p>
              </div>
              <div className="bg-red-100 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Flagged Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {members.filter(m => m.role === 'FLAGGED').length}
                </p>
              </div>
              <div className="bg-orange-100 p-2 rounded-lg">
                <Flag className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Suspended</p>
                <p className="text-2xl font-bold text-gray-900">
                  {members.filter(m => m.role === 'SUSPENDED').length}
                </p>
              </div>
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Ban className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            </div>
          ) : error ? (
            <div className="p-6 text-red-600 flex flex-col items-center">
              <AlertCircle className="w-10 h-10 mb-2" />
              <p>{error}</p>
              <button 
                onClick={fetchMembers} 
                className="mt-4 text-red-600 hover:text-red-800 flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Try Again
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('name')}
                    >
                      <div className="flex items-center">
                        Name
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('email')}
                    >
                      <div className="flex items-center">
                        Email
                        {getSortIcon('email')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('role')}
                    >
                      <div className="flex items-center">
                        Role
                        {getSortIcon('role')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('createdAt')}
                    >
                      <div className="flex items-center">
                        Joined
                        {getSortIcon('createdAt')}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMembers.length > 0 ? (
                    paginatedMembers.map(member => (
                      <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              {member.profileImage ? (
                                <img className="h-10 w-10 rounded-full" src={member.profileImage} alt="" />
                              ) : (
                                <User className="h-5 w-5 text-gray-500" />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{member.name}</div>
                              <div className="text-sm text-gray-600">@{member.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {member.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            member.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                            member.role === 'WRITER' ? 'bg-blue-100 text-blue-800' :
                            member.role === 'SUSPENDED' ? 'bg-yellow-100 text-yellow-800' :
                            member.role === 'FLAGGED' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(member.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => router.push(`/admin/members/${member.id}`)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                              title="View details"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleAction(member.id, 'suspend')}
                              disabled={actionLoading === member.id + 'suspend' || member.role === 'SUSPENDED'}
                              className={`p-1 rounded transition-colors disabled:opacity-50 ${
                                member.role === 'SUSPENDED' 
                                  ? 'text-yellow-300 cursor-not-allowed bg-yellow-50'
                                  : 'text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50'
                              }`}
                              title={member.role === 'SUSPENDED' ? 'Already suspended' : 'Suspend'}
                            >
                              {actionLoading === member.id + 'suspend' ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <Ban className="h-5 w-5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleAction(member.id, 'flag')}
                              disabled={actionLoading === member.id + 'flag' || member.role === 'FLAGGED'}
                              className={`p-1 rounded transition-colors disabled:opacity-50 ${
                                member.role === 'FLAGGED' 
                                  ? 'text-orange-300 cursor-not-allowed bg-orange-50'
                                  : 'text-orange-600 hover:text-orange-900 hover:bg-orange-50'
                              }`}
                              title={member.role === 'FLAGGED' ? 'Already flagged' : 'Flag user'}
                            >
                              {actionLoading === member.id + 'flag' ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <Flag className="h-5 w-5" />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setMemberToDelete(member);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Delete member"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-600">
                        {searchTerm ? 'No members match your search' : 'No members found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {renderPagination()}
            </div>
          )}
        </div>
        
        {/* Delete Confirmation Modal */}
        {showDeleteModal && memberToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl border border-gray-200">
              <div className="flex items-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600 mr-2" />
                <h3 className="text-lg font-bold text-gray-900">Delete Member</h3>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to delete this member? This action cannot be undone.
                </p>
                <div className="bg-gray-50 rounded-lg p-3 border">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      {memberToDelete.profileImage ? (
                        <img className="h-10 w-10 rounded-full" src={memberToDelete.profileImage} alt="" />
                      ) : (
                        <User className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{memberToDelete.name}</div>
                      <div className="text-sm text-gray-600">{memberToDelete.email}</div>
                      <div className="text-xs text-gray-500">@{memberToDelete.username}</div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ This will permanently delete all user data, articles, and transaction history.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 text-gray-800"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setMemberToDelete(null);
                  }}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                  onClick={handleDeleteMember}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <span className="animate-spin">...</span>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5 mr-2" />
                      Delete Member
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom nav for mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <AdminMobileNav userName={undefined} />
      </div>
    </div>
  );
};

export default AdminMembers;