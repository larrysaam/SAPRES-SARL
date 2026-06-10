import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CardSkeleton } from '../components/Skeleton';
import toast from '../components/Toast';
import settingsService from '../services/settingsService';
import type { Settings } from '../types';

const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getSettings,
  });

  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    logo: '',
    email: '',
    phone: '',
    address: '',
    website: '',
  });

  const [socialMedia, setSocialMedia] = useState({
    facebook: '',
    twitter: '',
    linkedin: '',
    instagram: '',
    youtube: '',
  });

  const [seo, setSeo] = useState({
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    googleAnalyticsId: '',
  });

  const [paymentSettings, setPaymentSettings] = useState({
    mtnMomo: { enabled: false, merchantCode: '' },
    orangeMoney: { enabled: false, merchantCode: '' },
    whatsapp: { enabled: false, number: '' },
  });

  const [recruitment, setRecruitment] = useState({
    notifyEmail: false,
    notifySms: false,
    notifyWhatsapp: false,
    autoReplyEmail: '',
  });

  const [appearance, setAppearance] = useState({
    primaryColor: '#4F46E5',
    faviconUrl: '',
  });

  useEffect(() => {
    if (settings) {
      // Company Info
      setCompanyInfo({
        name: settings.company?.name || '',
        logo: settings.company?.logo || '',
        email: settings.company?.email || '',
        phone: settings.company?.phone || '',
        address: settings.company?.address || '',
        website: settings.company?.website || '',
      });

      // Social Media
      setSocialMedia({
        facebook: settings.social?.facebook || '',
        twitter: settings.social?.twitter || '',
        linkedin: settings.social?.linkedin || '',
        instagram: settings.social?.instagram || '',
        youtube: settings.social?.youtube || '',
      });

      // SEO
      setSeo({
        metaTitle: settings.seo?.metaTitle || '',
        metaDescription: settings.seo?.metaDescription || '',
        keywords: settings.seo?.keywords || '',
        googleAnalyticsId: settings.seo?.googleAnalyticsId || '',
      });

      // Payment
      setPaymentSettings({
        mtnMomo: { enabled: settings.payment?.mtnMomo?.enabled || false, merchantCode: settings.payment?.mtnMomo?.merchantCode || '' },
        orangeMoney: { enabled: settings.payment?.orangeMoney?.enabled || false, merchantCode: settings.payment?.orangeMoney?.merchantCode || '' },
        whatsapp: { enabled: settings.payment?.whatsapp?.enabled || false, number: settings.payment?.whatsapp?.number || '' },
      });

      // Recruitment
      setRecruitment({
        notifyEmail: settings.recruitment?.notifyEmail || false,
        notifySms: settings.recruitment?.notifySms || false,
        notifyWhatsapp: settings.recruitment?.notifyWhatsapp || false,
        autoReplyEmail: settings.recruitment?.autoReplyEmail || '',
      });

      // Appearance
      setAppearance({
        primaryColor: settings.appearance?.primaryColor || '#4F46E5',
        faviconUrl: settings.appearance?.faviconUrl || '',
      });
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<Settings>) => settingsService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved successfully');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to save settings'),
  });

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
  const btnPrimary =
    'px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const btnSecondary =
    'px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors';

  const renderSection = (
    title: string,
    description: string,
    children: React.ReactNode,
    onSave: () => void
  ) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={onSave}
          className={btnPrimary}
          disabled={updateSettingsMutation.isPending}
        >
          {updateSettingsMutation.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {[1, 2, 3, 4, 5, 6].map((i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
          {(error as any)?.message || 'Failed to load settings'}
        </div>
      </div>
    );
  }

  const handleSaveCompany = () => {
    updateSettingsMutation.mutate({
      company: companyInfo,
    });
  };

  const handleSaveSocial = () => {
    updateSettingsMutation.mutate({
      social: socialMedia,
    });
  };

  const handleSaveSeo = () => {
    updateSettingsMutation.mutate({
      seo: {
        ...seo,
        keywords: seo.keywords.split(',').map((k) => k.trim()).filter(Boolean).join(', '),
      },
    });
  };

  const handleSavePayment = () => {
    updateSettingsMutation.mutate({
      payment: paymentSettings,
    });
  };

  const handleSaveRecruitment = () => {
    updateSettingsMutation.mutate({
      recruitment: recruitment,
    });
  };

  const handleSaveAppearance = () => {
    updateSettingsMutation.mutate({
      appearance: appearance,
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure your application settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Company Info */}
        {renderSection('Company Information', 'Manage your company details', <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Company Name</label>
              <input className={inputClass} value={companyInfo.name} onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Logo URL</label>
              <input className={inputClass} value={companyInfo.logo} onChange={(e) => setCompanyInfo({ ...companyInfo, logo: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" className={inputClass} value={companyInfo.email} onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input type="tel" className={inputClass} value={companyInfo.phone} onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Address</label>
              <textarea className={inputClass} rows={2} value={companyInfo.address} onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Website</label>
              <input className={inputClass} value={companyInfo.website} onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })} placeholder="https://..." />
            </div>
          </div>
        </>, handleSaveCompany)}

        {/* Social Media */}
        {renderSection('Social Media', 'Manage social media links', <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Facebook URL</label>
              <input className={inputClass} value={socialMedia.facebook} onChange={(e) => setSocialMedia({ ...socialMedia, facebook: e.target.value })} placeholder="https://facebook.com/..." />
            </div>
            <div>
              <label className={labelClass}>Twitter URL</label>
              <input className={inputClass} value={socialMedia.twitter} onChange={(e) => setSocialMedia({ ...socialMedia, twitter: e.target.value })} placeholder="https://twitter.com/..." />
            </div>
            <div>
              <label className={labelClass}>LinkedIn URL</label>
              <input className={inputClass} value={socialMedia.linkedin} onChange={(e) => setSocialMedia({ ...socialMedia, linkedin: e.target.value })} placeholder="https://linkedin.com/..." />
            </div>
            <div>
              <label className={labelClass}>Instagram URL</label>
              <input className={inputClass} value={socialMedia.instagram} onChange={(e) => setSocialMedia({ ...socialMedia, instagram: e.target.value })} placeholder="https://instagram.com/..." />
            </div>
            <div>
              <label className={labelClass}>YouTube URL</label>
              <input className={inputClass} value={socialMedia.youtube} onChange={(e) => setSocialMedia({ ...socialMedia, youtube: e.target.value })} placeholder="https://youtube.com/..." />
            </div>
          </div>
        </>, handleSaveSocial)}

        {/* SEO */}
        {renderSection('SEO Settings', 'Manage search engine optimization', <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Meta Title</label>
              <input className={inputClass} value={seo.metaTitle} onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Google Analytics ID</label>
              <input className={inputClass} value={seo.googleAnalyticsId} onChange={(e) => setSeo({ ...seo, googleAnalyticsId: e.target.value })} placeholder="G-XXXXXXXXXX" />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Meta Description</label>
              <textarea className={inputClass} rows={2} value={seo.metaDescription} onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Keywords (comma separated)</label>
              <input className={inputClass} value={seo.keywords} onChange={(e) => setSeo({ ...seo, keywords: e.target.value })} placeholder="construction, building, engineering" />
            </div>
          </div>
        </>, handleSaveSeo)}

        {/* Payment Settings */}
        {renderSection('Payment Settings', 'Configure payment methods', <>
          <div className="space-y-6">
            {/* MTN MoMo */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">MTN MoMo</h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentSettings.mtnMomo.enabled}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, mtnMomo: { ...paymentSettings.mtnMomo, enabled: e.target.checked } })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600" />
                </label>
              </div>
              {paymentSettings.mtnMomo.enabled && (
                <div>
                  <label className={labelClass}>Merchant Code</label>
                  <input className={inputClass} value={paymentSettings.mtnMomo.merchantCode} onChange={(e) => setPaymentSettings({ ...paymentSettings, mtnMomo: { ...paymentSettings.mtnMomo, merchantCode: e.target.value } })} />
                </div>
              )}
            </div>

            {/* Orange Money */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Orange Money</h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentSettings.orangeMoney.enabled}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, orangeMoney: { ...paymentSettings.orangeMoney, enabled: e.target.checked } })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600" />
                </label>
              </div>
              {paymentSettings.orangeMoney.enabled && (
                <div>
                  <label className={labelClass}>Merchant Code</label>
                  <input className={inputClass} value={paymentSettings.orangeMoney.merchantCode} onChange={(e) => setPaymentSettings({ ...paymentSettings, orangeMoney: { ...paymentSettings.orangeMoney, merchantCode: e.target.value } })} />
                </div>
              )}
            </div>

            {/* WhatsApp */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">WhatsApp</h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentSettings.whatsapp.enabled}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, whatsapp: { ...paymentSettings.whatsapp, enabled: e.target.checked } })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600" />
                </label>
              </div>
              {paymentSettings.whatsapp.enabled && (
                <div>
                  <label className={labelClass}>WhatsApp Number</label>
                  <input className={inputClass} value={paymentSettings.whatsapp.number} onChange={(e) => setPaymentSettings({ ...paymentSettings, whatsapp: { ...paymentSettings.whatsapp, number: e.target.value } })} placeholder="+237XXXXXXXXX" />
                </div>
              )}
            </div>
          </div>
        </>, handleSavePayment)}

        {/* Recruitment */}
        {renderSection('Recruitment Settings', 'Configure recruitment notifications', <>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Email Notifications</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Receive email notifications for new applications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={recruitment.notifyEmail} onChange={(e) => setRecruitment({ ...recruitment, notifyEmail: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600" />
              </label>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">SMS Notifications</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Receive SMS notifications for new applications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={recruitment.notifySms} onChange={(e) => setRecruitment({ ...recruitment, notifySms: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600" />
              </label>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">WhatsApp Notifications</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Receive WhatsApp notifications for new applications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={recruitment.notifyWhatsapp} onChange={(e) => setRecruitment({ ...recruitment, notifyWhatsapp: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600" />
              </label>
            </div>
            <div>
              <label className={labelClass}>Auto-Reply Email</label>
              <input type="email" className={inputClass} value={recruitment.autoReplyEmail} onChange={(e) => setRecruitment({ ...recruitment, autoReplyEmail: e.target.value })} placeholder="reply@example.com" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email address to send auto-replies to applicants</p>
            </div>
          </div>
        </>, handleSaveRecruitment)}

        {/* Appearance */}
        {renderSection('Appearance', 'Manage visual appearance settings', <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={appearance.primaryColor}
                  onChange={(e) => setAppearance({ ...appearance, primaryColor: e.target.value })}
                  className="h-10 w-16 border border-gray-300 dark:border-gray-600 rounded cursor-pointer bg-white dark:bg-gray-700"
                />
                <input
                  className={inputClass}
                  value={appearance.primaryColor}
                  onChange={(e) => setAppearance({ ...appearance, primaryColor: e.target.value })}
                  placeholder="#4F46E5"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Favicon URL</label>
              <input className={inputClass} value={appearance.faviconUrl} onChange={(e) => setAppearance({ ...appearance, faviconUrl: e.target.value })} placeholder="https://..." />
            </div>
          </div>
        </>, handleSaveAppearance)}
      </div>
    </div>
  );
};

export default SettingsPage;