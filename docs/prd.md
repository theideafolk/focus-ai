### Functional Requirements by Page

#### 1\. **Login Page**

- **Purpose:** Secure user authentication.  
- **Features:**  
  - Input fields for email and password.  
  - Buttons: "Log In" and "Sign Up."  
  - Google login option (for calendar integration).  
- **Notes:** Keeps it minimal with just what’s needed to get started.

#### 2\. **Dashboard**

- **Purpose:** Quick overview of your work.  
- **Features:**  
  - List of active projects with their priority scores.  
  - Upcoming tasks for the day, pulled from all projects, sequenced by AI for balanced time allocation.  
  - Buttons: "Add Project," "Add Note," "View Notes."  
- **Notes:** Tasks are displayed based on AI recommendations, ensuring no single project dominates your day.

#### 3\. **Projects Page**

- **Purpose:** Manage all projects.  
- **Features:**  
  - **Project List:** Shows project name, client, timeline, and AI-calculated priority.  
  - **Add Project Button:** Opens a simple form (name, client, description, timeline, etc.).  
  - **Project Click:** Navigates to the Project Details page.  
- **Notes:** Clean list layout with minimal actions to avoid clutter.

#### 4\. **Project Details Page**

- **Purpose:** Dive into a specific project.  
- **Features:**  
  - Displays project info (name, client, description, timeline, budget).  
  - **Edit Project Button:** Opens a form to update details.  
  - **Add Note Button:** Quick form to add a project-specific note.  
  - **Generate Tasks Button:** AI creates tasks based on project details and notes, ensuring time is segmented across projects.  
  - **Task List:** Shows tasks with description, estimated time, due date, and priority; editable inline.  
  - **Add to Calendar Button:** Adds selected tasks as Google Calendar events.  
- **Notes:** AI balances task creation to prevent overloading one project; you can tweak durations or slots here.

#### 5\. **Task Management Page**

- **Purpose:** View and adjust all tasks.  
- **Features:**  
  - List of tasks across projects (project name, description, due date, priority).  
  - Filters: By project or due date.  
  - Edit tasks inline (description, time, due date).  
  - Mark tasks as completed with a checkbox.  
- **Notes:** Simple table layout with basic controls for task management.

#### 6\. **Notes Page**

- **Purpose:** Capture and organize notes.  
- **Features:**  
  - List of all notes (general or project-linked).  
  - **Add Note Button:** Form with option to link to a project or keep general.  
  - Search bar to filter notes by keyword or project.  
  - AI highlights key terms in notes (e.g., deadlines, ideas).  
- **Notes:** Minimal design, with AI enhancing usability without complexity.

#### 7\. **Settings Page**

- **Purpose:** Configure your work style.  
- **Features:**  
  - Form for skills (e.g., coding, design) and typical time estimates (e.g., 4h, 2h).  
  - Workflow preferences (e.g., work hours, break times).  
  - Profile update (email, password).  
- **Notes:** Simple form layout; feeds into AI for task planning.

#### 8\. **AI Recommendations Page**

- **Purpose:** Get AI-driven daily task plans.  
- **Features:**  
  - Suggested task sequence for the day, pulling from all projects to balance time.  
  - Warnings if timelines risk spilling over.  
  - Edit options: Adjust task durations or reorder sequence.  
  - **Approve Button:** Adds the day’s tasks to Google Calendar.  
- **Notes:** AI ensures no project hogs your day; you retain control to tweak the plan.

---

### Technical Requirements

- **Frontend:**  
    
  - Built with **React/Next.js** using **Vite** for fast development and builds.  
  - UI designed via **bolt.new** for rapid prototyping and deployment.  
  - Simple, clean layout with minimal buttons and a focus on content.


- **Backend & Database:**  
    
  - **Supabase** handles authentication (email/password, Google OAuth), storage, and the PostgreSQL database.  
  - Real-time updates for tasks and notes where needed.


- **AI APIs:**  
    
  - **OpenAI API:** Generates tasks and sequences them based on project details, notes, and your settings.  
  - **Google Gemini API:** Processes notes and maintains global context about you and your projects.  
  - AI splits work across projects daily, using your skills and time estimates.


- **Calendar Integration:**  
    
  - **Google Calendar API** adds tasks as events once approved.


- **Vector Database:**  
    
  - Uses **Supabase’s pgvector** extension to store note embeddings for AI context retrieval.

---

### Database Architecture

#### Tables

1. **Users**  
     
   - Columns: `id`, `email`, `password_hash`, `google_id`, `created_at`  
   - Purpose: Stores user authentication data.

   

2. **Projects**  
     
   - Columns: `id`, `user_id`, `name`, `client_name`, `description`, `start_date`, `end_date`, `budget`, `priority_score`  
   - Purpose: Tracks project details; priority calculated by AI.

   

3. **Notes**  
     
   - Columns: `id`, `user_id`, `project_id` (optional), `content`, `created_at`  
   - Purpose: Stores general or project-specific notes.

   

4. **Tasks**  
     
   - Columns: `id`, `project_id`, `description`, `estimated_time`, `due_date`, `status`, `priority_score`  
   - Purpose: Manages tasks with AI-assigned priorities and times.

   

5. **UserSettings**  
     
   - Columns: `id`, `user_id`, `skills` (JSON), `time_estimates` (JSON), `workflow` (JSON)  
   - Purpose: Stores your configuration for AI task planning.

#### Vector DB Setup

- **Notes Embeddings Table:**  
  - Columns: `note_id`, `embedding` (vector type)  
  - Purpose: Stores AI-generated embeddings of notes for fast context retrieval.  
- **Retrieval:** AI uses similarity search to pull relevant notes for task generation or recommendations.

---

### AI Context Management

- **Multiple Models:**  
  - **Gemini:** Handles global context (your notes, settings, and project overviews).  
  - **OpenAI:** Focuses on task creation and daily sequencing.  
- **Context Handling:**  
  - Notes are summarized periodically to fit token limits.  
  - Vector similarity ensures only relevant notes are fed to the AI, keeping it efficient.  
- **Task Segmentation:**  
  - AI analyzes all projects, your skills, and time estimates to split tasks across the day, preventing over-focus on one project.

---

### Addressing Your Non-Negotiables

- **Projects and Details:** Add and manage projects via Projects and Project Details pages.  
- **User Configuration:** Settings page captures skills, time estimates, and workflow.  
- **Task Generation & Timeline:** AI creates and sequences tasks daily, balancing project time, with spillover warnings.  
- **Notes & Context:** Notes (global or project-specific) are stored and analyzed via vector DB for AI context.  
- **Simple UI:** Minimal buttons, clean layout, content-focused design to keep you on track.
