import React, { useState, useRef } from 'react';
import { File, FileText, X, Upload, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../lib/supabase';
import { DocumentCategory, DOCUMENT_CATEGORIES, ProjectDocument } from '../../types';

interface DocumentUploaderProps {
  projectId: string;
  onUploadComplete: (document: ProjectDocument) => void;
  onCancel: () => void;
}

export default function DocumentUploader({ projectId, onUploadComplete, onCancel }: DocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('supporting_materials');
  const [customCategory, setCustomCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type (PDF only)
      if (selectedFile.type !== 'application/pdf') {
        setError('Only PDF files are supported');
        return;
      }
      
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size should not exceed 10MB');
        return;
      }
      
      setFile(selectedFile);
      setError('');
      
      // Auto-populate title with filename if empty
      if (!title) {
        setTitle(selectedFile.name.replace('.pdf', ''));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      
      // Validate file type (PDF only)
      if (droppedFile.type !== 'application/pdf') {
        setError('Only PDF files are supported');
        return;
      }
      
      // Validate file size (max 10MB)
      if (droppedFile.size > 10 * 1024 * 1024) {
        setError('File size should not exceed 10MB');
        return;
      }
      
      setFile(droppedFile);
      setError('');
      
      // Auto-populate title with filename if empty
      if (!title) {
        setTitle(droppedFile.name.replace('.pdf', ''));
      }
    }
  };
  
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!title.trim()) {
      setError('Please enter a title for the document');
      return;
    }
    
    if (category === 'custom' && !customCategory.trim()) {
      setError('Please enter a custom category name');
      return;
    }
    
    try {
      setUploading(true);
      setError('');
      
      // Generate a unique file name to prevent collisions
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}/${uuidv4()}.${fileExt}`;
      const filePath = `documents/${fileName}`;
      
      // Upload file to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(filePath, file);
      
      if (uploadError) {
        throw new Error(uploadError.message);
      }
      
      // Get public URL for the file
      const { data: urlData } = supabase.storage
        .from('project-documents')
        .getPublicUrl(filePath);
      
      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL for the uploaded file');
      }
      
      // Create document object
      const newDocument: ProjectDocument = {
        id: uuidv4(),
        title: title.trim(),
        description: description.trim(),
        fileName: file.name,
        fileUrl: urlData.publicUrl,
        fileType: file.type,
        fileSize: file.size,
        category: category,
        customCategory: category === 'custom' ? customCategory.trim() : undefined,
        uploadedAt: new Date().toISOString(),
        version: 1, // Initial version
        tags: tags
      };
      
      // Call callback to update project with new document
      onUploadComplete(newDocument);
      
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while uploading the document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Upload Document</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start">
          <AlertCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          className="hidden"
        />
        
        {file ? (
          <div className="flex items-center justify-center flex-col">
            <FileText className="w-12 h-12 text-green-500 mb-2" />
            <p className="text-sm font-medium text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-500 mt-1">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="mt-2 text-xs text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center flex-col">
            <Upload className="w-12 h-12 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-900">Drag and drop your PDF file here</p>
            <p className="text-xs text-gray-500 mt-1">or click to browse</p>
            <p className="text-xs text-gray-500 mt-4">PDF files only, max 10MB</p>
          </div>
        )}
      </div>
      
      {/* Document Details */}
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            placeholder="Document Title"
            required
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            placeholder="Brief description of the document..."
            rows={3}
          />
        </div>
        
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as DocumentCategory)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            {DOCUMENT_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        
        {category === 'custom' && (
          <div>
            <label htmlFor="customCategory" className="block text-sm font-medium text-gray-700 mb-1">
              Custom Category Name *
            </label>
            <input
              type="text"
              id="customCategory"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="Enter custom category name"
              required={category === 'custom'}
            />
          </div>
        )}
        
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags (Optional)
          </label>
          <div className="flex items-center">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="Add tags..."
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-primary text-white rounded-r-lg hover:bg-primary-dark transition-colors"
            >
              Add
            </button>
          </div>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1.5 text-primary hover:text-primary-dark"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 transition-colors"
          disabled={uploading}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || !file || !title.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </div>
    </div>
  );
}