import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, AlertCircle } from 'lucide-react';
import type { ShiftEntry, Employee, ShiftType } from '../types';

interface Props {
  employee: Employee;
  entries: ShiftEntry[];
}

interface RosterDay {
  date: string;
  shiftType: ShiftType | null;
  approved: boolean | null;
  remark?: string;
}

const SHIFT_COLORS: Record<ShiftType, string> = {
  '1st_shift': 'bg-green-100 text-green-800 border-green-200',
  '2nd_shift': 'bg-blue-100 text-blue-800 border-blue-200',
  '3rd_shift': 'bg-purple-100 text-purple-800 border-purple-200',
  'leave': 'bg-red-100 text-red-800 border-red-200',
  'medical': 'bg-orange-100 text-orange-800 border-orange-200',
  'ot_off_day': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'ot_week_off': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'ot_public_holiday': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'other': 'bg-gray-100 text-gray-800 border-gray-200'
};

const SHIFT_LABELS: Record<ShiftType, string> = {
  '1st_shift': '1st Shift (6:00 AM - 2:00 PM)',
  '2nd_shift': '2nd Shift (2:00 PM - 10:00 PM)',
  '3rd_shift': '3rd Shift (10:00 PM - 6:00 AM)',
  'leave': 'Leave',
  'medical': 'Medical Leave',
  'ot_off_day': 'OT (Off Day)',
  'ot_week_off': 'OT (Week Off)',
  'ot_public_holiday': 'OT (Public Holiday)',
  'other': 'Other'
};

export function EmployeeRoster({ employee, entries }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [rosterDays, setRosterDays] = useState<RosterDay[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<{
    regularShifts: number;
    overtimeShifts: number;
    leaves: number;
  }[]>([]);

  useEffect(() => {
    generateRoster();
  }, [selectedMonth, entries]);

  const generateRoster = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: RosterDay[] = [];

    // Generate roster days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${selectedMonth}-${String(day).padStart(2, '0')}`;
      const entry = entries.find(e => e.date === date);

      days.push({
        date,
        shiftType: entry?.shiftType || null,
        approved: entry?.approved || null,
        remark: entry?.otherRemark
      });
    }

    setRosterDays(days);

    // Calculate weekly stats
    const weeks: typeof weeklyStats = [];
    for (let i = 0; i < days.length; i += 7) {
      const weekDays = days.slice(i, i + 7);
      const stats = {
        regularShifts: weekDays.filter(d => 
          d.shiftType && ['1st_shift', '2nd_shift', '3rd_shift'].includes(d.shiftType)
        ).length,
        overtimeShifts: weekDays.filter(d => 
          d.shiftType && d.shiftType.startsWith('ot_')
        ).length,
        leaves: weekDays.filter(d => 
          d.shiftType && ['leave', 'medical'].includes(d.shiftType)
        ).length
      };
      weeks.push(stats);
    }
    setWeeklyStats(weeks);
  };

  const getShiftStyle = (shiftType: ShiftType | null, approved: boolean | null) => {
    if (!shiftType) return 'bg-gray-50 text-gray-500 border-gray-200';
    const baseStyle = SHIFT_COLORS[shiftType];
    if (approved === false) return baseStyle + ' opacity-50';
    if (approved === null) return baseStyle + ' animate-pulse';
    return baseStyle;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            Monthly Roster
          </h2>
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shift
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Remark
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rosterDays.map((day, index) => (
              <tr key={day.date} className={index % 7 === 6 ? 'border-b-2 border-gray-300' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(day.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {day.shiftType ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getShiftStyle(day.shiftType, day.approved)}`}>
                      <Clock className="w-4 h-4 mr-1" />
                      {SHIFT_LABELS[day.shiftType]}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {day.shiftType && (
                    day.approved === null ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="w-4 h-4 mr-1" />
                        Pending
                      </span>
                    ) : day.approved ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Clock className="w-4 h-4 mr-1" />
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Rejected
                      </span>
                    )
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {day.remark || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {weeklyStats.map((week, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Week {index + 1}</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Regular Shifts:</span>
                  <span className="font-medium text-gray-800">{week.regularShifts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Overtime Shifts:</span>
                  <span className="font-medium text-gray-800">{week.overtimeShifts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Leaves:</span>
                  <span className="font-medium text-gray-800">{week.leaves}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}