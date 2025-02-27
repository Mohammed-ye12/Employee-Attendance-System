import React, { useState } from 'react';
import { KeyRound, AlertCircle } from 'lucide-react';

interface Props {
  onLogin: (code: string) => void;
}

export function AdminLogin({ onLogin }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === 'ADMIN123') {
      onLogin(code);
    } else {
      setError('Invalid administrator access code');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
      <div className="flex items-center gap-2 mb-6">
        <KeyRound className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Administrator Access</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700">
            Admin Access Code
          </label>
          <input
            type="password"
            id="code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError('');
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            required
          />
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
              <AlertCircle className="w-4 h-4" />
              <p>{error}</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
        >
          Access Admin Dashboard
        </button>
      </form>
    </div>
  );
}