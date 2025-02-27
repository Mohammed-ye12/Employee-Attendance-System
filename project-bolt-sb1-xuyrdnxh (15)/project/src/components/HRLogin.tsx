import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';

interface Props {
  onLogin: (code: string) => void;
}

export function HRLogin({ onLogin }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === 'Akram') { // Changed from HR123 to Akram
      onLogin(code);
    } else {
      setError('Invalid HR access code');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
      <div className="flex items-center gap-2 mb-6">
        <KeyRound className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">HR Access (Akram)</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700">
            HR Access Code
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
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
        >
          Access HR Dashboard
        </button>
      </form>
    </div>
  );
}