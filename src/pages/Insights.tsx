import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
// Use the compatibility service exports
import { projectService, taskService, noteService, userSettingsService } from '../services';
import { analyticsService } from '../services/analytics';
import type { Project, Task, Note, UserSettings, TimeEstimateAccuracy, ProjectTypeEfficiency, ProductivityByDay, UserInsights } from '../types';
import PageContainer from '../components/layout/PageContainer';
import { 
  BarChart, Brain, ClipboardList, Clock, Calendar, TrendingUp, Zap, Target,
  BarChart2, Lightbulb, Award, AlertCircle, FlaskConical, Users, Info
} from 'lucide-react';

export default function Insights() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'insights' | 'ai-context'>('insights');
  
  // Data
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsMap, setProjectsMap] = useState<Record<string, Project>>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  
  // Analytics
  const [insights, setInsights] = useState<UserInsights | null>(null);
  const [timeAccuracy, setTimeAccuracy] = useState<TimeEstimateAccuracy[]>([]);
  const [projectEfficiency, setProjectEfficiency] = useState<ProjectTypeEfficiency[]>([]);
  const [productivityByDay, setProductivityByDay] = useState<ProductivityByDay[]>([]);
  const [aiContext, setAiContext] = useState<Record<string, any>>({});
  const [hasEnoughData, setHasEnoughData] = useState(false);
  
  // Load all data
  useEffect(() => {
    fetchData();
  }, []);
  
  // Calculate analytics when data changes
  useEffect(() => {
    if (projects.length > 0 && tasks.length > 0) {
      calculateAnalytics();
    }
  }, [projects, tasks, notes, userSettings]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [projectsData, tasksData, notesData, settings] = await Promise.all([
        projectService.getAll(),
        taskService.getAll(),
        noteService.getAll(),
        userSettingsService.get()
      ]);
      
      // Set state
      setProjects(projectsData);
      setTasks(tasksData);
      setNotes(notesData);
      setUserSettings(settings);
      
      // Create projects map for faster lookups
      const projectMap: Record<string, Project> = {};
      projectsData.forEach(project => {
        projectMap[project.id] = project;
      });
      setProjectsMap(projectMap);
      
      // Check if we have enough data for insights
      setHasEnoughData(analyticsService.hasEnoughDataForInsights(tasksData, notesData));
      
    } catch (err) {
      console.error('Failed to load data for insights:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const calculateAnalytics = () => {
    try {
      // Calculate various analytics
      const userInsights = analyticsService.getUserInsights(tasks, projectsMap, userSettings);
      const estimateAccuracy = analyticsService.getTimeEstimateAccuracy(tasks, projectsMap);
      const efficiency = analyticsService.getProjectTypeEfficiency(tasks, projectsMap);
      const productivityDays = analyticsService.getProductivityByDay(tasks);
      const context = analyticsService.getAIUserContext(userSettings, tasks, projects, notes);
      
      // Update state
      setInsights(userInsights);
      setTimeAccuracy(estimateAccuracy);
      setProjectEfficiency(efficiency);
      setProductivityByDay(productivityDays);
      setAiContext(context);
      
    } catch (err) {
      console.error('Error calculating analytics:', err);
    }
  };
  
  // Format percentage for display
  const formatPercentage = (value?: number): string => {
    if (value === undefined || isNaN(value)) return 'N/A';
    return `${Math.round(value)}%`;
  };
  
  // Format time for display
  const formatTime = (hours?: number): string => {
    if (hours === undefined || isNaN(hours)) return 'N/A';
    
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} min`;
    }
    
    return `${hours.toFixed(1)}h`;
  };
  
  // Get color class based on score (0-100)
  const getScoreColorClass = (score: number): string => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-teal-500';
    if (score >= 40) return 'text-yellow-500';
    if (score >= 20) return 'text-orange-500';
    return 'text-red-500';
  };
  
  // Get ratio color class (closer to 1.0 is better)
  const getRatioColorClass = (ratio: number): string => {
    const distance = Math.abs(ratio - 1);
    if (distance <= 0.1) return 'text-green-500';
    if (distance <= 0.25) return 'text-teal-500';
    if (distance <= 0.5) return 'text-yellow-500';
    if (distance <= 1) return 'text-orange-500';
    return 'text-red-500';
  };
  
  // Calculate width for bar charts (max 100%)
  const getBarWidth = (value: number, max: number): string => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    return `${percentage}%`;
  };
  
  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-medium text-gray-900">Insights & Fun Mode</h1>
            <p className="mt-1 text-gray-500">
              Discover patterns in your work habits and AI knowledge
            </p>
          </div>
          
          {/* Mobile-optimized tab buttons */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setActiveTab('insights')}
              className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium ${
                activeTab === 'insights'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BarChart className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Insights</span>
            </button>
            <button
              onClick={() => setActiveTab('ai-context')}
              className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium ${
                activeTab === 'ai-context'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Brain className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">What AI Knows</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-12">
            <FlaskConical className="w-12 h-12 mx-auto text-primary animate-pulse" />
            <p className="mt-4 text-gray-500">Analyzing your data...</p>
          </div>
        ) : !hasEnoughData ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-8 text-center">
            <Info className="w-16 h-16 mx-auto text-blue-500 mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">Not Enough Data Yet</h2>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto">
              Continue working on your tasks and updating your profile settings for longer to see interesting insights! 
              We need at least 5 tasks with 3 completed and time tracking data.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/tasks" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark">
                <ClipboardList className="w-4 h-4 mr-2" />
                Update Tasks
              </a>
              <a href="/settings" className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                <Users className="w-4 h-4 mr-2" />
                Complete Profile
              </a>
            </div>
          </div>
        ) : (
          activeTab === 'insights' ? (
            <div className="space-y-6">
              {/* Summary stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500">Task Completion</h3>
                    <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {insights?.totalCompletedTasks || 0}
                    <span className="text-xs sm:text-sm font-normal text-gray-500 ml-1">tasks</span>
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Rate: {formatPercentage(insights?.taskCompletionRate)}
                  </p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500">Time</h3>
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {formatTime(insights?.totalTrackedTime)}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    All tasks
                  </p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500">Estimation</h3>
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <p className={`text-lg sm:text-2xl font-bold ${getScoreColorClass(insights?.estimationAccuracy || 0)}`}>
                    {formatPercentage(insights?.estimationAccuracy)}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Avg: {insights?.averageActualVsEstimated?.toFixed(1) || 'N/A'}x
                  </p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500">Balance</h3>
                    <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <p className={`text-lg sm:text-2xl font-bold ${getScoreColorClass(insights?.projectBalanceScore || 0)}`}>
                    {formatPercentage(insights?.projectBalanceScore)}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Distribution
                  </p>
                </div>
              </div>
              
              {/* Time estimate accuracy by type */}
              {timeAccuracy.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                    <h2 className="text-base sm:text-lg font-medium text-gray-900 flex items-center">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" />
                      Time Accuracy by Project Type
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-gray-500">
                      How accurate your estimates are for different work types
                    </p>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Accuracy
                          </th>
                          <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Est/Act
                          </th>
                          <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tasks
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {timeAccuracy.map((item, index) => (
                          <tr key={index}>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                              {item.taskType}
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className={`text-xs sm:text-sm font-medium ${getScoreColorClass(item.accuracyScore)}`}>
                                  {formatPercentage(item.accuracyScore)}
                                </span>
                                <div className="ml-2 w-16 sm:w-24 bg-gray-200 rounded-full h-1.5 sm:h-2.5 overflow-hidden">
                                  <div 
                                    className={`h-1.5 sm:h-2.5 rounded-full ${item.accuracyScore >= 70 ? 'bg-green-500' : item.accuracyScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${item.accuracyScore}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                              {formatTime(item.averageEstimatedTime)}/{formatTime(item.averageActualTime)}
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                              {item.taskCount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Project efficiency */}
              {projectEfficiency.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" />
                    Project Type Efficiency
                  </h2>
                  
                  <div className="space-y-3 sm:space-y-4">
                    {projectEfficiency.map((item, index) => (
                      <div key={index} className="border border-gray-100 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-wrap justify-between items-center mb-2">
                          <h3 className="text-xs sm:text-sm font-medium text-gray-900">{item.projectType}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 mt-1 sm:mt-0">
                            {item.taskCount} tasks
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Completion Rate</span>
                              <span>{formatPercentage(item.completionRate)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2.5">
                              <div 
                                className="bg-blue-600 h-1.5 sm:h-2.5 rounded-full" 
                                style={{ width: getBarWidth(item.completionRate, 100) }}
                              ></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Time Ratio</span>
                              <span className={getRatioColorClass(item.averageTimeRatio)}>
                                {item.averageTimeRatio.toFixed(2)}x
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2.5 relative">
                              {/* 1.0 marker (ideal ratio) */}
                              <div className="absolute top-0 bottom-0 w-0.5 bg-gray-400 left-1/2 z-10"></div>
                              {/* Ratio bar */}
                              <div 
                                className={`h-1.5 sm:h-2.5 rounded-full ${
                                  Math.abs(item.averageTimeRatio - 1) <= 0.2 
                                    ? 'bg-green-500' 
                                    : item.averageTimeRatio < 1 
                                      ? 'bg-blue-500' // Under-estimated
                                      : 'bg-orange-500' // Over-estimated
                                }`}
                                style={{ 
                                  width: item.averageTimeRatio >= 1 
                                    ? getBarWidth(Math.min(item.averageTimeRatio, 2), 2) 
                                    : '50%',
                                  marginLeft: item.averageTimeRatio >= 1 
                                    ? '50%' 
                                    : getBarWidth(item.averageTimeRatio, 1)
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Productivity by day of week */}
              {productivityByDay.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" />
                    Productivity by Day of Week
                  </h2>
                  
                  <div className="space-y-3">
                    {productivityByDay.map((item, index) => {
                      // Find max task count to normalize bars
                      const maxTasks = Math.max(...productivityByDay.map(d => d.taskCount));
                      
                      return (
                        <div key={index} className="flex flex-wrap sm:items-center gap-2 sm:gap-0">
                          <div className="w-16 sm:w-24 text-xs sm:text-sm font-medium text-gray-500">{item.day}</div>
                          <div className="flex-1 min-w-0">
                            <div className="w-full bg-gray-100 rounded-full h-6 sm:h-8 flex items-center">
                              <div 
                                className="h-6 sm:h-8 bg-gradient-to-r from-primary/60 to-primary rounded-l-full flex items-center"
                                style={{ width: getBarWidth(item.taskCount, maxTasks) }}
                              >
                                <span className="text-white text-xs font-medium ml-2 sm:ml-3 truncate">
                                  {item.taskCount} tasks
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="w-full sm:w-auto sm:pl-4 text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0">
                            Avg: {formatTime(item.averageTimePerTask)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {insights?.mostProductiveDay && (
                    <div className="mt-4 bg-blue-50 text-blue-700 p-3 rounded-lg flex items-start">
                      <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs sm:text-sm font-medium">Most productive: {insights.mostProductiveDay}!</p>
                        <p className="text-xs mt-1">Consider scheduling important tasks on this day.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Fun achievement badges */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" />
                  Your Achievements
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {/* First achievement - Task Master */}
                  <div className="border border-gray-100 rounded-lg p-3 sm:p-4 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2 sm:mb-3">
                      <ClipboardList className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900">Task Master</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {insights?.totalCompletedTasks || 0} tasks completed
                    </p>
                    <div className="mt-2">
                      {getCompletionBadgeLabel(insights?.totalCompletedTasks || 0)}
                    </div>
                  </div>
                  
                  {/* Second achievement - Estimation Guru */}
                  <div className="border border-gray-100 rounded-lg p-3 sm:p-4 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2 sm:mb-3">
                      <Target className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900">Estimation Guru</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatPercentage(insights?.estimationAccuracy)} accuracy
                    </p>
                    <div className="mt-2">
                      {getEstimationBadgeLabel(insights?.estimationAccuracy || 0)}
                    </div>
                  </div>
                  
                  {/* Third achievement - Project Balancer */}
                  <div className="border border-gray-100 rounded-lg p-3 sm:p-4 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2 sm:mb-3">
                      <BarChart2 className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900">Project Balancer</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatPercentage(insights?.projectBalanceScore)} balance score
                    </p>
                    <div className="mt-2">
                      {getBalanceBadgeLabel(insights?.projectBalanceScore || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // AI Context Tab
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-lg sm:text-xl font-medium text-gray-900">AI Brain: What I Know About You</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      Context used by AI to personalize your experience
                    </p>
                  </div>
                </div>
                
                {/* Skills section */}
                {aiContext.skills && aiContext.skills.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3">Skills</h3>
                    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {aiContext.skills.map((skill: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex flex-wrap justify-between items-center mb-1 gap-1">
                            <span className="text-xs sm:text-sm font-medium text-gray-900">{skill.name}</span>
                            <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                              {skill.description}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-primary h-1.5 rounded-full" 
                              style={{ width: `${(skill.proficiency / 5) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Work Patterns */}
                <div className="mb-6">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3">Work Patterns</h3>
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Daily Schedule</h4>
                      <p className="text-xs sm:text-sm text-gray-900">
                        Maximum: <span className="font-medium">{aiContext.workPatterns?.maxDailyHours || 8} hours</span> per day
                      </p>
                      <p className="text-xs sm:text-sm text-gray-900 mt-1">
                        Work days: <span className="font-medium">{aiContext.workPatterns?.workDays || 'Not specified'}</span>
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Estimation Style</h4>
                      <p className="text-xs sm:text-sm text-gray-900 font-medium">
                        {aiContext.insights?.estimationStyle || 'Not enough data yet'}
                      </p>
                      {insights?.averageActualVsEstimated && (
                        <p className="text-xs mt-1 text-gray-500">
                          You typically spend {insights.averageActualVsEstimated.toFixed(1)}x your estimated time
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Project Context */}
                <div className="mb-6">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3">Project Context</h3>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Active Projects</h4>
                        <p className="text-xs sm:text-sm text-gray-900 font-medium">{projects.length}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Upcoming Deadlines</h4>
                        <p className="text-xs sm:text-sm text-gray-900 font-medium">
                          {aiContext.insights?.upcomingDeadlines?.count || 0} tasks
                          {aiContext.insights?.upcomingDeadlines?.nearest && (
                            <span className="text-xs font-normal text-gray-500 ml-1">
                              (nearest: {aiContext.insights.upcomingDeadlines.nearest})
                            </span>
                          )}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Priority Range</h4>
                        <p className="text-xs sm:text-sm text-gray-900 font-medium">
                          {aiContext.projects?.priorityRange?.min || 0} - {aiContext.projects?.priorityRange?.max || 0}
                          <span className="text-xs font-normal text-gray-500 ml-1">
                            (avg: {aiContext.projects?.priorityRange?.avg?.toFixed(1) || 0})
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    {/* Project Type Distribution */}
                    {aiContext.projects?.types && Object.keys(aiContext.projects.types).length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Project Type Distribution</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(aiContext.projects.types).map(([type, count]: [string, any]) => {
                            // Convert snake_case to Title Case
                            const displayType = type
                              .split('_')
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(' ');
                              
                            return (
                              <span 
                                key={type} 
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {displayType}: {count}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Notes Context */}
                <div className="mb-2">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3">Note-Taking Style</h3>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                      <div>
                        <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Notes</h4>
                        <p className="text-xs sm:text-sm text-gray-900 font-medium">{notes.length} total</p>
                        <p className="text-xs mt-1 text-gray-500">
                          {aiContext.notes?.averageLength || 'No data available'}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Detail Level</h4>
                        <p className="text-xs sm:text-sm text-gray-900 font-medium">
                          {aiContext.notes?.detailLevel || 'Not enough notes to determine'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* How the AI uses this */}
                <div className="mt-8 bg-blue-50 p-4 rounded-lg">
                  <div className="flex">
                    <AlertCircle className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-blue-800">How the AI uses this information</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        This context helps the AI personalize task generation, scheduling, and recommendations.
                        For example, when creating tasks or scheduling your day, the AI considers:
                      </p>
                      <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
                        <li>Your skills and proficiency levels to estimate task durations</li>
                        <li>Your work patterns and productivity trends for optimal scheduling</li>
                        <li>Project deadlines and priorities to balance your workload</li>
                        <li>Your estimation accuracy to adjust suggested time estimates</li>
                        <li>Your note-taking habits to extract relevant context</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </PageContainer>
  );
}

// Helper function for badge labels based on completion count
function getCompletionBadgeLabel(count: number): JSX.Element {
  if (count >= 100) {
    return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Task Legend (100+)</span>;
  } else if (count >= 50) {
    return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Task Expert (50+)</span>;
  } else if (count >= 20) {
    return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Task Pro (20+)</span>;
  } else if (count >= 10) {
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Task Achiever (10+)</span>;
  } else {
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Task Beginner</span>;
  }
}

// Helper function for badge labels based on estimation accuracy
function getEstimationBadgeLabel(accuracy: number): JSX.Element {
  if (accuracy >= 90) {
    return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Time Wizard (90%+)</span>;
  } else if (accuracy >= 75) {
    return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Time Expert (75%+)</span>;
  } else if (accuracy >= 60) {
    return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Time Planner (60%+)</span>;
  } else if (accuracy >= 40) {
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Time Apprentice (40%+)</span>;
  } else {
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Time Novice</span>;
  }
}

// Helper function for badge labels based on balance score
function getBalanceBadgeLabel(balance: number): JSX.Element {
  if (balance >= 90) {
    return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Perfect Balancer (90%+)</span>;
  } else if (balance >= 75) {
    return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Master Juggler (75%+)</span>;
  } else if (balance >= 60) {
    return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Solid Multitasker (60%+)</span>;
  } else if (balance >= 40) {
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Project Switcher (40%+)</span>;
  } else {
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Focus Specialist</span>;
  }
}