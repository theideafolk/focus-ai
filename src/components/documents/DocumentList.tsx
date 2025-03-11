import React, { useState } from 'react';
import { FileText, Download, Eye, Trash2, ExternalLink, Calendar, Tag, Search, Filter } from 'lucide-react';
import { ProjectDocument, getCategoryDisplayName } from '../../types';
import DocumentPreview from './DocumentPreview';

interface DocumentListProps {
  documents: ProjectDocument[];
  onDelete: (documentId: string) => void;
}

export default function DocumentList({ documents, onDelete }: DocumentListProps) {
  const [selectedDocument, setSelectedDocument] = useState<ProjectDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Get all unique categories from documents
  const categories = ['all', ...new Set(documents.map(doc => 
    doc.category === 'custom' ? doc.customCategory || 'custom' : doc.category
  ))];
  
  // Filter documents by search and category
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      searchQuery === '' || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesCategory = 
      categoryFilter === 'all' || 
      (doc.category === categoryFilter) ||
      (doc.category === 'custom' && doc.customCategory === categoryFilter);
    
    return matchesSearch && matchesCategory;
  });
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
  };
  
  if (documents.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
        <FileText className="w-12 h-12 mx-auto text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by uploading your first document.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>
        
        <div className="flex items-center">
          <Filter className="h-4 w-4 text-gray-500 mr-2" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-lg"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'all'
                  ? 'All Categories'
                  : getCategoryDisplayName(category as any)}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tags
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-primary/10 text-primary rounded-lg">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                        {doc.description && (
                          <div className="text-sm text-gray-500 max-w-xs truncate">{doc.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {doc.category === 'custom' ? doc.customCategory : getCategoryDisplayName(doc.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {doc.tags && doc.tags.length > 0 ? (
                        doc.tags.map(tag => (
                          <span 
                            key={tag} 
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      {formatDate(doc.uploadedAt)}
                    </div>
                    <div className="text-xs text-gray-400">Version {doc.version}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFileSize(doc.fileSize)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setSelectedDocument(doc)}
                        className="text-gray-500 hover:text-primary"
                        title="Preview"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <a
                        href={doc.fileUrl}
                        download={doc.fileName}
                        className="text-gray-500 hover:text-primary"
                        title="Download"
                      >
                        <Download className="h-5 w-5" />
                      </a>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-500 hover:text-primary"
                        title="Open in new tab"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>
                      <button
                        onClick={() => onDelete(doc.id)}
                        className="text-gray-500 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Preview modal */}
      {selectedDocument && (
        <DocumentPreview
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  );
}