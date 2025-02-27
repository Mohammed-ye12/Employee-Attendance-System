import React, { useState, useEffect } from 'react';
import { UserPlus, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import type { EmployeeRegistration, Department, EngineeringSection } from '../types';
import { checkExistingEmployee, registerEmployee, autoLogin } from '../lib/auth';

interface Props {
  onRegister: (data: EmployeeRegistration) => void;
  existingEmployee: EmployeeRegistration | null;
  onExistingEmployee?: () => void;
}

const departments: Department[] = [
  'Operations',
  'Engineering',
  'Human Resource',
  'Finance',
  'Safety',
  'IT',
  'Security',
  'Planning',
  'Others'
];

const engineeringSections: EngineeringSection[] = [
  'QC',
  'RTG',
  'MES',
  'Shift Incharge',
  'Planning',
  'Store',
  'Infra',
  'Others'
];

export function EmployeeRegistration({ onRegister, existingEmployee, onExistingEmployee }: Props) {
  const [employeeCode, setEmployeeCode] = useState(existingEmployee?.id || '');
  const [fullName, setFullName] = useState(existingEmployee?.fullName || '');
  const [department, setDepartment] = useState<Department>(existingEmployee?.department || 'Operations');
  const [section, setSection] = useState<EngineeringSection | undefined>(existingEmployee?.section);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExistingEmployee, setIsExistingEmployee] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAutoLogin();
  }, []);

  useEffect(() => {
    if (employeeCode.length >= 3) {
      checkEmployeeExists(employeeCode);
    } else {
      setIsExistingEmployee(false);
      setIsApproved(false);
    }
  }, [employeeCode]);

  const checkAutoLogin = async () => {
    const profile = await autoLogin();
    if (profile) {
      setIsExistingEmployee(true);
      setIsApproved(profile.is_approved);
      if (profile.is_approved && onExistingEmployee) {
        onExistingEmployee();
      }
    }
    setIsLoading(false);
  };

  const checkEmployeeExists = async (code: string) => {
    const profile = await checkExistingEmployee(code);
    if (profile) {
      setIsExistingEmployee(true);
      setIsApproved(profile.is_approved);
      if (profile.is_approved && onExistingEmployee) {
        onExistingEmployee();
      }
    } else {
      setIsExistingEmployee(false);
      setIsApproved(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeCode.trim()) {
      setError('Employee code is required');
      return;
    }
    
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (department === 'Engineering' && !section) {
      setError('Section is required for Engineering department');
      return;
    }

    if (isExistingEmployee) {
      if (onExistingEmployee && isApproved) {
        onExistingEmployee();
      }
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await registerEmployee({
        id: employeeCode,
        fullName,
        department,
        section: department === 'Engineering' ? section : undefined
      });

      if (result.success && result.profile) {
        setSuccess(true);
        onRegister({
          id: result.profile.id,
          fullName: result.profile.full_name,
          department: result.profile.department,
          section: result.profile.section || undefined,
          role: 'employee',
          approved: result.profile.is_approved
        });
      } else if (result.profile) {
        setIsExistingEmployee(true);
        setIsApproved(result.profile.is_approved);
        if (onExistingEmployee && result.profile.is_approved) {
          onExistingEmployee();
        }
      } else {
        throw new Error(result.error?.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Failed to register. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isExistingEmployee) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Account Exists</h2>
        </div>
        <p className="text-gray-600 mb-6">
          An account with employee code {employeeCode} already exists.
          {isApproved 
            ? ' You can proceed to register your shift.'
            : ' Your registration is pending approval from the administrator.'}
        </p>
        {isApproved && onExistingEmployee && (
          <button
            onClick={onExistingEmployee}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition duration-200 flex items-center justify-center gap-2 text-lg"
          >
            Continue to Shift Registration
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-800">Registration Successful</h2>
        </div>
        <p className="text-gray-600 mb-4">
          Your registration has been submitted successfully and is pending approval from the administrator.
          You will be able to register your shifts once your registration is approved.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <h3 className="font-medium text-green-800 mb-2">Registration Details:</h3>
          <ul className="text-green-700 space-y-1">
            <li>Employee Code: {employeeCode}</li>
            <li>Name: {fullName}</li>
            <li>Department: {department}</li>
            {section && <li>Section: {section}</li>}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
      <div className="flex items-center gap-2 mb-6">
        <UserPlus className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Employee Registration</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="employeeCode" className="block text-sm font-medium text-gray-700">
            Employee Code
          </label>
          <input
            type="text"
            id="employeeCode"
            value={employeeCode}
            onChange={(e) => {
              setEmployeeCode(e.target.value.toUpperCase());
              setError('');
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            required
            placeholder="Enter your employee code"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setError('');
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            required
            placeholder="Enter your full name"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700">
            Department
          </label>
          <select
            id="department"
            value={department}
            onChange={(e) => {
              const newDepartment = e.target.value as Department;
              setDepartment(newDepartment);
              if (newDepartment !== 'Engineering') {
                setSection(undefined);
              }
              setError('');
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            required
            disabled={isSubmitting}
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {department === 'Engineering' && (
          <div>
            <label htmlFor="section" className="block text-sm font-medium text-gray-700">
              Section
            </label>
            <select
              id="section"
              value={section}
              onChange={(e) => {
                setSection(e.target.value as EngineeringSection);
                setError('');
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              required
              disabled={isSubmitting}
            >
              <option value="">Select Section</option>
              {engineeringSections.map((sect) => (
                <option key={sect} value={sect}>
                  {sect}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <p>{error}</p>
          </div>
        )}

        <button
          type="submit"
          className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 flex items-center justify-center ${
            isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Registering...
            </>
          ) : (
            'Register'
          )}
        </button>
      </form>
    </div>
  );
}