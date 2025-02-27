import React, { useState } from 'react';
import { KeyRound, AlertCircle } from 'lucide-react';
import type { Employee, EngineeringSection } from '../types';

interface Props {
  onLogin: (managerId: string, password: string) => void;
  managers: Employee[];
}

export function ManagerLogin({ onLogin, managers }: Props) {
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedManagerId) {
      setError('Please select a manager');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    onLogin(selectedManagerId, password);
  };

  // Filter only engineering managers
  const engineeringManagers = Object.values(managers).filter(
    m => m.department === 'Engineering' && m.role === 'manager'
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <KeyRound className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Manager Access</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="managerId" className="block text-sm font-medium text-gray-700">
            Select Manager
          </label>
          <select
            id="managerId"
            value={selectedManagerId}
            onChange={(e) => {
              setSelectedManagerId(e.target.value);
              setError('');
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            required
          >
            <option value="">Select Manager</option>
            {engineeringManagers.map(manager => (
              <option key={manager.id} value={manager.id}>
                {manager.section} - {manager.fullName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            required
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <p>{error}</p>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
        >
          Access Manager Dashboard
        </button>
      </form>
    </div>
  );
}