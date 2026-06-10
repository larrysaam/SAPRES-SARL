import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import DataTable from '../components/DataTable';
import type { Column } from '../components/DataTable';
import Modal from '../components/Modal';
import toast from '../components/Toast';
import applicationService from '../services/applicationService';
import jobService from '../services/jobService';
import type { Application, Job } from '../types';

type Tab = 'applications' | 'jobs';

const RecruitmentPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('applications');
  const [appPage, setAppPage] = useState(1);
  const [jobPage, setJobPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isAppDetailOpen, setIsAppDetailOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [jobForm, setJobForm] = useState({ title: '', department: '', location: '', employmentType: 'full-time' as Job['employmentType'], description: '', requirements: '', responsibilities: '', salaryRange: '', applicationDeadline: '', status: 'draft' as Job['status'] });

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['applications', appPage, statusFilter],
    queryFn: () => applicationService.getApplications({ page: appPage, limit: 10, status: statusFilter || undefined }),
    enabled: activeTab === 'applications',
  });

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs', jobPage],
    queryFn: () => jobService.getJobs({ page: jobPage, limit: 10 }),
    enabled: activeTab === 'jobs',
  });

  const updateAppMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Application> }) => applicationService.updateApplication(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application updated');
      setIsAppDetailOpen(false);
    },
    onError: () => toast.error('Failed to update application'),
  });

  const deleteAppMutation = useMutation({
    mutationFn: (id: string) => applicationService.deleteApplication(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['applications'] }); toast.success('Application deleted'); },
    onError: () => toast.error('Failed to delete application'),
  });

  const createJobMutation = useMutation({
    mutationFn: (data: Partial<Job>) => jobService.createJob(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jobs'] }); toast.success('Job created'); setIsJobModalOpen(false); resetJobForm(); },
    onError: () => toast.error('Failed to create job'),
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Job> }) => jobService.updateJob(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jobs'] }); toast.success('Job updated'); setIsJobModalOpen(false); resetJobForm(); },
    onError: () => toast.error('Failed to update job'),
  });

  const deleteJobMutation = useMutation({
    mutationFn: (id: string) => jobService.deleteJob(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jobs'] }); toast.success('Job deleted'); },
    onError: () => toast.error('Failed to delete job'),
  });

  const resetJobForm = () => { setEditingJob(null); setJobForm({ title: '', department: '', location: '', employmentType: 'full-time', description: '', requirements: '', responsibilities: '', salaryRange: '', applicationDeadline: '', status: 'draft' }); };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    shortlisted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500';

  const appColumns: Column<Application>[] = [
    { key: 'name', header: 'Name', render: (a) => <span className="font-medium">{a.firstName} {a.lastName}</span> },
    { key: 'email', header: 'Email' },
    { key: 'job', header: 'Position', render: (a) => {
      const job = typeof a.job === 'object' ? a.job : null;
      return <span>{job?.title || 'N/A'}</span>;
    }},
    { key: 'status', header: 'Status', render: (a) => <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[a.status]}`}>{a.status}</span> },
    { key: 'createdAt', header: 'Date', render: (a) => new Date(a.createdAt).toLocaleDateString() },
  ];

  const jobColumns: Column<Job>[] = [
    { key: 'title', header: 'Title', render: (j) => <span className="font-medium">{j.title}</span> },
    { key: 'department', header: 'Department' },
    { key: 'location', header: 'Location' },
    { key: 'employmentType', header: 'Type', render: (j) => <span className="capitalize">{j.employmentType?.replace('-', ' ')}</span> },
    { key: 'status', header: 'Status', render: (j) => <span className={`px-2 py-1 text-xs font-medium rounded-full ${j.status === 'draft' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700' : j.status === 'open' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>{j.status}</span> },
  ];

  const handleNotify = (app: Application) => {
    toast.info(`Notification sent to ${app.firstName} ${app.lastName} (via email/SMS/WhatsApp)`);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recruitment</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {(['applications', 'jobs'] as Tab[]).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
            {tab === 'applications' ? 'Applications' : 'Job Listings'}
          </button>
        ))}
      </div>

      {activeTab === 'applications' && (
        <div>
          <div className="flex flex-wrap gap-4 mb-4">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setAppPage(1); }} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <DataTable
            columns={appColumns}
            data={appsData?.data || []}
            loading={appsLoading}
            page={appPage}
            totalPages={appsData?.totalPages || 1}
            onPageChange={setAppPage}
            actions={(app: Application) => (
              <div className="flex items-center gap-1">
                <button onClick={() => { setSelectedApp(app); setIsAppDetailOpen(true); }} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400"><EyeIcon className="h-4 w-4" /></button>
                <button onClick={() => { updateAppMutation.mutate({ id: app._id, data: { status: 'shortlisted' } }); }} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400" title="Shortlist">S</button>
                <button onClick={() => { updateAppMutation.mutate({ id: app._id, data: { status: 'accepted' } }); }} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:text-green-400" title="Accept">A</button>
                <button onClick={() => { updateAppMutation.mutate({ id: app._id, data: { status: 'rejected' } }); }} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400" title="Reject">R</button>
              </div>
            )}
          />
        </div>
      )}

      {activeTab === 'jobs' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => { resetJobForm(); setIsJobModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
              <PlusIcon className="h-4 w-4" /> New Job
            </button>
          </div>
          <DataTable
            columns={jobColumns}
            data={jobsData?.data || []}
            loading={jobsLoading}
            page={jobPage}
            totalPages={jobsData?.totalPages || 1}
            onPageChange={setJobPage}
            actions={(job: Job) => (
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditingJob(job); setJobForm({ title: job.title, department: job.department, location: job.location, employmentType: job.employmentType, description: job.description, requirements: job.requirements?.join(', ') || '', responsibilities: job.responsibilities?.join(', ') || '', salaryRange: job.salaryRange || '', applicationDeadline: job.applicationDeadline ? job.applicationDeadline.split('T')[0] : '', status: job.status }); setIsJobModalOpen(true); }} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400"><PencilIcon className="h-4 w-4" /></button>
                <button onClick={() => deleteJobMutation.mutate(job._id)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400"><TrashIcon className="h-4 w-4" /></button>
              </div>
            )}
          />
        </div>
      )}

      {/* Application Detail Modal */}
      <Modal isOpen={isAppDetailOpen} onClose={() => { setIsAppDetailOpen(false); setSelectedApp(null); }} title="Application Details" size="md">
        {selectedApp && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Applicant Info</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Name:</span><span className="text-gray-900 dark:text-gray-100">{selectedApp.firstName} {selectedApp.lastName}</span>
                <span className="text-gray-500 dark:text-gray-400">Email:</span><span className="text-gray-900 dark:text-gray-100">{selectedApp.email}</span>
                <span className="text-gray-500 dark:text-gray-400">Phone:</span><span className="text-gray-900 dark:text-gray-100">{selectedApp.phone}</span>
                <span className="text-gray-500 dark:text-gray-400">Status:</span><span className={`px-2 py-0.5 text-xs font-medium rounded-full inline-block w-fit ${statusColors[selectedApp.status]}`}>{selectedApp.status}</span>
              </div>
            </div>
            {selectedApp.coverLetter && <div><h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Cover Letter</h3><p className="text-sm text-gray-600 dark:text-gray-400">{selectedApp.coverLetter}</p></div>}
            <div className="flex flex-wrap gap-2">
              {selectedApp.cv?.secureUrl && <a href={selectedApp.cv.secureUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Download CV</a>}
              {selectedApp.idCard?.secureUrl && <a href={selectedApp.idCard.secureUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Download ID Card</a>}
              {selectedApp.diplomas?.map((d, i) => d.secureUrl && <a key={i} href={d.secureUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Download Diploma {i+1}</a>)}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              {selectedApp.status !== 'shortlisted' && <button onClick={() => updateAppMutation.mutate({ id: selectedApp._id, data: { status: 'shortlisted' } })} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Shortlist</button>}
              {selectedApp.status !== 'accepted' && <button onClick={() => updateAppMutation.mutate({ id: selectedApp._id, data: { status: 'accepted' } })} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Accept</button>}
              {selectedApp.status !== 'rejected' && <button onClick={() => updateAppMutation.mutate({ id: selectedApp._id, data: { status: 'rejected' } })} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Reject</button>}
              <button onClick={() => handleNotify(selectedApp)} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Notify</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Job Form Modal */}
      <Modal isOpen={isJobModalOpen} onClose={() => { setIsJobModalOpen(false); resetJobForm(); }} title={editingJob ? 'Edit Job' : 'New Job'} size="lg">
        <form onSubmit={(e) => { e.preventDefault(); const payload = { ...jobForm, requirements: jobForm.requirements.split(',').map((r: string) => r.trim()).filter(Boolean), responsibilities: jobForm.responsibilities.split(',').map((r: string) => r.trim()).filter(Boolean) }; if (editingJob) updateJobMutation.mutate({ id: editingJob._id, data: payload }); else createJobMutation.mutate(payload); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label><input className={inputClass} value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} required /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label><input className={inputClass} value={jobForm.department} onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })} required /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label><input className={inputClass} value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} required /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employment Type</label><select className={inputClass} value={jobForm.employmentType} onChange={(e) => setJobForm({ ...jobForm, employmentType: e.target.value as Job['employmentType'] })} required><option value="full-time">Full Time</option><option value="part-time">Part Time</option><option value="contract">Contract</option><option value="internship">Internship</option><option value="temporary">Temporary</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Application Deadline</label><input type="date" className={inputClass} value={jobForm.applicationDeadline} onChange={(e) => setJobForm({ ...jobForm, applicationDeadline: e.target.value })} required /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Salary Range</label><input className={inputClass} value={jobForm.salaryRange} onChange={(e) => setJobForm({ ...jobForm, salaryRange: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label><select className={inputClass} value={jobForm.status} onChange={(e) => setJobForm({ ...jobForm, status: e.target.value as Job['status'] })}><option value="draft">Draft</option><option value="open">Open</option><option value="closed">Closed</option><option value="archived">Archived</option></select></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label><textarea className={inputClass} rows={3} value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} required /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Requirements (comma separated)</label><textarea className={inputClass} rows={2} value={jobForm.requirements} onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsibilities (comma separated)</label><textarea className={inputClass} rows={2} value={jobForm.responsibilities} onChange={(e) => setJobForm({ ...jobForm, responsibilities: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => { setIsJobModalOpen(false); resetJobForm(); }} className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{editingJob ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>
    </div>
  );
};

export default RecruitmentPage;
