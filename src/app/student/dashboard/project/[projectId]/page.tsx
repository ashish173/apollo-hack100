
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db as firebaseDbService } from '@/lib/firebase';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookText, CalendarDays, CheckCircle, AlertTriangle, Hourglass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface ProjectDetails {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  // other project-specific fields
}

interface AssignmentDetails {
  assignmentId: string;
  status: string;
  assignedAt: Timestamp;
  teacherUid: string;
  // other assignment-specific fields
}

export default function StudentProjectDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [assignment, setAssignment] = useState<AssignmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user || !user.uid || !projectId) {
      if (!authLoading && !user) {
          // If auth is done and still no user, means redirection or error handled by layout/auth context
          setIsLoading(false);
      }
      return;
    }

    const fetchProjectAndAssignmentDetails = async () => {
      setIsLoading(true);
      setError(null);

      if (!firebaseDbService) {
        setError("Database service is not available.");
        setIsLoading(false);
        return;
      }

      try {
        // Fetch Project Details
        const projectDocRef = doc(firebaseDbService, 'projects', projectId);
        const projectDocSnap = await getDoc(projectDocRef);

        if (!projectDocSnap.exists()) {
          setError("Project not found.");
          setIsLoading(false);
          return;
        }
        const projectData = projectDocSnap.data();
        setProject({ id: projectDocSnap.id, ...projectData } as ProjectDetails);

        // Fetch Assignment Details
        const assignmentsRef = collection(firebaseDbService, 'assignedProjects');
        const q = query(assignmentsRef, where('projectId', '==', projectId), where('studentUid', '==', user.uid));
        const assignmentSnapshot = await getDocs(q);

        if (assignmentSnapshot.empty) {
          setError("Assignment details not found for this project and student.");
          // Keep project details if found, but indicate assignment issue
        } else {
          // Assuming one assignment per student per project
          const assignmentDoc = assignmentSnapshot.docs[0];
          const assignmentData = assignmentDoc.data();
          setAssignment({ 
            assignmentId: assignmentDoc.id, 
            ...assignmentData 
          } as AssignmentDetails);
        }
      } catch (e) {
        console.error("Error fetching project/assignment details:", e);
        setError("Failed to load project details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectAndAssignmentDetails();
  }, [projectId, user, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="flex-grow flex items-center justify-center p-6">
        <LoadingSpinner size={64} />
      </div>
    );
  }

  if (error && !project) { // If project itself not found, show main error
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
        <AlertTriangle size={48} className="text-destructive" />
        <h2 className="text-xl font-semibold text-destructive">{error}</h2>
        <Button onClick={() => router.push('/student/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }
  
  if (!project) { // Should be caught by above, but as a fallback
     return (
      <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
        <AlertTriangle size={48} className="text-destructive" />
        <h2 className="text-xl font-semibold text-destructive">Project data could not be loaded.</h2>
        <Button onClick={() => router.push('/student/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-start mb-4">
        <Button variant="outline" onClick={() => router.push('/student/dashboard')} className="shadow-sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>

      <Card className="w-full max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-3xl font-bold text-primary">{project.title}</CardTitle>
            <BookText size={32} className="text-accent" />
          </div>
          {assignment && (
            <CardDescription className="pt-2">
              Assigned on: {format(assignment.assignedAt.toDate(), 'PPP')}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Description</h3>
            <p className="text-muted-foreground leading-relaxed">{project.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Difficulty</h3>
              <Badge variant="secondary" className="text-sm">{project.difficulty}</Badge>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Estimated Duration</h3>
              <Badge variant="outline" className="text-sm">{project.duration}</Badge>
            </div>
          </div>
          
          {assignment && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Status</h3>
              <Badge 
                variant={assignment.status === 'completed' ? 'default' : assignment.status === 'assigned' ? 'secondary' : 'destructive'} 
                className={`text-sm ${
                  assignment.status === 'completed' ? 'bg-green-500 hover:bg-green-600 text-white' : 
                  assignment.status === 'assigned' ? 'bg-blue-500 hover:bg-blue-600 text-white' : 
                  'bg-yellow-500 hover:bg-yellow-600 text-white'
                }`}
              >
                {assignment.status === 'completed' && <CheckCircle className="mr-1.5 h-4 w-4" />}
                {assignment.status === 'assigned' && <Hourglass className="mr-1.5 h-4 w-4" />}
                {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
              </Badge>
            </div>
          )}
          {error && assignment === null && ( // Show error if assignment details failed but project loaded
            <div className="text-destructive flex items-center space-x-2">
                <AlertTriangle size={20} />
                <p>{error}</p>
            </div>
          )}


          <div className="pt-4 border-t">
            <h3 className="text-xl font-semibold text-primary mb-2">Tasks / Milestones / Submissions</h3>
            <div className="p-4 border rounded-md bg-card-foreground/5 shadow-sm">
              <p className="text-muted-foreground">
                Details about project tasks, milestones, and submission guidelines will appear here. 
                (This section is a placeholder for future development.)
              </p>
              {/* Example of what could be here:
              <ul className="list-disc pl-5 space-y-1 mt-2 text-foreground">
                <li>Task 1: Research and Planning - Due: YYYY-MM-DD</li>
                <li>Task 2: Initial Draft/Prototype - Due: YYYY-MM-DD</li>
                <li>Task 3: Final Submission - Due: YYYY-MM-DD</li>
              </ul>
              <Button className="mt-4">Submit Work</Button>
              */}
            </div>
          </div>
        </CardContent>
        <CardFooter>
            {/* Placeholder for actions like "Mark as Complete" or "Request Help" */}
        </CardFooter>
      </Card>
    </div>
  );
}
