import React, { useEffect, useState } from 'react';
import { LockKeyhole, Settings2, Users2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import TabbedPageShell from '../components/TabbedPageShell';
import settingsService from '../api/settingsService';

const tabs = [
    { key: 'roles-users', label: 'Roles & Users' },
    { key: 'system-config', label: 'System Config' }
];

const tabConfig = {
    'roles-users': {
        icon: Users2,
        title: 'Roles & Users',
        description: 'Manage access levels and user account permissions.'
    },
    'system-config': {
        icon: Settings2,
        title: 'System Configuration',
        description: 'Control global settings for system behavior and defaults.'
    }
};

const credentialFilters = [
    { key: 'students', label: 'Students' },
    { key: 'teachers', label: 'Teachers' },
    { key: 'faculty', label: 'Faculty' },
    { key: 'exams', label: 'Exams' }
];

const Settings = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const rawTab = searchParams.get('tab') || 'roles-users';
    const activeTab = tabs.some((tab) => tab.key === rawTab) ? rawTab : 'roles-users';
    const section = tabConfig[activeTab];
    const Icon = section.icon;
    const [credentialFilter, setCredentialFilter] = useState('students');
    const [searchText, setSearchText] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [credentialRows, setCredentialRows] = useState([]);

    const onTabChange = (tab) => {
        const next = new URLSearchParams(searchParams);
        next.set('tab', tab);
        setSearchParams(next);
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedSearch(searchText.trim());
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchText]);

    useEffect(() => {
        if (activeTab !== 'roles-users') return;

        const loadCredentials = async () => {
            setLoading(true);
            setErrorMessage('');
            try {
                const res = await settingsService.listCredentials(credentialFilter, debouncedSearch);
                if (res.success) setCredentialRows(res.data || []);
            } catch (error) {
                setErrorMessage(error?.response?.data?.message || 'Failed to load credentials.');
            } finally {
                setLoading(false);
            }
        };

        loadCredentials();
    }, [activeTab, credentialFilter, debouncedSearch]);

    const searchPlaceholder =
        credentialFilter === 'students'
            ? 'Search by student ID, name, or username'
            : credentialFilter === 'teachers'
              ? 'Search by teacher ID, name, or username'
              : 'Search by username';

    return (
        <TabbedPageShell
            title="Settings"
            description="System-level configuration and user access control."
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon size={18} />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-black">{section.title}</h2>
                    <p className="text-sm text-gray-600">{section.description}</p>
                </div>
            </div>

            <div className="mt-6 space-y-4">
                {activeTab === 'roles-users' ? (
                    <div className="space-y-4">
                        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap gap-2">
                                {credentialFilters.map((item) => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        onClick={() => setCredentialFilter(item.key)}
                                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                                            credentialFilter === item.key
                                                ? 'bg-blue-600 text-white'
                                                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="text"
                                value={searchText}
                                onChange={(event) => setSearchText(event.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-sm"
                            />
                        </div>

                        {errorMessage && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div>
                        )}

                        {(credentialFilter === 'faculty' || credentialFilter === 'exams') && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                Plain passwords are not stored for this group. Use username with password reset flow.
                            </div>
                        )}

                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Account ID</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Username</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Password</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && (
                                        <tr>
                                            <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">Loading.....</td>
                                        </tr>
                                    )}
                                    {!loading &&
                                        credentialRows.map((row) => (
                                            <tr key={`${row.type}-${row.cred_no}`} className="border-b border-gray-100 text-sm hover:bg-blue-50/50">
                                                <td className="px-3 py-2 text-gray-800">{row.account_id || '-'}</td>
                                                <td className="px-3 py-2 text-gray-800">{row.full_name || '-'}</td>
                                                <td className="px-3 py-2 text-gray-800">{row.username || '-'}</td>
                                                <td className="px-3 py-2 font-mono text-gray-900">{row.plain_password || 'Not available'}</td>
                                                <td className="px-3 py-2 text-gray-700">{row.created_at || '-'}</td>
                                            </tr>
                                        ))}
                                    {!loading && credentialRows.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">No records found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="rounded-xl border border-gray-200 p-4">
                            <p className="text-sm font-semibold text-black">Access Policy</p>
                            <p className="mt-1 text-sm text-gray-600">
                                Role-based rendering remains linked to <code>role_name</code> for stable permission control.
                            </p>
                        </div>
                        <div className="rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <LockKeyhole size={16} className="text-blue-600" />
                                <span>Security section in header is intentionally disabled for now as requested.</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </TabbedPageShell>
    );
};

export default Settings;
