import React, { useState } from 'react';
import { Download, Table, CheckCircle2, XCircle, AlertCircle, RefreshCw, History, Clock } from 'lucide-react';
import type { ShiftEntry, ShiftType, Employee } from '../types';

interface Props {
  entries: ShiftEntry[];
  employees: Record<string, Employee>;
  currentManager: Employee;
  onApprove: (entryId: string) => void;
  onReject?: (entryId: string, justification: string) => void;
  onRefresh?: () => void;
}

interface RejectionForm {
  entryId: string;
  justification: string;
}

const formatShiftType = (type: ShiftType): string => {
  const labels: Record<ShiftType, string> = {
    '1st_shift': '1st Shift',
    '2nd_shift': '2nd Shift',
    '3rd_shift': '3rd Shift',
    'leave': 'Leave',
    'medical': 'Medical Leave',
    'ot_off_day': 'OT as Off Day',
    'ot_week_off': 'OT as Week Off',
    'ot_public_holiday': 'OT as Public Holiday',
    'other': 'Other'
  };
  return labels[type] || type;
};

export function ManagersDashboard({ 
  entries, 
  employees, 
  currentManager, 
  onApprove,
  onReject,
  onRefresh
}: Props) {
  const [dateFilter, setDateFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState<ShiftType | ''>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [rejectionForm, setRejectionForm] = useState<RejectionForm | null>(null);
  const [rejectionError, setRejectionError] = useState('');

  // Filter entries for the manager's section only
  const sectionEntries = entries.filter(entry => {
    const employee = employees[entry.employeeId];
    return employee?.section === currentManager.section;
  });

  // Get pending entries (not approved or rejected yet)
  const pendingEntries = sectionEntries.filter(entry => 
    entry.approved === null
  );

  // Get filtered entries for history
  const historyEntries = sectionEntries.filter((entry) => {
    const matchesDate = !dateFilter || entry.date === dateFilter;
    const matchesEmployee = !employeeFilter || entry.employeeId === employeeFilter;
    const matchesShift = !shiftFilter || entry.shiftType === shiftFilter;
    return matchesDate && matchesEmployee && matchesShift && entry.approved !== null;
  });

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const handleReject = (entryId: string) => {
    setRejectionForm({ entryId, justification: '' });
    setRejectionError('');
  };

  const handleRejectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionForm) return;

    if (rejectionForm.justification.length < 10) {
      setRejectionError('Justification must be at least 10 characters long');
      return;
    }

    onReject?.(rejectionForm.entryId, rejectionForm.justification);
    setRejectionForm(null);
    setRejectionError('');
  };

  const exportData = () => {
    const csvContent = [
      ['Date', 'Employee ID', 'Employee Name', 'Department', 'Section', 'Shift Type', 'Status', 'Approved By', 'Approved At', 'Remark'],
      ...sectionEntries.map((entry) => [
        entry.date,
        entry.employeeId,
        employees[entry.employeeId]?.fullName || 'Unknown',
        employees[entry.employeeId]?.department || 'Unknown',
        employees[entry.employeeId]?.section || '-',
        formatShiftType(entry.shiftType),
        entry.approved === null ? 'Pending' : entry.approved ? 'Approved' : 'Rejected',
        entry.approvedBy ? employees[entry.approvedBy]?.fullName : '-',
        entry.approvedAt ? new Date(entry.approvedAt).toLocaleString() : '-',
        entry.otherRemark || '',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentManager.section}-attendance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const sectionEmployees = Object.values(employees).filter(emp => 
    emp.section === currentManager.section && emp.role !== 'manager'
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {currentManager.section} Manager Dashboard
              </h2>
              <p className="text-sm text-gray-600">
                Welcome, {currentManager.fullName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className={`flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition duration-200 ${
                isRefreshing ? 'cursor-not-allowed opacity-75' : ''
              }`}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportData}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Pending Approvals Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-6 h-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            Pending Approvals
            {pendingEntries.length > 0 && (
              <span className="ml-2 px-2 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">
                {pendingEntries.length} pending
              </span>
            )}
          </h3>
        </div>

        {pendingEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No pending approvals</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shift Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remark
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingEntries.map((entry) => (
                  <tr key={entry.id} className="bg-yellow-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employees[entry.employeeId]?.fullName || 'Unknown'} ({entry.employeeId})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatShiftType(entry.shiftType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.otherRemark || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onApprove(entry.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(entry.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* History Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-2 mb-6">
          <History className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">History</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Employee
            </label>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            >
              <option value="">All Employees</option>
              {sectionEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Shift
            </label>
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value as ShiftType | '')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            >
              <option value="">All Shifts</option>
              {Object.keys(formatShiftType).map((type) => (
                <option key={type} value={type}>
                  {formatShiftType(type as ShiftType)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value as ShiftType | '')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            >
              <option value="">All Status</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shift Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remark
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Processed At
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {historyEntries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employees[entry.employeeId]?.fullName || 'Unknown'} ({entry.employeeId})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatShiftType(entry.shiftType)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {entry.approved ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-4 h-4 mr-1" />
                        Rejected
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.otherRemark || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.approvedAt ? new Date(entry.approvedAt).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejection Form Modal */}
      {rejectionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Rejection Justification
            </h3>
            <form onSubmit={handleRejectionSubmit}>
              <div className="mb-4">
                <label htmlFor="justification" className="block text-sm font-medium text-gray-700 mb-2">
                  Please provide detailed reasons for rejection
                </label>
                <textarea
                  id="justification"
                  value={rejectionForm.justification}
                  onChange={(e) => {
                    setRejectionForm({
                      ...rejectionForm,
                      justification: e.target.value
                    });
                    setRejectionError('');
                  }}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                  rows={4}
                  placeholder="Please provide detailed reasons for rejection (minimum 10 characters)"
                />
                {rejectionError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {rejectionError}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  Characters: {rejectionForm.justification.length}/10 (minimum)
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRejectionForm(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Submit Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}