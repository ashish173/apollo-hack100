// app/student/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db as firebaseDbService } from '@/lib/firebase';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, BookOpen, AlertTriangle } from 'lucide-react'; // Removed ArrowLeft as it's for detail page
import { Button } from '@/components/ui/button';
import { format } from 'date-fns'; // For date formatting on cards

// Import the new detail component
import StudentAssignedProjectDetail from '@/components/student/student-assigned-project-detail';

// Import ProjectIdea and SavedProjectTask types from where they are defined
import { ProjectIdea, SavedProjectTask } from '@/app/teacher/dashboard/student-mentor/idea-detail';

// Define an interface that combines data from 'assignedProjects' and 'projects' collections
// This is the full structure that will be passed to the detail component
interface AssignedProjectWithDetails {
  assignedProjectId: string; // The ID of the document in assignedProjects
  projectId: string;         // The ID of the document in projects
  studentUid: string;
  studentName: string;      // Will likely be same as logged-in user, but useful
  teacherUid: string;
  assignedAt: Timestamp;
  status: string;
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  tasks?: SavedProjectTask[]; // The detailed tasks array from the 'projects' document (camelCase)
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
    setFetchError(null); // Clear previous errors
    try {
      const assignmentsRef = collection(firebaseDbService, 'assignedProjects');
      const q = query(assignmentsRef, where('studentUid', '==', user.uid)); // Query by studentUid
      const querySnapshot = await getDocs(q);

      const fetchedAssignedProjects: AssignedProjectWithDetails[] = [];

      for (const assignedDoc of querySnapshot.docs) {
        const assignedData = assignedDoc.data();
        const projectId = assignedData.projectId;

        // Fetch the corresponding project details from the 'projects' collection
        const projectRef = doc(firebaseDbService, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);

        if (projectDoc.exists()) {
          const projectData = projectDoc.data() as ProjectIdea; // Cast to ProjectIdea type
          fetchedAssignedProjects.push({
            assignedProjectId: assignedDoc.id,
            projectId: projectId,
            studentUid: assignedData.studentUid,
            studentName: assignedData.studentName || user.displayName || user.email || 'N/A', // Use student name from assignment or user profile
            teacherUid: assignedData.teacherUid,
            assignedAt: assignedData.assignedAt as Timestamp,
            status: assignedData.status,
            title: projectData.title,
            description: projectData.description,
            difficulty: projectData.difficulty,
            duration: projectData.duration,
            tasks: projectData.tasks || [], // Crucial: Include the tasks array
          });
        } else {
          console.warn(`Project document with ID ${projectId} not found for student ${user.uid}. Skipping this assignment.`);
        }
      }
      setAssignedProjects(fetchedAssignedProjects);
    } catch (error) {
      console.error("Error fetching assigned projects for student:", error);
      setFetchError("Failed to load your projects. Please try again later.");
    } finally {
      setLoadingProjects(false);
    }
  }, [user, user?.displayName, user?.email]); // Add user dependencies for useCallback

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
    // Optional: Re-fetch projects here if you anticipate changes might happen
    // while on the detail page and want the list to be fresh.
    // fetchAssignedProjects();
  };


  if (authLoading) {
    return (
      <div className="flex-grow flex items-center justify-center p-6">
        <LoadingSpinner size={64} />
      </div>
    );
  }

  // If user is not logged in after authLoading, redirect or show message
  if (!user) {
    return (
      <div className="flex-grow flex items-center justify-center p-6">
        <p className="text-muted-foreground">Please sign in to view your dashboard.</p>
        {/* Potentially add a login button or direct to login page */}
      </div>
    );
  }

  // Conditionally render the detail component if a project is selected
  if (viewMode === 'detail' && selectedProject) {
    return (
      <StudentAssignedProjectDetail
        project={selectedProject} // Pass the full project object
        onBack={handleBackToList}
      />
    );
  }

  // Otherwise, render the list of assigned projects
  return (
    <div className="flex-grow flex flex-col p-6 space-y-8 mx-auto max-w-4xl"> {/* Adjusted max-width for better layout */}
      <div className="text-center">
        <GraduationCap size={56} className="mx-auto mb-5 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight text-primary">Student Dashboard</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Welcome, {user.displayName || user.email || 'Student'}! Here are your assigned projects.
        </p>
      </div>

      <div className="w-full">
        {loadingProjects ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size={48} />
          </div>
        ) : fetchError ? (
          <div className="text-destructive flex flex-col items-center space-y-2 py-8">
            <AlertTriangle size={40} />
            <p>{fetchError}</p>
          </div>
        ) : assignedProjects.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                You don't have any projects assigned to you yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assignedProjects.map((project) => (
              <Card
                key={project.assignedProjectId}
                className="shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col"
                onClick={() => handleViewDetails(project)} // Make the whole card clickable
              >
                <CardHeader>
                  <CardTitle className="text-xl text-primary mb-2">{project.title}</CardTitle>
                  <CardDescription className="flex items-center text-sm">
                    Assigned on: {project.assignedAt ? format(project.assignedAt.toDate(), 'PPP') : 'Date not available'}
                  </CardDescription>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="secondary">Difficulty: {project.difficulty}</Badge>
                    <Badge variant="outline">Duration: {project.duration}</Badge>
                    <Badge
                       variant={project.status === 'completed' ? 'default' : project.status === 'assigned' ? 'secondary' : 'destructive'}
                       className={
                         project.status === 'completed' ? 'bg-green-500 hover:bg-green-600 text-white' :
                         project.status === 'assigned' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                         'bg-yellow-500 hover:bg-yellow-600 text-white'
                       }
                    >
                      Status: {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>
                </CardContent>
                {/* No explicit CardFooter with "View Details" button needed here since the whole card is clickable */}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}