import React, { useState } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';

interface WorkflowStage {
  id: string;
  name: string;
  description: string;
}

interface WorkflowSettingsProps {
  stages: WorkflowStage[];
  onAddStage: (stage: WorkflowStage) => void;
  onRemoveStage: (stageId: string) => void;
}

export default function WorkflowSettings({
  stages,
  onAddStage,
  onRemoveStage
}: WorkflowSettingsProps) {
  const [newStage, setNewStage] = useState({ name: '', description: '' });

  const handleAddStage = () => {
    if (!newStage.name.trim()) return;
    
    const stage: WorkflowStage = {
      id: Date.now().toString(),
      name: newStage.name,
      description: newStage.description,
    };
    
    onAddStage(stage);
    setNewStage({ name: '', description: '' });
  };

  return (
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
            onClick={handleAddStage}
            disabled={!newStage.name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {stages.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Your Workflow Stages</h3>
            
            <div className="relative">
              {/* Process line */}
              <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gray-200" />
              
              <div className="space-y-4">
                {stages.map((stage, index) => (
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
                          onClick={() => onRemoveStage(stage.id)}
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
  );
}