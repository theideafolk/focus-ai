import { supabase } from '../../lib/supabase';
import { ProjectDocument } from '../../types';

// Service for handling document-related operations
export const documentService = {
  // Add a document to a project
  async addDocumentToProject(projectId: string, document: ProjectDocument): Promise<void> {
    try {
      // Get the current project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('documents')
        .eq('id', projectId)
        .single();
      
      if (projectError) throw projectError;
      
      // Initialize documents array if it doesn't exist
      const currentDocuments = project.documents || [];
      
      // Add the new document
      const updatedDocuments = [...currentDocuments, document];
      
      // Update the project with the new document
      const { error: updateError } = await supabase
        .from('projects')
        .update({ documents: updatedDocuments })
        .eq('id', projectId);
      
      if (updateError) throw updateError;
      
    } catch (error) {
      console.error('Error adding document to project:', error);
      throw error;
    }
  },
  
  // Remove a document from a project
  async removeDocumentFromProject(projectId: string, documentId: string): Promise<void> {
    try {
      // Get the current project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('documents')
        .eq('id', projectId)
        .single();
      
      if (projectError) throw projectError;
      
      // Filter out the document to remove
      const currentDocuments: ProjectDocument[] = project.documents || [];
      const updatedDocuments = currentDocuments.filter(doc => doc.id !== documentId);
      
      // Update the project without the removed document
      const { error: updateError } = await supabase
        .from('projects')
        .update({ documents: updatedDocuments })
        .eq('id', projectId);
      
      if (updateError) throw updateError;
      
      // Find the document to get its file path
      const documentToRemove = currentDocuments.find(doc => doc.id === documentId);
      
      if (documentToRemove) {
        // Extract the path from the URL
        const fileUrl = documentToRemove.fileUrl;
        const path = fileUrl.split('/').pop();
        
        if (path) {
          // Remove the file from storage (ignore errors if file doesn't exist)
          await supabase.storage
            .from('project-documents')
            .remove([`documents/${projectId}/${path}`]);
        }
      }
      
    } catch (error) {
      console.error('Error removing document from project:', error);
      throw error;
    }
  },
  
  // Update document metadata
  async updateDocumentMetadata(projectId: string, documentId: string, updates: Partial<ProjectDocument>): Promise<void> {
    try {
      // Get the current project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('documents')
        .eq('id', projectId)
        .single();
      
      if (projectError) throw projectError;
      
      // Find and update the document
      const currentDocuments: ProjectDocument[] = project.documents || [];
      const updatedDocuments = currentDocuments.map(doc => {
        if (doc.id === documentId) {
          return { ...doc, ...updates };
        }
        return doc;
      });
      
      // Update the project with the modified documents
      const { error: updateError } = await supabase
        .from('projects')
        .update({ documents: updatedDocuments })
        .eq('id', projectId);
      
      if (updateError) throw updateError;
      
    } catch (error) {
      console.error('Error updating document metadata:', error);
      throw error;
    }
  },
  
  // Analyze document content using AI
  async analyzeDocument(document: ProjectDocument): Promise<any> {
    try {
      // This is a placeholder for future AI document analysis
      // In a real implementation, you would call an AI service
      // and return insights about the document
      
      // For now, just return basic metadata
      return {
        documentId: document.id,
        title: document.title,
        category: document.category,
        insights: {
          keyTopics: [],
          suggestedTags: [],
          sentiment: 'neutral',
          relatedDocuments: []
        }
      };
    } catch (error) {
      console.error('Error analyzing document:', error);
      throw error;
    }
  },
  
  // Find related documents based on tags and content
  async findRelatedDocuments(projectId: string, documentId: string): Promise<ProjectDocument[]> {
    try {
      // Get the current project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('documents')
        .eq('id', projectId)
        .single();
      
      if (projectError) throw projectError;
      
      const currentDocuments: ProjectDocument[] = project.documents || [];
      const targetDocument = currentDocuments.find(doc => doc.id === documentId);
      
      if (!targetDocument) {
        return [];
      }
      
      // Find documents with matching tags
      // This is a simple implementation - in a full solution,
      // you would use more sophisticated matching
      return currentDocuments
        .filter(doc => doc.id !== documentId) // Exclude the source document
        .filter(doc => {
          if (!doc.tags || !targetDocument.tags) return false;
          
          // Check for tag overlap
          return doc.tags.some(tag => targetDocument.tags.includes(tag)) ||
                 doc.category === targetDocument.category;
        });
      
    } catch (error) {
      console.error('Error finding related documents:', error);
      throw error;
    }
  }
};

export default documentService;