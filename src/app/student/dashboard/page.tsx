
"use client";

import type { Timestamp } from 'firebase/firestore';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { AlertTriangle, BookOpen, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { db as firebaseDbService } from '@/lib/firebase';

interface EnrichedAssignedProject {
  assignmentId: string; // ID of the document in assignedProjects
  projectId: string;
  projectTitle: string;
  projectDescription: string;
  projectDifficulty: string;
  projectDuration: string;
  assignedAt: Timestamp; // Firestore Timestamp from assignedProjects
  status: string;        // from assignedProjects
  teacherUid: string;    // from assignedProjects
}

export default function StudentDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [assignedProjects, setAssignedProjects] = useState<EnrichedAssignedProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'student') {
        setIsLoadingProjects(false); 
        return; // Layout handles redirection
    }

    const fetchProjects = async () => {
      if (!user || !user.uid || !firebaseDbService) {
        setIsLoadingProjects(false);
        setFetchError("User data or database service is unavailable.");
        return;
      }
      setIsLoadingProjects(true);
      setFetchError(null);
      try {
        const assignmentsRef = collection(firebaseDbService, 'assignedProjects');
        const q = query(assignmentsRef, where('studentUid', '==', user.uid));
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
              projectDifficulty: projectData.difficulty,
              projectDuration: projectData.duration,
              assignedAt: assignmentData.assignedAt as Timestamp,
              status: assignmentData.status,
              teacherUid: assignmentData.teacherUid,
            } as EnrichedAssignedProject;
          } else {
            console.warn(`Project details not found for projectId: ${assignmentData.projectId} (assignmentId: ${assignmentDoc.id})`);
            return null; 
          }
        });

        const resolvedProjects = (await Promise.all(projectsPromises)).filter(p => p !== null) as EnrichedAssignedProject[];
        
        resolvedProjects.sort((a, b) => b.assignedAt.toMillis() - a.assignedAt.toMillis());
        setAssignedProjects(resolvedProjects);

      } catch (error) {
        console.error("Error fetching assigned projects:", error);
        setFetchError("Failed to load your projects. Please try again later.");
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [user, authLoading]);

  if (authLoading && !user) { 
    return (
      <div className="flex-grow flex items-center justify-center p-6">
        <LoadingSpinner size={64} />
      </div>
    );
  }
  
  return (
    <div className="space-y-8"> 
      <Card className="w-full max-w-2xl mx-auto text-center shadow-xl">
        <CardHeader>
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
            <GraduationCap size={48} />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Student Dashboard</CardTitle>
          <CardDescription className="text-muted-foreground pt-2">
            Welcome, {user?.displayName || 'Student'}! Here are your assigned projects.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingProjects ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size={48} />
            </div>
          ) : fetchError ? (
            <div className="text-destructive flex flex-col items-center space-y-2 py-8">
              <AlertTriangle size={40} />
              <p>{fetchError}</p>
            </div>
          ) : assignedProjects.length === 0 ? (
            <p className="text-muted-foreground py-8">You have no projects assigned to you yet.</p>
          ) : (
            <div className="space-y-6 text-left">
              {assignedProjects.map((project) => (
                <Card key={project.assignmentId} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl text-primary">{project.projectTitle}</CardTitle>
                      <BookOpen size={24} className="text-accent" />
                    </div>
                     <CardDescription>
                       Assigned on: {project.assignedAt ? format(project.assignedAt.toDate(), 'PPP') : 'Date not available'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{project.projectDescription}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="secondary">Difficulty: {project.projectDifficulty}</Badge>
                      <Badge variant="outline">Duration: {project.projectDuration}</Badge>
                    </div>
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
                  </CardContent>
                  <CardFooter>
                     <Link href={`/student/dashboard/project/${project.projectId}`} passHref legacyBehavior>
                        <Button asChild variant="link" className="p-0 h-auto text-primary">
                           <a>View Details</a>
                        </Button>
                     </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
