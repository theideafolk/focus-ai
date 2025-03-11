import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { userSettingsService } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import type { UserSettings } from '../types';
import PageContainer from '../components/layout/PageContainer';

// Import components
import UserProfileSettings from '../components/settings/UserProfileSettings';
import GeneralSettings from '../components/settings/GeneralSettings';
import GoalsSettings from '../components/settings/GoalsSettings';
import SkillsSettings from '../components/settings/SkillsSettings';
import WorkflowSettings from '../components/settings/WorkflowSettings';

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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Structured data from the settings JSON fields
  const [goals, setGoals] = useState<Goal[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [workflowStages, setWorkflowStages] = useState<WorkflowStage[]>([]);
  
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
          displayName: data.workflow?.displayName || user?.user_metadata?.full_name || '',
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

  // General settings handlers
  const handleDisplayNameChange = (displayName: string) => {
    setGeneralSettings(prev => ({ ...prev, displayName }));
  };

  const handleMaxDailyHoursChange = (maxDailyHours: number) => {
    setGeneralSettings(prev => ({ ...prev, maxDailyHours }));
  };
  
  const handleWorkDayToggle = (day: number) => {
    const newWorkDays = generalSettings.workDays.includes(day)
      ? generalSettings.workDays.filter(d => d !== day)
      : [...generalSettings.workDays, day];
    
    setGeneralSettings({
      ...generalSettings,
      workDays: newWorkDays.sort(),
    });
  };
  
  const handleCurrencyChange = (currency: 'USD' | 'INR' | 'GBP') => {
    setGeneralSettings({
      ...generalSettings,
      preferredCurrency: currency,
    });
  };

  // Goals handlers
  const handleAddGoal = (goal: Goal) => {
    setGoals([...goals, goal]);
  };
  
  const handleRemoveGoal = (id: string) => {
    setGoals(goals.filter(goal => goal.id !== id));
  };
  
  // Skills handlers
  const handleAddSkill = (skill: Skill) => {
    setSkills([...skills, skill]);
  };
  
  const handleRemoveSkill = (id: string) => {
    setSkills(skills.filter(skill => skill.id !== id));
  };
  
  // Workflow stage handlers
  const handleAddWorkflowStage = (stage: WorkflowStage) => {
    setWorkflowStages([...workflowStages, stage]);
  };
  
  const handleRemoveWorkflowStage = (id: string) => {
    setWorkflowStages(workflowStages.filter(stage => stage.id !== id));
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
            className="inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50"
            aria-label="Save Settings"
          >
            <Save className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Settings'}</span>
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
        
        {/* User Profile Section */}
        <UserProfileSettings 
          user={user}
          displayName={generalSettings.displayName}
          onDisplayNameChange={handleDisplayNameChange}
        />
        
        {/* General Settings Section */}
        <GeneralSettings 
          maxDailyHours={generalSettings.maxDailyHours}
          workDays={generalSettings.workDays}
          preferredCurrency={generalSettings.preferredCurrency}
          onMaxDailyHoursChange={handleMaxDailyHoursChange}
          onWorkDayToggle={handleWorkDayToggle}
          onCurrencyChange={handleCurrencyChange}
        />
        
        {/* Goals Section */}
        <GoalsSettings 
          goals={goals}
          onAddGoal={handleAddGoal}
          onRemoveGoal={handleRemoveGoal}
        />
        
        {/* Skills Section */}
        <SkillsSettings 
          skills={skills}
          onAddSkill={handleAddSkill}
          onRemoveSkill={handleRemoveSkill}
        />
        
        {/* Workflow Section */}
        <WorkflowSettings 
          stages={workflowStages}
          onAddStage={handleAddWorkflowStage}
          onRemoveStage={handleRemoveWorkflowStage}
        />
        
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </PageContainer>
  );
}