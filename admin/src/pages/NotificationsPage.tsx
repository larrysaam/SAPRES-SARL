import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import Modal from '../components/Modal';
import toast from '../components/Toast';
import type { Notification, NotificationTemplate } from '../types';

// Mock data - in production, connect to real API endpoints
const mockNotifications: Notification[] = [];
const mockTemplates: NotificationTemplate[] = [
  { _id: '1', name: 'Order Confirmation', type: 'email', subject: 'Your order has been confirmed', content: 'Dear customer, your order #{{orderNumber}} has been confirmed.', variables: ['orderNumber'], isActive: true, createdAt: '2024-01-01' },
  { _id: '2', name: 'Application Received', type: 'email', subject: 'Application Received', content: 'Dear {{firstName}}, we have received your application for {{jobTitle}}.', variables: ['firstName', 'jobTitle'], isActive: true, createdAt: '2024-01-01' },
  { _id: '3', name: 'Low Stock Alert', type: 'system', subject: '', content: 'Product {{productName}} has low stock ({{stock}} remaining).', variables: ['productName', 'stock'], isActive: true, createdAt: '2024-01-01' },
];

const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<'alerts' | 'templates'>('alerts');
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({ name: '', type: 'email' as 'email' | 'sms' | 'whatsapp' | 'system', subject: '', content: '', variables: '', isActive: true });

  const { data: templates } = useQuery({
    queryKey: ['notificationTemplates'],
    queryFn: async () => mockTemplates,
  });

  const saveTemplateMutation = useMutation({
    mutationFn: (data: { name: string; type: 'email' | 'sms' | 'whatsapp' | 'system'; subject: string; content: string; variables: string; isActive: boolean }) => {
      return new Promise((resolve) => setTimeout(() => resolve(data), 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationTemplates'] });
      toast.success('Template saved');
      setIsTemplateOpen(false);
      resetForm();
    },
    onError: () => toast.error('Failed to save template'),
  });

  const resetForm = () => { setEditingTemplate(null); setTemplateForm({ name: '', type: 'email', subject: '', content: '', variables: '', isActive: true }); };

  const typeColors: Record<string, string> = {
    email: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    sms: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    whatsapp: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    system: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  };

  const templateColumns: Column<NotificationTemplate>[] = [
    { key: 'name', header: 'Name', render: (t) => <span className="font-medium">{t.name}</span> },
    { key: 'type', header: 'Type', render: (t) => <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[t.type]}`}>{t.type.toUpperCase()}</span> },
    { key: 'subject', header: 'Subject', render: (t) => <span className="text-gray-500">{t.subject || '-'}</span> },
    { key: 'isActive', header: 'Status', render: (t) => <span className={`px-2 py-1 text-xs font-medium rounded-full ${t.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{t.isActive ? 'Active' : 'Inactive'}</span> },
  ];

  const inputClass = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications Center</h1>

      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <button onClick={() => setActiveSection('alerts')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeSection === 'alerts' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>System Alerts</button>
        <button onClick={() => setActiveSection('templates')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeSection === 'templates' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>Notification Templates</button>
      </div>

      {activeSection === 'alerts' && (
        <div className="space-y-4">
          {/* Low Stock Alerts */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">⚠ Low Stock Alerts</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">No low stock alerts at this time.</p>
          </div>
          {/* New Order Alerts */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">📦 New Orders</h3>
            <p className="text-sm text-blue-700 dark:text-blue-400">No new orders to review.</p>
          </div>
          {/* Recruitment Alerts */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">👤 Recruitment Updates</h3>
            <p className="text-sm text-green-700 dark:text-green-400">No pending applications.</p>
          </div>
        </div>
      )}

      {activeSection === 'templates' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => { resetForm(); setIsTemplateOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
              <PlusIcon className="h-4 w-4" /> New Template
            </button>
          </div>
          <DataTable
            columns={templateColumns}
            data={templates || []}
            page={1}
            totalPages={1}
            actions={(t: NotificationTemplate) => (
              <button onClick={() => { setEditingTemplate(t); setTemplateForm({ name: t.name, type: t.type, subject: t.subject || '', content: t.content, variables: t.variables.join(', '), isActive: t.isActive }); setIsTemplateOpen(true); }} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"><PencilIcon className="h-4 w-4" /></button>
            )}
          />
        </div>
      )}

      {/* Template Modal */}
      <Modal isOpen={isTemplateOpen} onClose={() => { setIsTemplateOpen(false); resetForm(); }} title={editingTemplate ? 'Edit Template' : 'New Template'} size="lg">
        <form onSubmit={(e) => { e.preventDefault(); saveTemplateMutation.mutate(templateForm); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label><input className={inputClass} value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} required /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label><select className={inputClass} value={templateForm.type} onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value as any })}><option value="email">Email</option><option value="sms">SMS</option><option value="whatsapp">WhatsApp</option><option value="system">System</option></select></div>
          </div>
          {templateForm.type !== 'system' && (
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label><input className={inputClass} value={templateForm.subject} onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })} /></div>
          )}
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label><textarea className={inputClass} rows={4} value={templateForm.content} onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })} required placeholder="Use {{variableName}} for dynamic content" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Variables (comma separated)</label><input className={inputClass} value={templateForm.variables} onChange={(e) => setTemplateForm({ ...templateForm, variables: e.target.value })} placeholder="orderNumber, firstName, productName" /></div>
          <div className="flex items-center gap-2"><input type="checkbox" checked={templateForm.isActive} onChange={(e) => setTemplateForm({ ...templateForm, isActive: e.target.checked })} className="rounded border-gray-300 dark:border-gray-600" /><label className="text-sm text-gray-700 dark:text-gray-300">Active</label></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setIsTemplateOpen(false); resetForm(); }} className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg">Cancel</button>
            <button type="submit" disabled={saveTemplateMutation.isPending} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">{saveTemplateMutation.isPending ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default NotificationsPage;
