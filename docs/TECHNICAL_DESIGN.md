# Task Management App - Technical Design

## Overview
A Salesforce-based task management application that helps teams organize and track their work. The app includes AI-powered task summarization and real-time collaboration features.

## Core Features
- Create and manage tasks
- AI-generated task summaries
- Search and filter tasks
- Task statistics and reporting

## Technical Stack
- Frontend: Lightning Web Components (LWC)
- Backend: Salesforce Apex
- Database: Salesforce Custom Objects
- AI Integration: OpenRouter.ai
- Authentication: Salesforce Named Credential

## Database Design

### Main Objects

**Task_Management__c**
- Title__c (Text)
- Description__c (Long Text)
- Status__c (Picklist: Not Started, In Progress, Completed)
- Priority__c (Picklist: High, Medium, Low)
- Due_Date__c (Date)
- Category__c (Picklist)
- Assigned_To__c (User Lookup)
- AI_Summary__c (Long Text)
- AI_Summary_Generated__c (Checkbox)
- AI_Summary_Last_Updated__c (DateTime)

**Task_Tag__c**
- Name (Text)
- Task_Management__c (Master-Detail to Task)
- Color__c (Text)

## Component Structure

### Main Components

**Lightning Web Components (LWC)**

1. **Task List (taskList)**
   - Shows all tasks in list/board view
   - Handles search and filtering
   - Manages task sorting and pagination

2. **Task Detail (taskDetail)**
   - Displays task information
   - Handles edit/delete operations
   - Shows AI-generated summary with an option to regenerate

3. **AI Summary (aiSummaryDisplay)**
   - Displays AI-generated summary
   - Handles summary refresh
   - Displays error messages if generation fails
   - Shows timestamp of last generation

4. **Task Statistics Dashboard (taskStatisticsDashboard)**
   - Uses Chart.js or Lightning charts for visual representation
   - Displays task counts by status
   - Highlights overdue tasks
   - Shows task priority distribution

5. **Task Management Container (taskManagementContainer)**
   - Main container component managing overall state
   - Handles navigation between different views


**Apex**

1. **TaskManagementController.cls**
   - Handles task listing with pagination and sorting features
   - Implements search functionality using SOSL
   - Supports bulk operations for creating, updating, and deleting tasks

2. **TaskAISummaryService.cls**
   - Connects to OpenRouter.ai
   - Includes robust error handling and retry mechanisms
   - ecures API credentials using Named Credentials

3. **TaskStatisticsController.cls**
   - Provides methods to calculate various task statistics
   - Uses aggregate queries to get counts by task status
   - Computes overdue tasks and related metrics


## AI Integration

### OpenRouter.ai Setup
1. External Credential (ORAuth)
   - Stores API authentication
   - Custom header configuration
   - Secure credential storage

2. Named Credential (ORCred)
   - Endpoint: https://openrouter.ai/api/v1
   - Uses ORAuth for authentication
   - Handles API routing

3. Permission Set (ORAccess)
   - Controls API access
   - Manages user permissions
   - Required for AI features

## Data Flow

### Task Creation
1. User fills task form
2. System saves task record
3. Triggers AI summary generation
4. Updates task list view

### Task Updates
1. User modifies task
2. System saves changes
3. Triggers AI summary refresh if needed

### Search Function
1. User enters search term(Task Title or Description)
2. System queries database(SOSL Search)
3. Updates task list dynamically
4. Maintains filters/sorting

## Security

### Authentication
- Salesforce standard login
- Custom permission sets
- API key protection

### Data Access
- Object-level security
- Field-level security

## Performance Considerations

### Database
- Code is bulk-safe to handle large data volumes
- Ensured proper handling of null or empty fields to avoid runtime errors
- Used filters and conditions to retrieve only necessary records

### UI
- Lazy loading for task list
- Cached data where possible
- Debounced search
- Paginated results

## Error Handling

### UI Layer
- Toast notifications
- Clear error messages

### Backend
- Try-catch blocks
- Error logging
- API fallbacks

## Testing Strategy

### Unit Tests
- Controller methods
- Component logic
- Data operations

### Integration Tests
- AI service calls
- Component interactions
- End-to-end flows

## Deployment

### Components to Deploy
- Custom objects
- Apex classes
- LWC components
- Permission sets
- Named credentials

