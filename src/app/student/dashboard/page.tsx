// app/student/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { collection, query, where, getDocs, doc, getDoc, Timestamp, documentId } from 'firebase/firestore';
import { db as firebaseDbService } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { GraduationCap, BookOpen, AlertTriangle, User, Calendar, Clock, Target, Sparkles, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

// Import the new detail component
import StudentAssignedProjectDetail, { ProjectResources } from '@/components/student/student-assigned-project-detail';

// Import ProjectIdea and SavedProjectTask types from where they are defined
import { ProjectIdea, SavedProjectTask } from '@/app/teacher/dashboard/student-mentor/idea-detail';

// Define an interface that combines data from 'assignedProjects' and 'projects' collections
interface AssignedProjectWithDetails {
  assignedProjectId: string;
  projectId: string;
  studentUid: string;
  studentName: string;
  teacherUid: string;
  assignedAt: Timestamp;
  status: string;
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  tasks?: SavedProjectTask[];
  resources?: ProjectResources;
}

export default function StudentDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [assignedProjects, setAssignedProjects] = useState<AssignedProjectWithDetails[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // State to manage the view mode (list of cards or single project detail)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  // State to hold the data of the project currently selected for detail view
  const [selectedProject, setSelectedProject] = useState<AssignedProjectWithDetails | null>(null);

  const fetchAssignedProjects = useCallback(async () => {
    if (!user || !firebaseDbService || !user.uid) return;

    setLoadingProjects(true);
    setFetchError(null);
    
    try {
      // Step 1: Fetch all assigned projects for the student
      const assignmentsRef = collection(firebaseDbService, 'assignedProjects');
      const assignmentQuery = query(assignmentsRef, where('studentUid', '==', user.uid));
      const assignmentSnapshot = await getDocs(assignmentQuery);

      if (assignmentSnapshot.empty) {
        setAssignedProjects([]);
        setLoadingProjects(false);
        return;
      }

      // Step 2: Extract unique project IDs
      const assignmentData = assignmentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const projectIds = [...new Set(assignmentData.map(assignment => assignment.projectId))];
      
      if (projectIds.length === 0) {
        setAssignedProjects([]);
        setLoadingProjects(false);
        return;
      }

      // Step 3: Batch fetch all project details
      // Firestore 'in' queries are limited to 10 items, so we need to chunk if necessary
      const chunkSize = 10;
      const projectChunks: string[][] = [];
      
      for (let i = 0; i < projectIds.length; i += chunkSize) {
        projectChunks.push(projectIds.slice(i, i + chunkSize));
      }

      const allProjects: { [key: string]: any } = {};
      
      // Fetch projects in batches
      for (const chunk of projectChunks) {
        const projectsRef = collection(firebaseDbService, 'projects');
        const projectQuery = query(projectsRef, where(documentId(), 'in', chunk));
        const projectSnapshot = await getDocs(projectQuery);
        
        projectSnapshot.docs.forEach(doc => {
          allProjects[doc.id] = { id: doc.id, ...doc.data() };
        });
      }

      // Step 4: Combine assignment data with project details
      const fetchedAssignedProjects: AssignedProjectWithDetails[] = [];
      
      assignmentData.forEach(assignment => {
        const projectData = allProjects[assignment.projectId];
        
        if (projectData) {
          fetchedAssignedProjects.push({
            assignedProjectId: assignment.id,
            projectId: assignment.projectId,
            studentUid: assignment.studentUid,
            studentName: assignment.studentName || user.displayName || user.email || 'N/A',
            teacherUid: assignment.teacherUid,
            assignedAt: assignment.assignedAt as Timestamp,
            status: assignment.status,
            title: projectData.title,
            description: projectData.description,
            difficulty: projectData.difficulty,
            duration: projectData.duration,
            tasks: projectData.tasks || [],
            resources: projectData.resources || {}
          });
        } else {
          console.warn(`Project document with ID ${assignment.projectId} not found for student ${user.uid}. Skipping this assignment.`);
        }
      });
      
      // Sort by assignment date (newest first)
      fetchedAssignedProjects.sort((a, b) => {
        const dateA = a.assignedAt?.toDate?.() || new Date(0);
        const dateB = b.assignedAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setAssignedProjects(fetchedAssignedProjects);
    } catch (error) {
      console.error("Error fetching assigned projects for student:", error);
      setFetchError("Failed to load your projects. Please try again later.");
    } finally {
      setLoadingProjects(false);
    }
  }, [user, user?.displayName, user?.email]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchAssignedProjects();
    }
  }, [user, authLoading, fetchAssignedProjects]);

  // Function to handle clicking on a project card to view details
  const handleViewDetails = (project: AssignedProjectWithDetails) => {
    setSelectedProject(project);
    setViewMode('detail');
  };

  // Function to go back to the list view from the detail page
  const handleBackToList = () => {
    setSelectedProject(null);
    setViewMode('list');
  };

  // Helper function to get status badge variant and color
  const getStatusBadgeProps = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return { variant: 'success' as const, icon: CheckCircle };
      case 'assigned':
        return { variant: 'soft-primary' as const, icon: BookOpen };
      case 'in-progress':
        return { variant: 'warning' as const, icon: Clock };
      default:
        return { variant: 'secondary' as const, icon: AlertTriangle };
    }
  };

  // Helper function to get difficulty badge variant
  const getDifficultyBadgeVariant = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'success' as const;
      case 'medium':
        return 'warning' as const;
      case 'hard':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  if (authLoading) {
    return (
      <div className="flex-grow flex items-center justify-center p-6 bg-neutral-50 dark:bg-neutral-900">
        <LoadingSpinner 
          layout="centered"
          size="xl"
          variant="primary"
          label="Loading your dashboard"
          description="Please wait while we fetch your assigned projects..."
          showLabel
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-grow flex items-center justify-center p-6 bg-neutral-50 dark:bg-neutral-900">
        <Card variant="ghost" className="text-center py-16 max-w-md">
          <CardContent size="xl">
            <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <User size={48} className="text-neutral-400 dark:text-neutral-500" />
            </div>
            <h3 className="heading-3 text-neutral-900 dark:text-neutral-100 mb-2">Authentication Required</h3>
            <p className="body-text text-neutral-600 dark:text-neutral-400">
              Please sign in to view your student dashboard and assigned projects.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Conditionally render the detail component if a project is selected
  if (viewMode === 'detail' && selectedProject) {
    return (
      <StudentAssignedProjectDetail
        project={selectedProject}
        onBack={handleBackToList}
      />
    );
  }

  // Otherwise, render the list of assigned projects
  return (
    <div className="flex-grow flex flex-col p-6 space-y-8 mx-auto max-w-6xl bg-neutral-50 dark:bg-neutral-900">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blueberry-100 to-blueberry-200 dark:from-blueberry-900 dark:to-blueberry-800 flex items-center justify-center shadow-lg">
            <GraduationCap size={48} className="text-blueberry-600 dark:text-blueberry-400" />
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blueberry-400 to-blueberry-600 flex items-center justify-center animate-pulse">
            <Sparkles size={24} className="text-white" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="heading-1 bg-gradient-to-r from-blueberry-600 to-blueberry-700 bg-clip-text text-transparent dark:from-blueberry-400 dark:to-blueberry-500">
            Student Dashboard
          </h1>
          <p className="heading-3 text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto font-normal leading-relaxed">
            Welcome back, {user.displayName || user.email || 'Student'}! Here are your assigned projects and learning opportunities.
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      {assignedProjects.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="interactive" className="text-center group hover:shadow-lg transition-shadow duration-300">
            <CardContent className="flex flex-col items-center space-y-3 pt-6">
              <div className="w-12 h-12 bg-blueberry-100 dark:bg-blueberry-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <BookOpen size={24} className="text-blueberry-600 dark:text-blueberry-400" />
              </div>
              <div className="space-y-1">
                <div className="heading-2 text-blueberry-600 dark:text-blueberry-400">{assignedProjects.length}</div>
                <div className="body-text text-neutral-600 dark:text-neutral-400 text-sm">Total Projects</div>
              </div>
            </CardContent>
          </Card>

          <Card variant="interactive" className="text-center group hover:shadow-lg transition-shadow duration-300">
            <CardContent className="flex flex-col items-center space-y-3 pt-6">
              <div className="w-12 h-12 bg-success-100 dark:bg-success-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CheckCircle size={24} className="text-success-600 dark:text-success-400" />
              </div>
              <div className="space-y-1">
                <div className="heading-2 text-success-600 dark:text-success-400">
                  {assignedProjects.filter(p => p.status.toLowerCase() === 'completed').length}
                </div>
                <div className="body-text text-neutral-600 dark:text-neutral-400 text-sm">Completed</div>
              </div>
            </CardContent>
          </Card>

          <Card variant="interactive" className="text-center group hover:shadow-lg transition-shadow duration-300">
            <CardContent className="flex flex-col items-center space-y-3 pt-6">
              <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Clock size={24} className="text-warning-600 dark:text-warning-400" />
              </div>
              <div className="space-y-1">
                <div className="heading-2 text-warning-600 dark:text-warning-400">
                  {assignedProjects.filter(p => p.status.toLowerCase() === 'in-progress').length}
                </div>
                <div className="body-text text-neutral-600 dark:text-neutral-400 text-sm">In Progress</div>
              </div>
            </CardContent>
          </Card>

          <Card variant="interactive" className="text-center group hover:shadow-lg transition-shadow duration-300">
            <CardContent className="flex flex-col items-center space-y-3 pt-6">
              <div className="w-12 h-12 bg-error-100 dark:bg-error-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Target size={24} className="text-error-600 dark:text-error-400" />
              </div>
              <div className="space-y-1">
                <div className="heading-2 text-error-600 dark:text-error-400">
                  {assignedProjects.filter(p => p.status.toLowerCase() === 'assigned').length}
                </div>
                <div className="body-text text-neutral-600 dark:text-neutral-400 text-sm">New Assignments</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="w-full">
        {loadingProjects ? (
          <LoadingSpinner 
            layout="centered"
            size="lg"
            variant="primary"
            label="Loading your projects"
            description="Fetching your assigned projects and tasks..."
            showLabel
          />
        ) : fetchError ? (
          <Card variant="ghost" className="text-center py-16">
            <CardContent size="xl">
              <div className="w-24 h-24 bg-error-100 dark:bg-error-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={48} className="text-error-600 dark:text-error-400" />
              </div>
              <div className="space-y-4">
                <h3 className="heading-3 text-error-800 dark:text-error-200">Unable to Load Projects</h3>
                <p className="body-text text-error-700 dark:text-error-300 max-w-md mx-auto">{fetchError}</p>
                <Button 
                  variant="outline" 
                  onClick={fetchAssignedProjects}
                  className="border-error-300 text-error-700 hover:bg-error-50 dark:border-error-600 dark:text-error-400 dark:hover:bg-error-950"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : assignedProjects.length === 0 ? (
          <Card variant="ghost" className="text-center py-16">
            <CardContent size="xl">
              <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BookOpen size={48} className="text-neutral-400 dark:text-neutral-500" />
              </div>
              <div className="space-y-2">
                <h3 className="heading-3 text-neutral-900 dark:text-neutral-100">No Projects Assigned Yet</h3>
                <p className="body-text text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
                  You don't have any projects assigned to you yet. Check back later or contact your instructor for assignments.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignedProjects.map((project) => {
              const statusProps = getStatusBadgeProps(project.status);
              const StatusIcon = statusProps.icon;
              
              return (
                <Card
                  key={project.assignedProjectId}
                  variant="elevated"
                  className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
                  onClick={() => handleViewDetails(project)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <CardTitle size="lg" className="text-neutral-900 dark:text-neutral-100 group-hover:text-blueberry-700 dark:group-hover:text-blueberry-300 transition-colors line-clamp-2">
                          {project.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2 text-neutral-500 dark:text-neutral-400">
                          <Calendar size={14} />
                          <span className="body-text text-sm">
                            {project.assignedAt ? format(project.assignedAt.toDate(), 'PPP') : 'Date not available'}
                          </span>
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-blueberry-100 dark:bg-blueberry-900 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <StatusIcon size={20} className="text-blueberry-600 dark:text-blueberry-400" />
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 pt-3">
                      <Badge variant={getDifficultyBadgeVariant(project.difficulty)} size="sm">
                        {project.difficulty}
                      </Badge>
                      <Badge variant="outline" size="sm">
                        <Clock size={12} className="mr-1" />
                        {project.duration}
                      </Badge>
                      <Badge variant={statusProps.variant} size="sm">
                        <StatusIcon size={12} className="mr-1" />
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-grow">
                    <p className="body-text text-neutral-600 dark:text-neutral-400 line-clamp-3 leading-relaxed">
                      {project.description}
                    </p>
                    
                    <div className="mt-4 space-y-2">
                      {project.tasks && project.tasks.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Target size={14} className="text-blueberry-600 dark:text-blueberry-400" />
                          <span className="body-text text-neutral-700 dark:text-neutral-300 font-medium text-sm">
                            {project.tasks.length} Task{project.tasks.length !== 1 ? 's' : ''} Available
                          </span>
                        </div>
                      )}
                      
                      {project.resources?.papers && project.resources.papers.length > 0 && (
                        <div className="flex items-center gap-2">
                          <BookOpen size={14} className="text-warning-600 dark:text-warning-400" />
                          <span className="body-text text-neutral-700 dark:text-neutral-300 font-medium text-sm">
                            {project.resources.papers.length} Research Paper{project.resources.papers.length !== 1 ? 's' : ''} Available
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Help Section */}
      {assignedProjects.length > 0 && (
        <Card variant="gradient" className="mt-8">
          <CardContent className='pt-6'>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blueberry-100 dark:bg-blueberry-900 rounded-xl flex items-center justify-center">
                <GraduationCap size={24} className="text-blueberry-600 dark:text-blueberry-400" />
              </div>
              <div className="flex-1">
                <h3 className="subtitle text-blueberry-800 dark:text-blueberry-200 mb-2">Learning Tips</h3>
                <div className="grid md:grid-cols-3 gap-4 body-text text-blueberry-700 dark:text-blueberry-300">
                  <div className="space-y-1">
                    <p className="overline text-blueberry-900 dark:text-blueberry-100">Stay Organized</p>
                    <p>Click on projects to view detailed tasks and requirements</p>
                  </div>
                  <div className="space-y-1">
                    <p className="overline text-blueberry-900 dark:text-blueberry-100">Track Progress</p>
                    <p>Monitor your completion status and upcoming deadlines</p>
                  </div>
                  <div className="space-y-1">
                    <p className="overline text-blueberry-900 dark:text-blueberry-100">Ask Questions</p>
                    <p>Reach out to your instructor if you need help or clarification</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}