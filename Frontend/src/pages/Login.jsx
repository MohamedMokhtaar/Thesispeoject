import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, Lock, ShieldCheck, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { clearUser, getRedirectPath, setUser } from '../utils/auth';

const Login = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        clearUser();

        try {
            const response = await client.post('/auth/login', {
                username: username.trim(),
                password,
                login_channel: 'WEB'
            });

            if (response.data.success) {
                setUser(response.data.user);
                const path = getRedirectPath(response.data.user.role_name);
                navigate(path);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Check connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
                <div className="mb-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white">
                        <ShieldCheck size={26} />
                    </div>
                    <h1 className="mt-4 text-2xl font-semibold text-black">Sign In</h1>
                    <p className="mt-1 text-sm text-gray-600">Thesis Management Portal</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs text-red-600">{error}</div>}

                    <div>
                        <label className="mb-1 block text-sm font-medium text-black">Username</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                <User size={16} />
                            </span>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm text-black outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                placeholder="Enter username"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-black">Password</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                <Lock size={16} />
                            </span>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-9 text-sm text-black outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                placeholder="Enter password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-blue-600"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
