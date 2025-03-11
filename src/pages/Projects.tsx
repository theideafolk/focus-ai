import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { projectService, userSettingsService } from '../services/supabaseService';
import type { Project, UserSettings } from '../types';
import PageContainer from '../components/layout/PageContainer';
import ProjectList from '../components/projects/ProjectList';
import ProjectForm from '../components/projects/ProjectForm';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [preferredCurrency, setPreferredCurrency] = useState<'USD' | 'INR' | 'GBP'>('USD');

  useEffect(() => {
    fetchProjects();
    fetchUserSettings();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data);
    } catch (err) {
      setError('Failed to load projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserSettings = async () => {
    try {
      const settings = await userSettingsService.get();
      if (settings?.workflow?.preferredCurrency) {
        setPreferredCurrency(settings.workflow.preferredCurrency);
      }
    } catch (err) {
      console.error('Failed to load user settings:', err);
    }
  };

  const handleCreateProject = async (project: Partial<Project>) => {
    try {
      const newProject = await projectService.create(project);
      setProjects([newProject, ...projects]);
    } catch (err) {
      throw new Error('Failed to create project');
    }
  };

  const handleUpdateProject = async (project: Partial<Project>) => {
    if (!selectedProject?.id) return;
    
    try {
      const updatedProject = await projectService.update(selectedProject.id, project);
      setProjects(projects.map(p => 
        p.id === updatedProject.id ? updatedProject : p
      ));
    } catch (err) {
      throw new Error('Failed to update project');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await projectService.delete(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedProject(undefined);
  };

  const handleFormSubmit = async (project: Partial<Project>) => {
    if (selectedProject) {
      await handleUpdateProject(project);
    } else {
      await handleCreateProject(project);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-medium text-gray-900">Projects</h1>
            <p className="mt-1 text-gray-500">
              Manage and track all your projects
            </p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
            aria-label="New Project"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">New Project</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        <ProjectList
          projects={projects}
          onEdit={handleEdit}
          onDelete={handleDeleteProject}
          isLoading={loading}
          preferredCurrency={preferredCurrency}
        />

        <ProjectForm
          project={selectedProject}
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
        />
      </div>
    </PageContainer>
  );
}