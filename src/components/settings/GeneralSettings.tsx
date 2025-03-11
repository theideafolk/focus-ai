import React from 'react';
import { DollarSign, IndianRupee, PoundSterling } from 'lucide-react';

interface GeneralSettingsProps {
  maxDailyHours: number;
  workDays: number[];
  preferredCurrency: 'USD' | 'INR' | 'GBP';
  onMaxDailyHoursChange: (hours: number) => void;
  onWorkDayToggle: (day: number) => void;
  onCurrencyChange: (currency: 'USD' | 'INR' | 'GBP') => void;
}

export default function GeneralSettings({
  maxDailyHours,
  workDays,
  preferredCurrency,
  onMaxDailyHoursChange,
  onWorkDayToggle,
  onCurrencyChange
}: GeneralSettingsProps) {
  return (
    <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">General Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Basic settings that affect how Focus AI works for you
        </p>
      </div>
      
      <div className="p-6 space-y-4">
        <div>
          <label htmlFor="maxDailyHours" className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Daily Work Hours
          </label>
          <input
            type="number"
            id="maxDailyHours"
            min="1"
            max="24"
            value={maxDailyHours.toString()}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              onMaxDailyHoursChange(isNaN(value) ? 8 : value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
          <p className="mt-1 text-xs text-gray-500">
            The AI will use this to avoid overloading your daily schedule
          </p>
        </div>
        
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">
            Work Days
          </span>
          <div className="flex flex-wrap gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <button
                key={day}
                type="button"
                onClick={() => onWorkDayToggle(index)}
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  workDays.includes(index)
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Currency
          </span>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onCurrencyChange('USD')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                preferredCurrency === 'USD'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              USD
            </button>
            <button
              type="button"
              onClick={() => onCurrencyChange('INR')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                preferredCurrency === 'INR'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <IndianRupee className="w-4 h-4 mr-2" />
              INR
            </button>
            <button
              type="button"
              onClick={() => onCurrencyChange('GBP')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                preferredCurrency === 'GBP'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <PoundSterling className="w-4 h-4 mr-2" />
              GBP
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Choose your preferred currency for displaying project budgets
          </p>
        </div>
      </div>
    </section>
  );
}