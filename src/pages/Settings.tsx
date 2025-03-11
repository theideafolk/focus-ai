import React, { useEffect, useState } from 'react';
import { Save, Plus, Trash2, Info, DollarSign, IndianRupee, PoundSterling } from 'lucide-react';
import { userSettingsService } from '../services/supabaseService';
import type { UserSettings } from '../types';
import PageContainer from '../components/layout/PageContainer';

interface WorkflowStage {
  id: string;
  name: string;
  description: string;
}

interface Skill {
  id: string;
  name: string;
  proficiency: number; // 1-5
}

interface Goal {
  id: string;
  description: string;
  timeframe: 'short-term' | 'long-term';
}

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Structured data from the settings JSON fields
  const [goals, setGoals] = useState<Goal[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [workflowStages, setWorkflowStages] = useState<WorkflowStage[]>([]);
  
  // Form fields for adding new items
  const [newGoal, setNewGoal] = useState({ description: '', timeframe: 'short-term' as const });
  const [newSkill, setNewSkill] = useState({ name: '', proficiency: 3 });
  const [newStage, setNewStage] = useState({ name: '', description: '' });
  
  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    displayName: '',
    maxDailyHours: 8,
    workDays: [1, 2, 3, 4, 5], // Monday-Friday by default (0=Sunday, 1=Monday, etc.)
    preferredCurrency: 'USD' as 'USD' | 'INR' | 'GBP', // Default currency
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await userSettingsService.get();
      setSettings(data);
      
      // Parse stored JSON fields into structured data
      if (data) {
        console.log('Fetched settings:', data);
        
        // Parse goals
        if (data.workflow?.goals && Array.isArray(data.workflow.goals)) {
          console.log('Setting goals from data:', data.workflow.goals);
          setGoals(data.workflow.goals);
        } else {
          console.log('No goals found in data, using empty array');
          setGoals([]);
        }
        
        // Parse skills
        if (data.skills && Array.isArray(data.skills)) {
          setSkills(data.skills);
        } else {
          setSkills([]);
        }
        
        // Parse workflow stages
        if (data.workflow?.stages && Array.isArray(data.workflow.stages)) {
          setWorkflowStages(data.workflow.stages);
        } else {
          setWorkflowStages([]);
        }
        
        // Parse general settings
        const maxHours = data.workflow?.maxDailyHours !== undefined ? 
          Number(data.workflow.maxDailyHours) : 8;
          
        setGeneralSettings({
          displayName: data.workflow?.displayName || '',
          maxDailyHours: !isNaN(maxHours) ? maxHours : 8, // Default to 8 if NaN
          workDays: Array.isArray(data.workflow?.workDays) ? data.workflow.workDays : [1, 2, 3, 4, 5],
          preferredCurrency: data.workflow?.preferredCurrency || 'USD',
        });
      }
    } catch (err) {
      setError('Failed to load settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // Log the current goals before saving
      console.log('Goals to be saved:', goals);
      
      // Prepare updated settings object with proper structure
      const updatedSettings: Partial<UserSettings> = {
        skills: skills,
        workflow: {
          displayName: generalSettings.displayName,
          maxDailyHours: generalSettings.maxDailyHours,
          workDays: generalSettings.workDays,
          goals: goals,
          stages: workflowStages,
          preferredCurrency: generalSettings.preferredCurrency,
        },
        time_estimates: settings?.time_estimates || {}, // Preserve existing estimates
      };
      
      // Log the settings object to verify structure
      console.log('Saving settings:', JSON.stringify(updatedSettings));
      
      const savedSettings = await userSettingsService.upsert(updatedSettings);
      console.log('Settings saved successfully:', savedSettings);
      setSettings(savedSettings);
      setSuccess('Settings saved successfully');
    } catch (err) {
      setError('Failed to save settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Goal management
  const addGoal = () => {
    if (!newGoal.description.trim()) return;
    
    const goal: Goal = {
      id: Date.now().toString(),
      description: newGoal.description,
      timeframe: newGoal.timeframe,
    };
    
    setGoals([...goals, goal]);
    setNewGoal({ description: '', timeframe: 'short-term' });
  };
  
  const removeGoal = (id: string) => {
    setGoals(goals.filter(goal => goal.id !== id));
  };
  
  // Skill management
  const addSkill = () => {
    if (!newSkill.name.trim()) return;
    
    const skill: Skill = {
      id: Date.now().toString(),
      name: newSkill.name,
      proficiency: newSkill.proficiency,
    };
    
    setSkills([...skills, skill]);
    setNewSkill({ name: '', proficiency: 3 });
  };
  
  const removeSkill = (id: string) => {
    setSkills(skills.filter(skill => skill.id !== id));
  };
  
  // Workflow stage management
  const addWorkflowStage = () => {
    if (!newStage.name.trim()) return;
    
    const stage: WorkflowStage = {
      id: Date.now().toString(),
      name: newStage.name,
      description: newStage.description,
    };
    
    setWorkflowStages([...workflowStages, stage]);
    setNewStage({ name: '', description: '' });
  };
  
  const removeWorkflowStage = (id: string) => {
    setWorkflowStages(workflowStages.filter(stage => stage.id !== id));
  };
  
  // Update general settings
  const handleWorkDayToggle = (day: number) => {
    const newWorkDays = generalSettings.workDays.includes(day)
      ? generalSettings.workDays.filter(d => d !== day)
      : [...generalSettings.workDays, day];
    
    setGeneralSettings({
      ...generalSettings,
      workDays: newWorkDays.sort(),
    });
  };
  
  // Handle currency change
  const handleCurrencyChange = (currency: 'USD' | 'INR' | 'GBP') => {
    setGeneralSettings({
      ...generalSettings,
      preferredCurrency: currency,
    });
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-medium text-gray-900">Settings</h1>
            <p className="mt-1 text-gray-500">
              Configure your preferences, goals, and workflow
            </p>
          </div>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg">
            {success}
          </div>
        )}
        
        {/* General Settings Section */}
        <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">General Settings</h2>
            <p className="mt-1 text-sm text-gray-500">
              Basic settings that affect how Focus AI works for you
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                value={generalSettings.displayName}
                onChange={(e) => setGeneralSettings({ ...generalSettings, displayName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="Your name"
              />
            </div>
            
            <div>
              <label htmlFor="maxDailyHours" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Daily Work Hours
              </label>
              <input
                type="number"
                id="maxDailyHours"
                min="1"
                max="24"
                value={generalSettings.maxDailyHours.toString()}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  setGeneralSettings({
                    ...generalSettings,
                    maxDailyHours: isNaN(value) ? 8 : value
                  });
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
                    onClick={() => handleWorkDayToggle(index)}
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      generalSettings.workDays.includes(index)
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
                  onClick={() => handleCurrencyChange('USD')}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    generalSettings.preferredCurrency === 'USD'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  USD
                </button>
                <button
                  type="button"
                  onClick={() => handleCurrencyChange('INR')}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    generalSettings.preferredCurrency === 'INR'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <IndianRupee className="w-4 h-4 mr-2" />
                  INR
                </button>
                <button
                  type="button"
                  onClick={() => handleCurrencyChange('GBP')}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    generalSettings.preferredCurrency === 'GBP'
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
        
        {/* Goals Section */}
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
                onClick={addGoal}
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
                        onClick={() => removeGoal(goal.id)}
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
        
        {/* Skills Section */}
        <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Skills</h2>
            <p className="mt-1 text-sm text-gray-500">
              Define your skills to help the AI understand your capabilities and estimate task durations
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label htmlFor="skillName" className="block text-sm font-medium text-gray-700 mb-1">
                  Skill Name
                </label>
                <input
                  type="text"
                  id="skillName"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="e.g., React, UI Design, Writing, etc."
                />
              </div>
              
              <div className="w-60">
                <label htmlFor="skillProficiency" className="block text-sm font-medium text-gray-700 mb-1">
                  Proficiency (1-5)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    id="skillProficiency"
                    min="1"
                    max="5"
                    value={newSkill.proficiency.toString()}
                    onChange={(e) => setNewSkill({ ...newSkill, proficiency: parseInt(e.target.value, 10) || 3 })}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-700 w-6 text-center">{newSkill.proficiency}</span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={addSkill}
                disabled={!newSkill.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {skills.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">Your Skills</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {skills.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{skill.name}</p>
                        <div className="flex items-center mt-1">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full" 
                              style={{ width: `${(skill.proficiency / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 ml-2">{skill.proficiency}/5</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSkill(skill.id)}
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
                No skills added yet. Add your first skill above.
              </p>
            )}
          </div>
        </section>
        
        {/* Workflow Section */}
        <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Workflow Stages</h2>
              <p className="mt-1 text-sm text-gray-500">
                Define your typical workflow stages to help organize and plan tasks
              </p>
            </div>
            <div className="bg-blue-50 text-blue-700 text-xs p-2 rounded-lg max-w-xs">
              <div className="flex items-start">
                <Info className="w-3.5 h-3.5 mt-0.5 mr-1.5 flex-shrink-0" />
                <p>
                  These stages help the AI understand your work process. Tasks will be organized around these stages
                  but not rigidly bound to them.
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label htmlFor="stageName" className="block text-sm font-medium text-gray-700 mb-1">
                  Stage Name
                </label>
                <input
                  type="text"
                  id="stageName"
                  value={newStage.name}
                  onChange={(e) => setNewStage({ ...newStage, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="e.g., Planning, Research, Development, Testing, etc."
                />
              </div>
              
              <div className="flex-1">
                <label htmlFor="stageDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  id="stageDescription"
                  value={newStage.description}
                  onChange={(e) => setNewStage({ ...newStage, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="What happens in this stage?"
                />
              </div>
              
              <button
                type="button"
                onClick={addWorkflowStage}
                disabled={!newStage.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {workflowStages.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Your Workflow Stages</h3>
                
                <div className="relative">
                  {/* Process line */}
                  <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gray-200" />
                  
                  <div className="space-y-4">
                    {workflowStages.map((stage, index) => (
                      <div key={stage.id} className="flex items-start ml-4 pl-6 relative">
                        {/* Process circle */}
                        <div className="absolute left-0 top-0 w-2 h-2 mt-1.5 rounded-full bg-primary -ml-1" />
                        
                        <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {index + 1}. {stage.name}
                              </p>
                              {stage.description && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {stage.description}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeWorkflowStage(stage.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                No workflow stages defined yet. Add your first stage above.
              </p>
            )}
          </div>
        </section>
        
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </PageContainer>
  );
}