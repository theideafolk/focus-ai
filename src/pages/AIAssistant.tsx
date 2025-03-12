import React, { useState, useEffect, useRef } from 'react';
import { Send, Save, Edit, X, Hash, Tag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import { projectService, noteService } from '../services';
import { aiContextService } from '../services/ai';
import { Project, Note } from '../types';
import { useChatCompletion } from '../hooks/useChatCompletion';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  projectTags?: string[];
  noteTags?: string[];
  timestamp: string;
};

export default function AIAssistant() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingResponse, setEditingResponse] = useState<string | null>(null);
  const [responseEdit, setResponseEdit] = useState('');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{type: 'project' | 'note', items: Array<Project | Note>}>({
    type: 'project',
    items: []
  });
  const [cursorPosition, setCursorPosition] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { generateCompletion, isGenerating } = useChatCompletion();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsData, notesData] = await Promise.all([
        projectService.getAll(),
        noteService.getAll()
      ]);
      setProjects(projectsData);
      setNotes(notesData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // Check for @ symbol to trigger suggestions
    const currentPosition = e.target.selectionStart || 0;
    setCursorPosition(currentPosition);
    
    const textBeforeCursor = value.substring(0, currentPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1 && atIndex > textBeforeCursor.lastIndexOf(' ') && atIndex > textBeforeCursor.lastIndexOf('\n')) {
      const query = textBeforeCursor.substring(atIndex + 1).toLowerCase();
      
      // Determine if we're likely tagging a project or note based on context
      const isProjectContext = textBeforeCursor.includes('@project') || 
                              textBeforeCursor.includes('project') ||
                              !textBeforeCursor.includes('note');
      
      if (isProjectContext) {
        // Show project suggestions
        const filteredProjects = projects.filter(p => 
          p.name.toLowerCase().includes(query)
        );
        setSuggestions({
          type: 'project',
          items: filteredProjects.slice(0, 5)
        });
      } else {
        // Show note suggestions
        const filteredNotes = notes.filter(n => 
          (n.title || '').toLowerCase().includes(query) || 
          n.content.toLowerCase().includes(query)
        );
        setSuggestions({
          type: 'note',
          items: filteredNotes.slice(0, 5)
        });
      }
      
      setSuggestionsOpen(true);
    } else {
      setSuggestionsOpen(false);
    }
  };

  const insertSuggestion = (item: Project | Note) => {
    const textBeforeCursor = input.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1) {
      const textAfterCursor = input.substring(cursorPosition);
      const newText = textBeforeCursor.substring(0, atIndex) + 
                      '@' + ('name' in item ? item.name : item.title || 'Note') + ' ' +
                      textAfterCursor;
      
      setInput(newText);
      setSuggestionsOpen(false);
      
      // Re-focus on input and set cursor position after the inserted suggestion
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const newCursorPos = atIndex + 1 + ('name' in item ? item.name.length : (item.title || 'Note').length) + 1;
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  const extractTagsFromInput = (text: string) => {
    const projectTags: string[] = [];
    const noteTags: string[] = [];
    
    // Extract project references (@ProjectName)
    const projectRegex = /@([a-zA-Z0-9_\s]+)/g;
    let match;
    
    while ((match = projectRegex.exec(text)) !== null) {
      const tagName = match[1].trim();
      const foundProject = projects.find(p => 
        p.name.toLowerCase() === tagName.toLowerCase()
      );
      
      if (foundProject) {
        projectTags.push(foundProject.id);
      }
    }
    
    // For this simplified version, we're assuming notes are also tagged with @
    // In a more advanced implementation, we might use different markers like #
    const noteRegex = /@([a-zA-Z0-9_\s]+)/g;
    
    while ((match = noteRegex.exec(text)) !== null) {
      const tagName = match[1].trim();
      const foundNote = notes.find(n => 
        (n.title || '').toLowerCase() === tagName.toLowerCase()
      );
      
      if (foundNote) {
        noteTags.push(foundNote.id);
      }
    }
    
    return { projectTags, noteTags };
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const { projectTags, noteTags } = extractTagsFromInput(input);
    
    // Create and add the user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      projectTags,
      noteTags,
      timestamp: new Date().toISOString()
    };
    
    setMessages([...messages, userMessage]);
    setInput('');
    
    // Generate and add AI response
    try {
      // Gather context based on tagged projects and notes
      let context = "You are an AI assistant helping with project management.";
      
      if (projectTags.length > 0 || noteTags.length > 0) {
        // Fetch detailed information about the tagged projects
        const taggedProjects = await Promise.all(
          projectTags.map(id => projectService.getById(id))
        );
        
        // Fetch detailed information about the tagged notes
        const taggedNotes = await Promise.all(
          noteTags.map(id => noteService.getById(id))
        );
        
        // Add project context
        if (taggedProjects.length > 0) {
          context += "\n\nProject context:";
          taggedProjects.forEach(project => {
            context += `\n- Project "${project.name}": ${project.description || 'No description'}`;
            if (project.start_date && project.end_date) {
              context += `, Timeline: ${project.start_date} to ${project.end_date}`;
            }
            if (project.priority_score) {
              context += `, Priority: ${project.priority_score}/10`;
            }
          });
        }
        
        // Add notes context
        if (taggedNotes.length > 0) {
          context += "\n\nNotes context:";
          taggedNotes.forEach(note => {
            context += `\n- Note "${note.title || 'Untitled'}": ${note.content.substring(0, 200)}${note.content.length > 200 ? '...' : ''}`;
          });
        }
      }
      
      // Get AI response
      const aiResponse = await generateCompletion(
        context,
        input,
        messages.map(m => ({ role: m.role, content: m.content }))
      );
      
      // Add the AI message
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      };
      
      setMessages(messages => [...messages, assistantMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Add an error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error while processing your request. Please try again.",
        timestamp: new Date().toISOString()
      };
      
      setMessages(messages => [...messages, errorMessage]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startEditing = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message && message.role === 'assistant') {
      setEditingResponse(messageId);
      setResponseEdit(message.content);
    }
  };

  const saveAsNote = async (content: string) => {
    try {
      // Create a new note
      await noteService.create({
        content,
        title: content.split('\n')[0].substring(0, 50), // Use first line as title
      });
      
      // Show success alert
      alert('Response saved as note!');
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    }
  };

  const saveEdits = (messageId: string) => {
    // Update the message content
    setMessages(messages.map(m => 
      m.id === messageId ? { ...m, content: responseEdit } : m
    ));
    
    // Exit edit mode
    setEditingResponse(null);
    setResponseEdit('');
  };

  const cancelEdits = () => {
    setEditingResponse(null);
    setResponseEdit('');
  };

  return (
    <PageContainer>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <h1 className="text-2xl font-medium text-gray-900 mb-4">Focus</h1>
        
        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Left pane - Chat history */}
          <div className="w-1/3 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {messages.map(message => (
                <div 
                  key={message.id} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-lg p-3 ${
                      message.role === 'user' 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Show tags if any */}
                    {(message.projectTags?.length || message.noteTags?.length) ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {message.projectTags?.map(tag => {
                          const project = projects.find(p => p.id === tag);
                          return project ? (
                            <span 
                              key={tag} 
                              className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 flex items-center"
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {project.name}
                            </span>
                          ) : null;
                        })}
                        
                        {message.noteTags?.map(tag => {
                          const note = notes.find(n => n.id === tag);
                          return note ? (
                            <span 
                              key={tag} 
                              className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 flex items-center"
                            >
                              <Hash className="w-3 h-3 mr-1" />
                              {note.title || 'Note'}
                            </span>
                          ) : null;
                        })}
                      </div>
                    ) : null}
                    
                    <div className="text-xs mt-1 opacity-70 text-right">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            
            {/* Message input */}
            <div className="p-4 border-t border-gray-200">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message... Use @ to tag projects or notes"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  rows={3}
                />
                
                {/* Suggestions dropdown */}
                {suggestionsOpen && suggestions.items.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-10">
                    {suggestions.items.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => insertSuggestion(item)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                      >
                        {'name' in item ? (
                          <>
                            <Tag className="w-4 h-4 mr-2 text-primary" />
                            <span className="font-medium">{item.name}</span>
                          </>
                        ) : (
                          <>
                            <Hash className="w-4 h-4 mr-2 text-primary" />
                            <span className="font-medium">{item.title || 'Untitled note'}</span>
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isGenerating}
                  className="absolute right-2 bottom-2 p-2 text-primary hover:text-primary-dark transition-colors disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              
              {isGenerating && (
                <p className="text-xs text-gray-500 mt-1">AI is thinking...</p>
              )}
            </div>
          </div>
          
          {/* Right pane - AI response */}
          <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 p-8">
                <div className="text-center">
                  <ArrowRight className="w-8 h-8 mx-auto mb-2 text-primary/50" />
                  <p>Start a conversation with the AI Assistant</p>
                  <p className="text-sm mt-2">Use @ to tag projects or notes for more context</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Show the latest AI response */}
                  {messages.filter(m => m.role === 'assistant').length > 0 ? (
                    <div className="prose max-w-none">
                      {editingResponse ? (
                        // Edit mode
                        <>
                          <textarea
                            value={responseEdit}
                            onChange={(e) => setResponseEdit(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                            rows={12}
                          />
                          
                          <div className="flex justify-end gap-2 mt-4">
                            <button
                              onClick={cancelEdits}
                              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveEdits(editingResponse)}
                              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
                            >
                              Save Changes
                            </button>
                          </div>
                        </>
                      ) : (
                        // View mode
                        <>
                          <div className="whitespace-pre-wrap">
                            {messages.filter(m => m.role === 'assistant').pop()?.content}
                          </div>
                          
                          <div className="flex justify-end gap-2 mt-6">
                            <button
                              onClick={() => startEditing(messages.filter(m => m.role === 'assistant').pop()?.id || '')}
                              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </button>
                            <button
                              onClick={() => saveAsNote(messages.filter(m => m.role === 'assistant').pop()?.content || '')}
                              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save as Note
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Waiting for AI response...
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}