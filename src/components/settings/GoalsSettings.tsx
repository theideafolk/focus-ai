import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Goal {
  id: string;
  description: string;
  timeframe: 'short-term' | 'long-term';
}

interface GoalsSettingsProps {
  goals: Goal[];
  onAddGoal: (goal: Goal) => void;
  onRemoveGoal: (goalId: string) => void;
}

export default function GoalsSettings({
  goals,
  onAddGoal,
  onRemoveGoal
}: GoalsSettingsProps) {
  const [newGoal, setNewGoal] = useState({ description: '', timeframe: 'short-term' as const });

  const handleAddGoal = () => {
    if (!newGoal.description.trim()) return;
    
    const goal: Goal = {
      id: Date.now().toString(),
      description: newGoal.description,
      timeframe: newGoal.timeframe,
    };
    
    onAddGoal(goal);
    setNewGoal({ description: '', timeframe: 'short-term' });
  };

  return (
    <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Goals</h2>
        <p className="mt-1 text-sm text-gray-500">
          Define your short and long-term goals to help the AI understand your direction
        </p>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="goalDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Goal Description
            </label>
            <input
              type="text"
              id="goalDescription"
              value={newGoal.description}
              onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="e.g., Learn React Native, Complete project X, etc."
            />
          </div>
          
          <div className="w-36">
            <label htmlFor="goalTimeframe" className="block text-sm font-medium text-gray-700 mb-1">
              Timeframe
            </label>
            <select
              id="goalTimeframe"
              value={newGoal.timeframe}
              onChange={(e) => setNewGoal({ ...newGoal, timeframe: e.target.value as 'short-term' | 'long-term' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            >
              <option value="short-term">Short-term</option>
              <option value="long-term">Long-term</option>
            </select>
          </div>
          
          <button
            type="button"
            onClick={handleAddGoal}
            disabled={!newGoal.description.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {goals.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">Your Goals</h3>
            <div className="space-y-2">
              {goals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-800">{goal.description}</p>
                    <span className={`text-xs inline-block mt-1 px-2 py-0.5 rounded-full ${
                      goal.timeframe === 'short-term' 
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {goal.timeframe === 'short-term' ? 'Short-term' : 'Long-term'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveGoal(goal.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">
            No goals added yet. Add your first goal above.
          </p>
        )}
      </div>
    </section>
  );
}