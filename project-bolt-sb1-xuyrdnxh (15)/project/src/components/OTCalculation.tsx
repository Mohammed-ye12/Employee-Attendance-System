import React, { useState, useEffect } from 'react';
import { Calculator, Clock, Calendar, DollarSign, User, ChevronDown, ChevronUp } from 'lucide-react';
import type { ShiftEntry, Employee } from '../types';

interface Props {
  employee: Employee;
  entries: ShiftEntry[];
}

interface OTSummary {
  regularHours: number;
  offDayOT: number;
  weekOffOT: number;
  holidayOT: number;
  nightOT: number;
  totalOTHours: number;
  estimatedPay: number;
}

const OT_RATES = {
  night_ot: 2.0,    // Night OT at 2.0x
  off_day: 1.5,     // Regular off day at 1.5x
  week_off: 2.0,    // Week off at 2.0x
  public_holiday: 2.0 // Public holiday at 2.0x
};

const BASE_HOURLY_RATE = 10; // Example base rate

export function OTCalculation({ employee, entries }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [expandedSection, setExpandedSection] = useState<'summary' | 'details' | 'notes' | null>('summary');
  const [summary, setSummary] = useState<OTSummary>({
    regularHours: 0,
    offDayOT: 0,
    weekOffOT: 0,
    holidayOT: 0,
    nightOT: 0,
    totalOTHours: 0,
    estimatedPay: 0
  });

  useEffect(() => {
    calculateOT();
  }, [selectedMonth, entries]);

  const calculateOT = () => {
    const monthEntries = entries.filter(entry => 
      entry.date.startsWith(selectedMonth) && 
      entry.approved === true
    );

    const newSummary: OTSummary = {
      regularHours: 0,
      offDayOT: 0,
      weekOffOT: 0,
      holidayOT: 0,
      nightOT: 0,
      totalOTHours: 0,
      estimatedPay: 0
    };

    monthEntries.forEach(entry => {
      switch (entry.shiftType) {
        case '1st_shift':
        case '2nd_shift':
          newSummary.regularHours += 8;
          break;
        case '3rd_shift':
          newSummary.regularHours += 8;
          newSummary.nightOT += 8;
          break;
        case 'ot_off_day':
          newSummary.offDayOT += 8;
          break;
        case 'ot_week_off':
          newSummary.weekOffOT += 8;
          break;
        case 'ot_public_holiday':
          newSummary.holidayOT += 8;
          break;
      }
    });

    const weightedOTHours = 
      (newSummary.nightOT * OT_RATES.night_ot) +
      (newSummary.offDayOT * OT_RATES.off_day) +
      (newSummary.weekOffOT * OT_RATES.week_off) +
      (newSummary.holidayOT * OT_RATES.public_holiday);

    newSummary.totalOTHours = newSummary.offDayOT + newSummary.weekOffOT + newSummary.holidayOT + newSummary.nightOT;
    newSummary.estimatedPay = weightedOTHours * BASE_HOURLY_RATE;

    setSummary(newSummary);
  };

  const formatHours = (hours: number) => `${hours} hrs`;
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const toggleSection = (section: 'summary' | 'details' | 'notes') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-4 max-w-full px-4 sm:px-6">
      {/* Employee Welcome Card */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Welcome, {employee.fullName}
            </h2>
            <p className="text-sm text-gray-600">
              ID: {employee.id}
            </p>
            <p className="text-sm text-gray-600">
              {employee.department}{employee.section && ` - ${employee.section}`}
            </p>
          </div>
        </div>
      </div>

      {/* Month Selection */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              OT Calculation
            </h2>
          </div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <button
          onClick={() => toggleSection('summary')}
          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
        >
          <span className="font-medium text-gray-800">Summary</span>
          {expandedSection === 'summary' ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
        
        {expandedSection === 'summary' && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Regular Hours</span>
              </div>
              <p className="text-xl font-bold text-blue-700">{formatHours(summary.regularHours)}</p>
            </div>

            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Total OT Hours</span>
              </div>
              <p className="text-xl font-bold text-green-700">{formatHours(summary.totalOTHours)}</p>
            </div>

            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Weighted Hours</span>
              </div>
              <p className="text-xl font-bold text-purple-700">
                {formatHours(
                  (summary.nightOT * OT_RATES.night_ot) +
                  (summary.offDayOT * OT_RATES.off_day) +
                  (summary.weekOffOT * OT_RATES.week_off) +
                  (summary.holidayOT * OT_RATES.public_holiday)
                )}
              </p>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-900">Estimated Pay</span>
              </div>
              <p className="text-xl font-bold text-yellow-700">{formatCurrency(summary.estimatedPay)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <button
          onClick={() => toggleSection('details')}
          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
        >
          <span className="font-medium text-gray-800">Detailed Breakdown</span>
          {expandedSection === 'details' ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
        
        {expandedSection === 'details' && (
          <div className="p-4 space-y-4">
            {[
              { label: 'Night OT', rate: '2.0x', hours: summary.nightOT, rateValue: OT_RATES.night_ot },
              { label: 'Off Day OT', rate: '1.5x', hours: summary.offDayOT, rateValue: OT_RATES.off_day },
              { label: 'Week Off OT', rate: '2.0x', hours: summary.weekOffOT, rateValue: OT_RATES.week_off },
              { label: 'Public Holiday OT', rate: '2.0x', hours: summary.holidayOT, rateValue: OT_RATES.public_holiday }
            ].map((item, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">{item.label}</span>
                  <span className="text-sm text-gray-600">Rate: {item.rate}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Hours:</span>
                    <span className="ml-2 font-medium">{formatHours(item.hours)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <span className="ml-2 font-medium">
                      {formatCurrency(item.hours * item.rateValue * BASE_HOURLY_RATE)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center font-medium">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">{formatCurrency(summary.estimatedPay)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <button
          onClick={() => toggleSection('notes')}
          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
        >
          <span className="font-medium text-gray-800">Notes</span>
          {expandedSection === 'notes' ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
        
        {expandedSection === 'notes' && (
          <div className="p-4">
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                Night OT (10:00 PM - 6:00 AM) is calculated at 2.0x base rate
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                Regular off day OT is calculated at 1.5x base rate
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                Week off OT is calculated at 2.0x base rate
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                Public holiday OT is calculated at 2.0x base rate
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                Only approved shifts are included in calculations
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}