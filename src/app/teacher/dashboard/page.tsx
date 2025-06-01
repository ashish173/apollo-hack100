// teacher/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db as firebaseDbService } from '@/lib/firebase';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, UserRound, BookOpen, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TeacherAssignedProjectDetail from '@/components/teacher/teacher-assigned-project-detail';
import { ProjectIdea, SavedProjectTask } from './student-mentor/idea-detail'; // Import types from idea-detail

// Define an interface that combines data from 'assignedProjects' and 'projects' collections
interface AssignedProjectWithDetails {
  assignedProjectId: string; // The ID of the document in 'assignedProjects'
  projectId: string;         // The ID of the document in 'projects'
  studentUid: string;
  studentName: string;
  teacherUid: string;
  assignedAt: Timestamp;
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  tasks?: SavedProjectTask[]; // The detailed tasks array from the 'projects' document
}

export default function TeacherDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [assignedProjects, setAssignedProjects] = useState<AssignedProjectWithDetails[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedProject, setSelectedProject] = useState<AssignedProjectWithDetails | null>(null);

  const fetchAssignedProjects = useCallback(async () => {
    if (!user || !firebaseDbService) return;

    setLoadingProjects(true);
    try {
      const assignedProjectsRef = collection(firebaseDbService, 'assignedProjects');
      const q = query(assignedProjectsRef, where('teacherUid', '==', user.uid));
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
            studentName: assignedData.studentName,
            teacherUid: assignedData.teacherUid,
            assignedAt: assignedData.assignedAt,
            title: projectData.title,
            description: projectData.description,
            difficulty: projectData.difficulty,
            duration: projectData.duration,
            tasks: projectData.tasks || [], // Ensure tasks are included, use camelCase structure
          });
        } else {
          console.warn(`Project document with ID ${projectId} not found.`);
        }
      }
      setAssignedProjects(fetchedAssignedProjects);
    } catch (error) {
      console.error("Error fetching assigned projects:", error);
      // Optionally show a toast error
    } finally {
      setLoadingProjects(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchAssignedProjects();
    }
  }, [user, authLoading, fetchAssignedProjects]);

  const handleViewDetails = (project: AssignedProjectWithDetails) => {
    setSelectedProject(project);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setSelectedProject(null);
    setViewMode('list');
    // Optionally re-fetch projects to ensure fresh data if needed after a potential change
    // fetchAssignedProjects();
  };

  if (authLoading) {
    return (
      <div className="flex-grow flex items-center justify-center p-6">
        <LoadingSpinner size={64} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-grow flex items-center justify-center p-6">
        <p className="text-muted-foreground">Please sign in to view your dashboard.</p>
      </div>
    );
  }

  if (viewMode === 'detail' && selectedProject) {
    return (
      <TeacherAssignedProjectDetail
        project={selectedProject}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="flex-grow flex flex-col p-6 space-y-8 mx-auto">
      <div className="text-center">
        <BookOpen size={56} className="mx-auto mb-5 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight text-primary">My Assigned Projects</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          A quick overview of projects you've assigned to students.
        </p>
      </div>

      <div className="w-full">
        {loadingProjects ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size={48} />
          </div>
        ) : assignedProjects.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                You haven't assigned any projects yet. Go to "Student Mentor" to assign one!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignedProjects.map((project) => (
              <Card
                key={project.assignedProjectId}
                className="shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col"
                onClick={() => handleViewDetails(project)}
              >
                <CardHeader>
                  <CardTitle className="text-xl text-primary">{project.title}</CardTitle>
                  <CardDescription className="flex items-center text-sm">
                    <UserRound className="mr-1 h-4 w-4 text-muted-foreground" />
                    Assigned to: {project.studentName}
                  </CardDescription>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="secondary">Difficulty: {project.difficulty}</Badge>
                    <Badge variant="outline">Duration: {project.duration}</Badge>
                    <Badge variant="default">Status: Assigned</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}