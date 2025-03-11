import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  proficiency: number; // 1-5
}

interface SkillsSettingsProps {
  skills: Skill[];
  onAddSkill: (skill: Skill) => void;
  onRemoveSkill: (skillId: string) => void;
}

export default function SkillsSettings({
  skills,
  onAddSkill,
  onRemoveSkill
}: SkillsSettingsProps) {
  const [newSkill, setNewSkill] = useState({ name: '', proficiency: 3 });

  const handleAddSkill = () => {
    if (!newSkill.name.trim()) return;
    
    const skill: Skill = {
      id: Date.now().toString(),
      name: newSkill.name,
      proficiency: newSkill.proficiency,
    };
    
    onAddSkill(skill);
    setNewSkill({ name: '', proficiency: 3 });
  };

  return (
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
            onClick={handleAddSkill}
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
                    onClick={() => onRemoveSkill(skill.id)}
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
  );
}