import React from 'react';
import { Hash, X, RefreshCw } from 'lucide-react';
import type { NoteTag } from '../../types';

interface TagListProps {
  autoTags?: NoteTag[];
  userTags?: NoteTag[];
  onAddTag?: (tagName: string) => void;
  onRemoveTag?: (tagId: string) => void;
  onRefreshTags?: () => void;
  onTagClick?: (tagName: string) => void;
  className?: string;
}

export default function TagList({
  autoTags = [],
  userTags = [],
  onAddTag,
  onRemoveTag,
  onRefreshTags,
  onTagClick,
  className = ''
}: TagListProps) {
  const [newTag, setNewTag] = React.useState('');
  const [isAdding, setIsAdding] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim() && onAddTag) {
      onAddTag(newTag.trim().toLowerCase().replace(/\s+/g, '-'));
      setNewTag('');
      setIsAdding(false);
    }
  };

  const handleTagClick = (tagName: string) => {
    if (onTagClick) {
      onTagClick(tagName);
    }
  };

  // Helper to format tag name for display
  const formatTagName = (name: string) => {
    return name.replace(/-/g, ' ').toLowerCase();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {/* Auto-generated tags */}
        {autoTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => handleTagClick(tag.name)}
            className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors cursor-pointer"
            title={`Confidence: ${Math.round((tag.confidence || 0) * 100)}%`}
          >
            <Hash className="w-3 h-3" />
            <span className="hover:underline">{formatTagName(tag.name)}</span>
          </button>
        ))}
        
        {/* User tags */}
        {userTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center group"
          >
            <button
              onClick={() => handleTagClick(tag.name)}
              className="inline-flex items-center text-xs font-medium text-primary hover:text-primary-dark hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <Hash className="w-3 h-3" />
              <span className="hover:underline">{formatTagName(tag.name)}</span>
            </button>
            {onRemoveTag && (
              <button
                onClick={() => onRemoveTag(tag.name)}
                className="ml-1 p-0.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}

        {/* Add tag button/form */}
        {onAddTag && (
          isAdding ? (
            <form onSubmit={handleSubmit} className="inline-flex items-center">
              <span className="text-gray-400">
                <Hash className="w-3 h-3" />
              </span>
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="px-1 py-0.5 text-xs border-b border-gray-300 focus:outline-none focus:border-primary"
                placeholder="new-tag"
                autoFocus
              />
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              <Hash className="w-3 h-3" />
              <span>add-tag</span>
            </button>
          )
        )}

        {/* Refresh tags button */}
        {onRefreshTags && autoTags.length > 0 && (
          <button
            onClick={onRefreshTags}
            className="inline-flex items-center text-xs font-medium text-gray-500 hover:text-gray-700"
            title="Refresh auto-tags"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}