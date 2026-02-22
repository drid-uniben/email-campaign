"use client";

import { useState, FormEvent, useEffect } from 'react';
import { AlertCircle, Loader2, LogIn, Mail } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { authApi } from '@/services/api'; // Import authApi directly
import { clearAllData, saveUserData, saveTokens } from '@/services/indexdb'; // For token/user data handling

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const router = useRouter();

  // No useEffect for isAuthenticated redirect needed here, as login handles it.

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setFormError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setFormError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsLoading(true);
    
    if (!email || !password) {
      setFormError('Email and password are required');
      setIsLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setFormError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await authApi.loginAdmin({ email, password });
      
      if (response.success && response.user) {
        // Since AuthProvider is not wrapping this, we manually save tokens and user data
        await saveTokens(response.accessToken!); // Access token should be present
        await saveUserData(response.user);

        // Redirect on successful login
        router.push('/admin/email-campaign'); 
      } else {
        setFormError('Login failed: Invalid response');
      }
    } catch (err: any) {
      console.error('Login submission error:', err);
      let errorMessage = 'An error occurred during login.';

      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setFormError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = formError; // Only local form errors are displayed here

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center shadow-md">
                <Image
                  src="/uniben-logo.png"
                  alt="UNIBEN Logo"
                  width={48}
                  height={48}
                  className="rounded"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-journal-maroon tracking-tight">
                  Admin Portal
                </h1>
                <p className="text-sm text-gray-600">Email Campaign & Unit Management</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Card Header */}
            <div className="bg-[#fffbfb] px-8 py-8 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Mail className="h-10 w-10 text-journal-maroon" />
              </div>
              <h2 className="text-2xl font-bold text-journal-maroon mb-2">
                Administrator Login
              </h2>
              <p className="text-journal-maroon text-sm">
                Access the email campaign and unit management dashboard
              </p>
            </div>

            {/* Card Body */}
            <div className="px-8 py-8">
              {displayError && (
                <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-800 mb-1">
                        Login Failed
                      </h4>
                      <p className="text-sm text-red-600">{displayError}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label 
                    htmlFor="email" 
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={handleEmailChange}
                    className="appearance-none block w-full px-4 py-3 border-2 border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-journal-maroon focus:border-transparent transition-all text-gray-900"
                    placeholder="admin@example.com"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label 
                    htmlFor="password" 
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={handlePasswordChange}
                    className="appearance-none block w-full px-4 py-3 border-2 border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-journal-maroon focus:border-transparent transition-all text-gray-900"
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center items-center gap-3 py-3.5 px-4 border border-transparent rounded-lg text-base font-bold text-white bg-journal-maroon hover:bg-journal-maroon-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-journal-maroon disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        <LogIn className="h-5 w-5" />
                        Log In
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-600">
            © {new Date().getFullYear()} Admin Portal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
