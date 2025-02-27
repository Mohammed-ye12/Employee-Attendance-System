import React, { useState, useEffect } from 'react';
import { EmployeeRegistration } from './components/EmployeeRegistration';
import { ShiftRegistration } from './components/ShiftRegistration';
import { HRDashboard } from './components/HRDashboard';
import { HRLogin } from './components/HRLogin';
import { ManagersDashboard } from './components/ManagersDashboard';
import { ManagerLogin } from './components/ManagerLogin';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { OTCalculation } from './components/OTCalculation';
import { EmployeeRoster } from './components/EmployeeRoster';
import type { Employee, ShiftEntry, ShiftType, EngineeringSection, PasswordChange } from './types';
import { Building2, AlertCircle, Construction } from 'lucide-react';
import { supabase } from './lib/supabase';
import { autoLogin } from './lib/auth';

type ViewType = 'employee' | 'hr' | 'manager' | 'admin';
type EmployeeViewType = 'registration' | 'shift' | 'ot' | 'roster';

const MANAGER_PASSWORDS: Record<string, string> = {
  'QC_MGR': 'SH123',
  'RTG_MGR': 'AY123',
  'MES_MGR': 'MC123',
  'PLN_MGR': 'SA123',
  'STR_MGR': 'IF123',
  'INF_MGR': 'HD123',
  'SHIFT_MGR': 'TA123'
};

const MANAGERS: Record<string, Employee> = {
  'QC_MGR': { id: 'QC_MGR', fullName: 'QC Manager', department: 'Engineering', section: 'QC', role: 'manager' },
  'RTG_MGR': { id: 'RTG_MGR', fullName: 'RTG Manager', department: 'Engineering', section: 'RTG', role: 'manager' },
  'MES_MGR': { id: 'MES_MGR', fullName: 'MES Manager', department: 'Engineering', section: 'MES', role: 'manager' },
  'PLN_MGR': { id: 'PLN_MGR', fullName: 'Planning Manager', department: 'Engineering', section: 'Planning', role: 'manager' },
  'STR_MGR': { id: 'STR_MGR', fullName: 'Store Manager', department: 'Engineering', section: 'Store', role: 'manager' },
  'INF_MGR': { id: 'INF_MGR', fullName: 'Infra Manager', department: 'Engineering', section: 'Infra', role: 'manager' },
  'SHIFT_MGR': { id: 'SHIFT_MGR', fullName: 'Shift Manager', department: 'Engineering', section: 'Shift Incharge', role: 'manager' }
};

function App() {
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [entries, setEntries] = useState<ShiftEntry[]>([]);
  const [employees, setEmployees] = useState<Record<string, Employee>>(MANAGERS);
  const [currentView, setCurrentView] = useState<ViewType>('employee');
  const [employeeView, setEmployeeView] = useState<EmployeeViewType>('registration');
  const [isHRAuthenticated, setIsHRAuthenticated] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [currentManager, setCurrentManager] = useState<Employee | null>(null);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAutoLogin();
    fetchData();
  }, []);

  const checkAutoLogin = async () => {
    const profile = await autoLogin();
    if (profile) {
      setCurrentEmployee({
        id: profile.id,
        fullName: profile.full_name,
        department: profile.department,
        section: profile.section || undefined,
        role: profile.role,
        approved: profile.is_approved
      });
      if (profile.is_approved) {
        setEmployeeView('shift');
      }
    }
  };

  const fetchData = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*');
      
      if (profiles) {
        const profilesMap = profiles.reduce((acc, profile) => ({
          ...acc,
          [profile.id]: {
            id: profile.id,
            fullName: profile.full_name,
            department: profile.department,
            section: profile.section,
            role: profile.role,
            approved: profile.is_approved
          }
        }), {});
        
        setEmployees(prev => ({ ...prev, ...profilesMap }));
      }

      const { data: shiftEntries } = await supabase
        .from('shift_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (shiftEntries) {
        setEntries(shiftEntries.map(entry => ({
          id: entry.id,
          employeeId: entry.employee_id,
          date: entry.date,
          shiftType: entry.shift_type as ShiftType,
          otherRemark: entry.other_remark,
          timestamp: new Date(entry.created_at).getTime(),
          approved: entry.approved,
          approvedBy: entry.approved_by,
          approvedAt: entry.approved_at ? new Date(entry.approved_at).getTime() : undefined
        })));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistration = async (data: Employee) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .insert([{
          id: data.id,
          full_name: data.fullName,
          department: data.department,
          section: data.section,
          role: 'employee',
          is_approved: false
        }])
        .select()
        .single();

      if (error) throw error;

      if (profile) {
        const newEmployee = {
          id: profile.id,
          fullName: profile.full_name,
          department: profile.department,
          section: profile.section,
          role: 'employee',
          approved: profile.is_approved
        };
        
        setCurrentEmployee(newEmployee);
        setEmployees(prev => ({ ...prev, [newEmployee.id]: newEmployee }));
      }
    } catch (error) {
      console.error('Error in registration:', error);
    }
  };

  const handleShiftSubmit = async (shiftType: ShiftType, date: string, otherRemark?: string) => {
    if (!currentEmployee) return;

    try {
      const { data: entry, error } = await supabase
        .from('shift_entries')
        .insert([{
          employee_id: currentEmployee.id,
          date,
          shift_type: shiftType,
          other_remark: otherRemark,
          approved: null
        }])
        .select()
        .single();

      if (error) throw error;

      if (entry) {
        setEntries(prev => [{
          id: entry.id,
          employeeId: entry.employee_id,
          date: entry.date,
          shiftType: entry.shift_type as ShiftType,
          otherRemark: entry.other_remark,
          timestamp: new Date(entry.created_at).getTime(),
          approved: entry.approved,
          approvedBy: entry.approved_by,
          approvedAt: entry.approved_at ? new Date(entry.approved_at).getTime() : undefined
        }, ...prev]);

        setEmployeeView('shift');
      }
    } catch (error) {
      console.error('Error submitting shift:', error);
    }
  };

  const handleHRLogin = (code: string) => {
    setIsHRAuthenticated(true);
  };

  const handleAdminLogin = (code: string) => {
    setIsAdminAuthenticated(true);
  };

  const handleManagerLogin = (managerId: string, password: string) => {
    const correctPassword = MANAGER_PASSWORDS[managerId];
    if (password === correctPassword) {
      const manager = MANAGERS[managerId];
      if (manager) {
        setCurrentManager(manager);
        setLoginError('');
      }
    } else {
      setLoginError('Invalid credentials');
    }
  };

  const handleApproval = async (entryId: string) => {
    if (!currentManager) return;

    try {
      const { error } = await supabase
        .from('shift_entries')
        .update({
          approved: true,
          approved_by: currentManager.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', entryId);

      if (error) throw error;

      setEntries(prev => prev.map(entry => 
        entry.id === entryId
          ? {
              ...entry,
              approved: true,
              approvedBy: currentManager.id,
              approvedAt: new Date().getTime()
            }
          : entry
      ));
    } catch (error) {
      console.error('Error approving shift:', error);
    }
  };

  const handleRejection = async (entryId: string, justification: string) => {
    if (!currentManager) return;

    try {
      const { error } = await supabase
        .from('shift_entries')
        .update({
          approved: false,
          approved_by: currentManager.id,
          approved_at: new Date().toISOString(),
          other_remark: justification
        })
        .eq('id', entryId);

      if (error) throw error;

      setEntries(prev => prev.map(entry => 
        entry.id === entryId
          ? {
              ...entry,
              approved: false,
              approvedBy: currentManager.id,
              approvedAt: new Date().getTime(),
              otherRemark: justification
            }
          : entry
      ));
    } catch (error) {
      console.error('Error rejecting shift:', error);
    }
  };

  const handleEmployeeApproval = async (employeeId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_approved: true
        })
        .eq('id', employeeId);

      if (error) throw error;

      setEmployees(prev => ({
        ...prev,
        [employeeId]: {
          ...prev[employeeId],
          approved: true
        }
      }));

      if (currentEmployee?.id === employeeId) {
        setCurrentEmployee(prev => prev ? { ...prev, approved: true } : null);
        setEmployeeView('shift');
      }
    } catch (error) {
      console.error('Error approving employee:', error);
    }
  };

  const handleEmployeeRejection = async (employeeId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', employeeId);

      if (error) throw error;

      const { [employeeId]: removed, ...rest } = employees;
      setEmployees(rest);

      if (currentEmployee?.id === employeeId) {
        setCurrentEmployee(null);
        setEmployeeView('registration');
      }
    } catch (error) {
      console.error('Error rejecting employee:', error);
    }
  };

  const handlePasswordChange = ({ userId, newPassword }: PasswordChange) => {
    if (userId in MANAGER_PASSWORDS) {
      MANAGER_PASSWORDS[userId] = newPassword;
    }
  };

  const handleViewSwitch = (view: ViewType) => {
    setCurrentView(view);
    setEmployeeView('registration');
    if (view !== 'hr') {
      setIsHRAuthenticated(false);
    }
    if (view !== 'manager') {
      setCurrentManager(null);
      setLoginError('');
    }
    if (view !== 'admin') {
      setIsAdminAuthenticated(false);
    }
  };

  const UnderDevelopmentMessage = () => (
    <div className="bg-yellow-50 border-2 border-yellow-200 p-6 rounded-lg shadow-md w-full max-w-md">
      <div className="flex items-center gap-3 mb-4">
        <Construction className="w-8 h-8 text-yellow-600" />
        <h2 className="text-xl font-semibold text-yellow-800">Under Development</h2>
      </div>
      <p className="text-yellow-700 mb-4">
        This feature is currently under development and will be available soon. We're working hard to bring you improved overtime calculations and roster management. (regard dev/Mohd Saeed)
      </p>
      <div className="bg-yellow-100 p-4 rounded-md">
        <h3 className="font-medium text-yellow-800 mb-2">Coming Soon:</h3>
        <ul className="list-disc list-inside text-yellow-700 space-y-1">
          <li>Enhanced overtime calculations</li>
          <li>Manual time entry support</li>
          <li>Detailed shift breakdowns</li>
          <li>Improved reporting features</li>
        </ul>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Building2 className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Employee Attendance System
              </h1>
            </div>
            <select
              value={currentView}
              onChange={(e) => handleViewSwitch(e.target.value as ViewType)}
              className="w-48 px-4 py-2 rounded-md border border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="employee">Employee View</option>
              <option value="manager">Manager View</option>
              <option value="hr">HR View</option>
              <option value="admin">Admin View</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {currentView === 'admin' ? (
          isAdminAuthenticated ? (
            <AdminDashboard
              employees={employees}
              onApproveEmployee={handleEmployeeApproval}
              onRejectEmployee={handleEmployeeRejection}
              onChangePassword={handlePasswordChange}
            />
          ) : (
            <AdminLogin onLogin={handleAdminLogin} />
          )
        ) : currentView === 'hr' ? (
          isHRAuthenticated ? (
            <HRDashboard entries={entries} employees={employees} isHR={true} />
          ) : (
            <HRLogin onLogin={handleHRLogin} />
          )
        ) : currentView === 'manager' ? (
          currentManager ? (
            <ManagersDashboard
              entries={entries}
              employees={employees}
              currentManager={currentManager}
              onApprove={handleApproval}
              onReject={handleRejection}
              onRefresh={fetchData}
            />
          ) : (
            <ManagerLogin
              onLogin={handleManagerLogin}
              managers={Object.values(MANAGERS)}
            />
          )
        ) : (
          <div className="flex flex-col items-center gap-8">
            {currentEmployee?.approved && (
              <div className="w-full bg-white rounded-lg shadow-sm p-4 mb-4">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setEmployeeView('shift')}
                    className={`flex-1 py-2 px-4 rounded-md text-center ${
                      employeeView === 'shift'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Shift Registration
                  </button>
                  <button
                    onClick={() => setEmployeeView('ot')}
                    className={`flex-1 py-2 px-4 rounded-md text-center ${
                      employeeView === 'ot'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    OT Calculation
                  </button>
                  <button
                    onClick={() => setEmployeeView('roster')}
                    className={`flex-1 py-2 px-4 rounded-md text-center ${
                      employeeView === 'roster'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Monthly Roster
                  </button>
                </div>
              </div>
            )}
            
            {(!currentEmployee || employeeView === 'registration') && (
              <EmployeeRegistration
                onRegister={handleRegistration}
                existingEmployee={currentEmployee}
                onExistingEmployee={() => setEmployeeView('shift')}
              />
            )}
            
            {currentEmployee?.approved && employeeView === 'shift' && (
              <ShiftRegistration
                employee={currentEmployee}
                onSubmit={handleShiftSubmit}
                entries={entries}
                initialStep="date"
                onStepChange={() => {}}
              />
            )}

            {currentEmployee?.approved && (employeeView === 'ot' || employeeView === 'roster') && (
              <UnderDevelopmentMessage />
            )}

            {currentEmployee && !currentEmployee.approved && (
              <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Registration Pending</h2>
                </div>
                <p className="text-gray-600">
                  Your registration is pending approval from the administrator. Please check back later.
                </p>
              </div>
            )}

            {currentEmployee?.approved && (employeeView === 'shift' || employeeView === 'registration') && (
              <HRDashboard 
                entries={entries.filter(e => e.employeeId === currentEmployee.id)} 
                employees={employees}
                isHR={false}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;