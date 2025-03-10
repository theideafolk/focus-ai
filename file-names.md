# Project Structure Documentation

This document provides an overview of all files in the project, their components, dependencies, and functionalities to assist with code review.

## Table of Contents

- [Configuration Files](#configuration-files)
- [Core Files](#core-files)
- [Components](#components)
  - [Layout Components](#layout-components)
  - [Dashboard Components](#dashboard-components)
  - [Project Components](#project-components)
  - [Task Components](#task-components)
  - [Note Components](#note-components)
- [Pages](#pages)
- [Services](#services)
- [Types and Utilities](#types-and-utilities)
- [Documentation](#documentation)

## Configuration Files

### `/package.json`
- **Functionality**: Defines project metadata, dependencies, and scripts
- **Dependencies**: React, React DOM, React Router, Supabase, Lucide React
- **Dev Dependencies**: Vite, TypeScript, ESLint, TailwindCSS, PostCSS, Autoprefixer, etc.

### `/vite.config.ts`
- **Functionality**: Configuration for Vite build tool
- **Dependencies**: Vite, @vitejs/plugin-react
- **Notable Config**: Excludes lucide-react from dependency optimization

### `/tsconfig.json`, `/tsconfig.app.json`, `/tsconfig.node.json`
- **Functionality**: TypeScript configuration files
- **Dependencies**: None (configuration only)
- **Notable Config**: Strict type checking, modern JavaScript features

### `/tailwind.config.js`
- **Functionality**: TailwindCSS configuration
- **Dependencies**: TailwindCSS
- **Notable Config**: Custom color palette with primary color (#7952B3)

### `/postcss.config.js`
- **Functionality**: PostCSS configuration for CSS processing
- **Dependencies**: TailwindCSS, Autoprefixer
- **Notable Config**: Standard configuration for TailwindCSS

### `/eslint.config.js`
- **Functionality**: ESLint configuration for code linting
- **Dependencies**: ESLint, TypeScript ESLint, React hooks and refresh plugins
- **Notable Config**: Recommended rules for React and TypeScript

## Core Files

### `/index.html`
- **Functionality**: HTML entry point
- **Dependencies**: None
- **Notable Elements**: Root div for React app, loads main.tsx script

### `/src/main.tsx`
- **Functionality**: React application entry point
- **Dependencies**: React, ReactDOM, App component
- **Components Used**: App
- **Functionality**: Creates root and renders App component in StrictMode

### `/src/App.tsx`
- **Functionality**: Main application component with routing
- **Dependencies**: React, React Router DOM, AuthContext
- **Components Used**: AuthProvider, Routes, ProtectedRoute, PublicRoute
- **Imported Pages**: Login, Dashboard, Projects, ProjectDetails, Notes, Tasks, AIRecommendations, Settings
- **Functionality**: Sets up routing with authentication protection

### `/src/index.css`
- **Functionality**: Global CSS styles
- **Dependencies**: TailwindCSS
- **Notable Features**: TailwindCSS directives, custom font import (Poppins)

## Components

### Layout Components

#### `/src/components/layout/Navbar.tsx`
- **Functionality**: Navigation bar component
- **Dependencies**: React, React Router DOM, Lucide icons
- **Components Used**: Various Lucide icons (Home, Briefcase, etc.)
- **Functionality**: Provides navigation links with active state highlighting, responsive design for mobile

#### `/src/components/layout/PageContainer.tsx`
- **Functionality**: Wrapper component for page content
- **Dependencies**: React, Navbar component
- **Components Used**: Navbar
- **Functionality**: Provides consistent layout, padding, and navbar for pages

### Dashboard Components

#### `/src/components/dashboard/ProjectCard.tsx`
- **Functionality**: Card displaying project summary
- **Dependencies**: React, React Router DOM, Lucide icons, Project type
- **Components Used**: Link, Calendar, DollarSign
- **Functionality**: Displays project name, client, priority, dates, and budget

#### `/src/components/dashboard/TaskList.tsx`
- **Functionality**: List of tasks for dashboard
- **Dependencies**: React, Lucide icons, Task type
- **Components Used**: CheckCircle2, Circle
- **Functionality**: Displays tasks with status toggling, priority, and due dates

### Project Components

#### `/src/components/projects/ProjectForm.tsx`
- **Functionality**: Form for creating/editing projects
- **Dependencies**: React, Lucide icons, Project type
- **Components Used**: X, ChevronDown, ChevronUp, Plus, Trash2
- **Functionality**: Form with fields for project details, validation, and error handling

#### `/src/components/projects/ProjectList.tsx`
- **Functionality**: Grid of project cards with edit/delete actions
- **Dependencies**: React, React Router DOM, Lucide icons, Project type
- **Components Used**: Link, Calendar, DollarSign, Trash2, Edit
- **Functionality**: Displays projects with edit/delete options, loading states

### Task Components

#### `/src/components/tasks/GenerateTasksForm.tsx`
- **Functionality**: Modal for AI-driven task generation
- **Dependencies**: React, Lucide icons, openaiService, Project/Task types
- **Components Used**: X, LightbulbIcon, Edit, PlusCircle, MinusCircle
- **Functionality**: Context-aware task generation with AI, task editing and breakdown features

#### `/src/components/tasks/TaskItem.tsx`
- **Functionality**: Individual task display component
- **Dependencies**: React, Lucide icons, Task/Project types
- **Components Used**: Calendar, Clock, Trash2, CheckCircle2, Circle
- **Functionality**: Displays task with status, priority, due date with action buttons

#### `/src/components/tasks/TaskList.tsx`
- **Functionality**: List container for tasks
- **Dependencies**: React, TaskItem component, Task/Project types
- **Components Used**: TaskItem
- **Functionality**: Renders list of tasks with loading states, empty states

### Note Components

#### `/src/components/notes/NoteForm.tsx`
- **Functionality**: Form for creating/editing notes
- **Dependencies**: React, Lucide icons, Note/Project types
- **Components Used**: X
- **Functionality**: Form with fields for note content, project selection

#### `/src/components/notes/NoteItem.tsx`
- **Functionality**: Individual note display component
- **Dependencies**: React, React Router DOM, Lucide icons, Note/Project types
- **Components Used**: Link, Calendar, Edit, Trash2
- **Functionality**: Displays note with content preview, creation date, edit/delete actions

#### `/src/components/notes/NoteList.tsx`
- **Functionality**: Grid of note items
- **Dependencies**: React, NoteItem component, Note/Project types
- **Components Used**: NoteItem
- **Functionality**: Displays notes with loading states, empty state handling

## Pages

### `/src/pages/Login.tsx`
- **Functionality**: Authentication page
- **Dependencies**: React, React Router DOM, Supabase, userSettingsService
- **Components Used**: None (custom built form)
- **Functionality**: Handles user login and signup, creates initial settings for new users

### `/src/pages/Dashboard.tsx`
- **Functionality**: Main dashboard page
- **Dependencies**: React, AuthContext, projectService, taskService, React Router DOM
- **Components Used**: PageContainer, ProjectCard, TaskList, GenerateTasksForm, Plus, LightbulbIcon
- **Functionality**: Displays project summaries and upcoming tasks, task generation access

### `/src/pages/Projects.tsx`
- **Functionality**: Project management page
- **Dependencies**: React, projectService, Plus icon
- **Components Used**: PageContainer, ProjectList, ProjectForm
- **Functionality**: Lists all projects with create/edit/delete capabilities

### `/src/pages/ProjectDetails.tsx`
- **Functionality**: Detailed view of a single project
- **Dependencies**: React, React Router DOM, projectService, taskService, noteService, openaiService, Lucide icons
- **Components Used**: PageContainer, TaskList, ProjectForm, NoteForm, NoteItem, GenerateTasksForm
- **Functionality**: Comprehensive project management with tasks, notes, and documentation

### `/src/pages/Notes.tsx`
- **Functionality**: Notes management page
- **Dependencies**: React, noteService, projectService, openaiService, Lucide icons
- **Components Used**: PageContainer, NoteList, NoteForm, Plus, Search
- **Functionality**: Lists all notes with search, filter, and vector similarity search

### `/src/pages/Tasks.tsx`
- **Functionality**: Task management page
- **Dependencies**: React, taskService, projectService, Lucide icons
- **Components Used**: PageContainer, TaskList, GenerateTasksForm, Filter, CheckCircle2, Calendar, Plus
- **Functionality**: Lists all tasks with filtering, sorting, status toggling

### `/src/pages/AIRecommendations.tsx`
- **Functionality**: AI-driven daily task planning
- **Dependencies**: React, taskService, projectService, userSettingsService, openaiService, Lucide icons
- **Components Used**: PageContainer, TaskItem, Calendar, Clock, AlertCircle, ArrowDownUp, ArrowUp, ArrowDown, Info
- **Functionality**: AI-generated daily task sequence with time allocation and reordering

### `/src/pages/Settings.tsx`
- **Functionality**: User settings page (placeholder)
- **Dependencies**: React
- **Components Used**: None yet
- **Functionality**: Skeleton for user preferences and settings

## Services

### `/src/lib/supabase.ts`
- **Functionality**: Supabase client initialization
- **Dependencies**: @supabase/supabase-js
- **Exported Functions**: supabase client instance
- **Functionality**: Configures and exports Supabase client using environment variables

### `/src/services/supabaseService.ts`
- **Functionality**: Supabase data access services
- **Dependencies**: supabase client, Project/Note/Task/UserSettings/AIContext types
- **Exported Services**: projectService, noteService, taskService, userSettingsService, aiContextService
- **Functionality**: CRUD operations for all database entities with error handling

### `/src/services/openaiService.ts`
- **Functionality**: OpenAI API integration for AI features
- **Dependencies**: supabase client, taskService, Project/Note/Task/UserSettings types
- **Exported Functions**: processTextForEmbedding, generateEmbeddings, storeNoteEmbedding, searchSimilarNotes, generateTasks, breakdownTask, generateDailyTaskSequence
- **Functionality**: AI-powered features including embeddings, task generation, and scheduling

## Types and Utilities

### `/src/types/index.ts`
- **Functionality**: TypeScript type definitions
- **Dependencies**: None
- **Exported Types**: Project, Note, Task, UserSettings, AIContext
- **Functionality**: Defines data structure types used throughout the application

### `/src/contexts/AuthContext.tsx`
- **Functionality**: Authentication context provider
- **Dependencies**: React, Supabase
- **Exported Components/Hooks**: AuthProvider, useAuth
- **Functionality**: Manages authentication state and provides it to components

## Documentation

### `/docs/prd.md`
- **Functionality**: Product Requirements Document
- **Dependencies**: None
- **Content**: Functional requirements, technical requirements, database architecture, AI context management