import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import Modal from '../components/Modal';
import { toast } from '../components/Toast';
import userService from '../services/userService';
import authService from '../services/authService';
import type { User, UserRole } from '../types';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'super-admin', label: 'Super Admin' },
  { value: 'hr-admin', label: 'HR Admin' },
  { value: 'sales-admin', label: 'Sales Admin' },
  { value: 'content-admin', label: 'Content Admin' },
  { value: 'inventory-admin', label: 'Inventory Admin' },
];

const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'sales-admin' as UserRole });

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, roleFilter],
    queryFn: () => userService.getUsers({ page, limit: 10, role: roleFilter || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => userService.createUser(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('User created'); setIsCreateOpen(false); resetForm(); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create user'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => userService.updateUser(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('User updated'); setIsEditOpen(false); setSelectedUser(null); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update user'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => userService.updateUserStatus(id, isActive),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('User status updated'); },
    onError: () => toast.error('Failed to update status'),
  });

  const handleResetPassword = (user: User) => {
    authService.forgotPassword(user.email).then(() => toast.success(`Password reset email sent to ${user.email}`)).catch(() => toast.error('Failed to send reset email'));
  };

  const resetForm = () => setForm({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'sales-admin' });

  const inputClass = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500';

  const roleColors: Record<string, string> = {
    'super-admin': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    'hr-admin': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'sales-admin': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'content-admin': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'inventory-admin': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  };

  const columns: Column<User>[] = [
    { key: 'name', header: 'Name', render: (u) => <span className="font-medium">{u.firstName} {u.lastName}</span> },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (u) => <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColors[u.role]}`}>{ROLES.find(r => r.value === u.role)?.label || u.role}</span> },
    { key: 'isActive', header: 'Status', render: (u) => <span className={`px-2 py-1 text-xs font-medium rounded-full ${u.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>{u.isActive ? 'Active' : 'Inactive'}</span> },
    { key: 'lastLogin', header: 'Last Login', render: (u) => <span className="text-gray-500 dark:text-gray-400">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</span> },
    { key: 'createdAt', header: 'Created', render: (u) => new Date(u.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <PlusIcon className="h-4 w-4" /> Add User
        </button>
      </div>

      <div className="flex gap-4">
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        loading={isLoading}
        page={page}
        totalPages={data?.totalPages || 1}
        onPageChange={setPage}
        actions={(user: User) => (
          <div className="flex items-center gap-1">
            <button onClick={() => { setSelectedUser(user); setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone || '', password: '', role: user.role }); setIsEditOpen(true); }} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400"><PencilIcon className="h-4 w-4" /></button>
            <button onClick={() => toggleStatusMutation.mutate({ id: user._id, isActive: !user.isActive })} className={`p-1.5 rounded-lg ${user.isActive ? 'text-red-600 hover:bg-red-50 dark:text-red-400' : 'text-green-600 hover:bg-green-50 dark:text-green-400'}`} title={user.isActive ? 'Deactivate' : 'Activate'}>{user.isActive ? 'D' : 'A'}</button>
            <button onClick={() => handleResetPassword(user)} className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400" title="Reset Password">P</button>
          </div>
        )}
      />

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create User" size="md">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label><input className={inputClass} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label><input className={inputClass} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label><input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label><input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label><input type="password" className={inputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label><select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>{ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">{createMutation.isPending ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setSelectedUser(null); }} title="Edit User" size="md">
        <form onSubmit={(e) => { e.preventDefault(); if (selectedUser) updateMutation.mutate({ id: selectedUser._id, data: { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, role: form.role } }); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label><input className={inputClass} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label><input className={inputClass} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label><input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label><input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label><select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>{ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setIsEditOpen(false); setSelectedUser(null); }} className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg">Cancel</button>
            <button type="submit" disabled={updateMutation.isPending} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">{updateMutation.isPending ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersPage;
