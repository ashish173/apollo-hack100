
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { UserCircle, ListChecks, AlertTriangle, Info } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db as firebaseDbService } from '@/lib/firebase';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface EnrichedAssignedProjectForTeacher {
  assignmentId: string;
  projectId: string;
  projectTitle: string;
  projectDescription: string; // Keep it brief or use for a details view later
  assignedAt: Timestamp;
  status: string;
  studentUid: string;
  studentName: string; // From assignedProjects document
}

export default function TeacherDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [assignedProjectsList, setAssignedProjectsList] = useState<EnrichedAssignedProjectForTeacher[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'teacher') {
      setIsLoadingProjects(false);
      return;
    }

    const fetchAssignedProjects = async () => {
      if (!user?.uid || !firebaseDbService) {
        setFetchError("User data or database service is unavailable.");
        setIsLoadingProjects(false);
        return;
      }
      setIsLoadingProjects(true);
      setFetchError(null);

      try {
        const assignmentsRef = collection(firebaseDbService, 'assignedProjects');
        const q = query(assignmentsRef, where('teacherUid', '==', user.uid));
        const assignmentsSnapshot = await getDocs(q);

        const projectsPromises = assignmentsSnapshot.docs.map(async (assignmentDoc) => {
          const assignmentData = assignmentDoc.data();
          const projectDocRef = doc(firebaseDbService, 'projects', assignmentData.projectId);
          const projectDocSnap = await getDoc(projectDocRef);

          if (projectDocSnap.exists()) {
            const projectData = projectDocSnap.data();
            return {
              assignmentId: assignmentDoc.id,
              projectId: assignmentData.projectId,
              projectTitle: projectData.title,
              projectDescription: projectData.description,
              assignedAt: assignmentData.assignedAt as Timestamp,
              status: assignmentData.status,
              studentUid: assignmentData.studentUid,
              studentName: assignmentData.studentName || 'N/A', // studentName is stored in assignedProjects
            } as EnrichedAssignedProjectForTeacher;
          } else {
            console.warn(`Project details not found for projectId: ${assignmentData.projectId} (assignmentId: ${assignmentDoc.id})`);
            // Still return assignment data but with placeholder project info
            return {
              assignmentId: assignmentDoc.id,
              projectId: assignmentData.projectId,
              projectTitle: "Project details unavailable",
              projectDescription: "Could not load project description.",
              assignedAt: assignmentData.assignedAt as Timestamp,
              status: assignmentData.status,
              studentUid: assignmentData.studentUid,
              studentName: assignmentData.studentName || 'N/A',
            } as EnrichedAssignedProjectForTeacher;
          }
        });

        const resolvedProjects = (await Promise.all(projectsPromises)).filter(p => p !== null) as EnrichedAssignedProjectForTeacher[];
        resolvedProjects.sort((a, b) => b.assignedAt.toMillis() - a.assignedAt.toMillis()); // Newest first
        setAssignedProjectsList(resolvedProjects);

      } catch (error) {
        console.error("Error fetching teacher's assigned projects:", error);
        setFetchError("Failed to load assigned projects. Please try again later.");
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchAssignedProjects();
  }, [user, authLoading]);

  if (authLoading || !user) {
     return (
      <div className="flex-grow flex items-center justify-center p-6">
        <LoadingSpinner size={64} />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-start space-y-8">
      <Card className="w-full shadow-xl">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <ListChecks size={32} className="text-primary" />
            <CardTitle className="text-2xl font-semibold text-primary">My Assigned Projects</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground pt-2">
            A quick overview of projects you've assigned to students.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingProjects ? (
            <div className="flex w-full justify-center py-8">
              <LoadingSpinner size={48} />
            </div>
          ) : fetchError ? (
            <div className="text-destructive flex flex-col items-center space-y-2 py-8">
              <AlertTriangle size={40} />
              <p>{fetchError}</p>
            </div>
          ) : assignedProjectsList.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">You haven't assigned any projects yet.</p>
          ) : (
            <div className="space-y-4">
              {assignedProjectsList.map((project) => (
                <Card key={project.assignmentId} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl text-primary">{project.projectTitle}</CardTitle>
                    <CardDescription>
                      Assigned to: <span className="font-medium text-foreground">{project.studentName}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.projectDescription}</p>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge variant="secondary">
                        Assigned: {project.assignedAt ? format(project.assignedAt.toDate(), 'PP') : 'N/A'}
                      </Badge>
                      <Badge 
                        variant={project.status === 'completed' ? 'default' : 'destructive'}
                        className={project.status === 'completed' ? 'bg-green-500 hover:bg-green-600' : project.status === 'assigned' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-yellow-500 hover:bg-yellow-600'}
                      >
                        Status: {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
