import React, { useState } from 'react';
import { Download, Filter, Table, Bell, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { ShiftEntry, ShiftType, Department, EngineeringSection } from '../types';

interface Props {
  entries: ShiftEntry[];
  employees: Record<string, { id: string; fullName: string; department: Department; section?: EngineeringSection }>;
  isHR: boolean;
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

export function HRDashboard({ entries, employees, isHR }: Props) {
  const [dateFilter, setDateFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState<ShiftType | ''>('');
  const [departmentFilter, setDepartmentFilter] = useState<Department | ''>('');
  const [sectionFilter, setSectionFilter] = useState<EngineeringSection | ''>('');

  const filteredEntries = entries.filter((entry) => {
    const matchesDate = !dateFilter || entry.date === dateFilter;
    const matchesEmployee = !employeeFilter || entry.employeeId === employeeFilter;
    const matchesShift = !shiftFilter || entry.shiftType === shiftFilter;
    const matchesDepartment = !departmentFilter || employees[entry.employeeId]?.department === departmentFilter;
    const matchesSection = !sectionFilter || 
      (departmentFilter === 'Engineering' && employees[entry.employeeId]?.section === sectionFilter);
    return matchesDate && matchesEmployee && matchesShift && matchesDepartment && matchesSection;
  });

  const exportData = () => {
    const csvContent = [
      ['Date', 'Employee ID', 'Employee Name', 'Department', 'Section', 'Shift Type', 'Status', 'Approved By', 'Approved At', 'Remark'],
      ...filteredEntries.map((entry) => [
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
    a.download = `shift-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Table className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {isHR ? 'HR Access (Akram)' : 'Attendance Records'}
            </h2>
          </div>
        </div>
        {isHR && (
          <button
            onClick={exportData}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {isHR && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
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
              Filter by Department
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => {
                const newDepartment = e.target.value as Department | '';
                setDepartmentFilter(newDepartment);
                if (newDepartment !== 'Engineering') {
                  setSectionFilter('');
                }
              }}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            >
              <option value="">All Departments</option>
              {Object.values(employees)
                .map(emp => emp.department)
                .filter((value, index, self) => self.indexOf(value) === index)
                .map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))
              }
            </select>
          </div>

          {departmentFilter === 'Engineering' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Section
              </label>
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value as EngineeringSection | '')}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              >
                <option value="">All Sections</option>
                {Object.values(employees)
                  .filter(emp => emp.department === 'Engineering' && emp.section)
                  .map(emp => emp.section)
                  .filter((value, index, self) => self.indexOf(value) === index)
                  .map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))
                }
              </select>
            </div>
          )}
        </div>
      )}

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
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Section
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shift Type
              </th>
              {isHR && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Remark
              </th>
              {isHR && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approved By
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEntries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {employees[entry.employeeId]?.fullName || 'Unknown'} ({entry.employeeId})
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {employees[entry.employeeId]?.department || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {employees[entry.employeeId]?.section || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatShiftType(entry.shiftType)}
                </td>
                {isHR && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {entry.approved === undefined ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Pending
                      </span>
                    ) : entry.approved ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-4 h-4 mr-1" />
                        Rejected
                      </span>
                    )}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.otherRemark || '-'}
                </td>
                {isHR && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.approvedBy ? (
                      <div>
                        <p>{employees[entry.approvedBy]?.fullName || 'Unknown'}</p>
                        {entry.approvedAt && (
                          <p className="text-xs text-gray-500">
                            {new Date(entry.approvedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}