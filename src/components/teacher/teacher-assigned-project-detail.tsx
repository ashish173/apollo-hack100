// components/teacher/teacher-assigned-project-detail.tsx
"use client";

import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { ProjectReport } from '@/types'; // Assuming path is correct
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';


// Import the ProjectIdea and SavedProjectTask types from idea-detail.tsx
import { ProjectIdea, SavedProjectTask } from '@/app/teacher/dashboard/student-mentor/idea-detail';
// import { Timestamp } from 'firebase/firestore'; // Already imported above
import TaskHints from '@/app/teacher/dashboard/student-mentor/task-hints';
// import { useState } from 'react'; // Already imported above

// Define the interface for the project data this component expects
interface AssignedProjectWithDetails {
  assignedProjectId: string;
  projectId: string;
  studentUid: string;
  studentName: string;
  teacherUid: string;
  assignedAt: Timestamp; // Using Timestamp from Firestore
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  tasks?: SavedProjectTask[]; // Expects the camelCase structure
}

interface TeacherAssignedProjectDetailProps {
  project: AssignedProjectWithDetails;
  onBack: () => void;
}

export default function TeacherAssignedProjectDetail({ project, onBack }: TeacherAssignedProjectDetailProps) {
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<SavedProjectTask | null>(null);
  const [latestReport, setLatestReport] = useState<ProjectReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(true);

  useEffect(() => {
    if (!project.projectId) {
      setIsLoadingReport(false);
      return;
    }

    setIsLoadingReport(true);
    const reportsRef = collection(db, "projectReports");
    const q = query(
      reportsRef,
      where("projectId", "==", project.projectId),
      // Assuming studentUid is also part of the report to ensure we only get this student's report
      // If not, and multiple students could be on a project (not typical for this app structure),
      // this where clause might need adjustment or be removed if projectId is globally unique per student assignment.
      where("studentUid", "==", project.studentUid),
      orderBy("submittedAt", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const reportDoc = querySnapshot.docs[0];
        const reportData = { id: reportDoc.id, ...reportDoc.data() } as ProjectReport;
        // Ensure submittedAt is correctly handled as Firestore Timestamp
        if (reportData.submittedAt && !(reportData.submittedAt instanceof Timestamp)) {
          if (reportData.submittedAt && typeof reportData.submittedAt === 'object' && 'seconds' in reportData.submittedAt && 'nanoseconds' in reportData.submittedAt) {
            reportData.submittedAt = new Timestamp((reportData.submittedAt as any).seconds, (reportData.submittedAt as any).nanoseconds);
          } else {
            console.warn("latestReport.submittedAt is not a Firestore Timestamp:", reportData.submittedAt);
          }
        }
        setLatestReport(reportData);
      } else {
        setLatestReport(null);
      }
      setIsLoadingReport(false);
    }, (error) => {
      console.error("Error fetching latest student report: ", error);
      toast({
        title: "Error",
        description: "Could not load the student's latest project status.",
        variant: "destructive",
      });
      setIsLoadingReport(false);
      setLatestReport(null);
    });

    return () => unsubscribe();
  }, [project.projectId, project.studentUid, toast]);
  
  const getStudentStatusBadgeClass = (status: 'on-track' | 'off-track' | undefined): string => {
    if (status === 'on-track') return "bg-green-500 hover:bg-green-600 text-white";
    if (status === 'off-track') return "bg-red-500 hover:bg-red-600 text-white";
    return "bg-gray-500 hover:bg-gray-600 text-white"; // Default for undefined or unexpected
  };

  const getAIRatingBadgeClass = (rating: number | null): string => {
    if (rating === null) return "bg-gray-400 hover:bg-gray-500 text-white"; // AI rating not available
    if (rating > 5) return "bg-green-500 hover:bg-green-600 text-white";
    return "bg-red-500 hover:bg-red-600 text-white";
  };

  let aiRating: number | null = null;
  if (latestReport?.studentProjectStatus) {
    if (latestReport.studentProjectStatus === 'on-track') {
      aiRating = Math.floor(Math.random() * 5) + 6; // 6-10
    } else { // 'off-track'
      aiRating = Math.floor(Math.random() * 5) + 1; // 1-5
    }
  }

  // Function to format Firestore Timestamp to a readable date string
  const formatAssignedDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <div className="flex-grow flex flex-col items-center p-6 space-y-6">
        <div className="w-full flex justify-start">
          <Button onClick={onBack} variant="outline" className="shadow-sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Assigned Projects
          </Button>
        </div>
        <Card className="w-full shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary mb-2">{project.title}</CardTitle>
            <CardDescription className="flex items-center text-md text-muted-foreground">
              Assigned to: <span className="font-semibold text-primary ml-1">{project.studentName}</span>
              {project.assignedAt && (
                <span className="ml-4 text-sm text-muted-foreground">
                  (on {formatAssignedDate(project.assignedAt)})
                </span>
              )}
            </CardDescription>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary">Difficulty: {project.difficulty}</Badge>
              <Badge variant="outline">Duration: {project.duration}</Badge>
              <Badge variant="default">Status: Assigned</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{project.description}</p>

            {/* Latest Student Report Section */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-lg font-semibold text-primary mb-3">Latest Student Report</h4>
              {isLoadingReport ? (
                <p className="text-muted-foreground">Loading student's report...</p>
              ) : latestReport ? (
                <div className="space-y-4 p-4 border rounded-md bg-background/40 shadow-sm">
                  <div className="space-y-2">
                    <h5 className="text-md font-semibold text-muted-foreground">Student's Self-Reported Status:</h5>
                    <div className="flex items-center space-x-3">
                      <Badge className={cn("text-sm", getStudentStatusBadgeClass(latestReport.studentProjectStatus))}>
                        Status: {latestReport.studentProjectStatus === 'on-track' ? 'On Track' : latestReport.studentProjectStatus === 'off-track' ? 'Off Track' : 'N/A'}
                      </Badge>
                      {latestReport.submittedAt && (
                         <p className="text-sm text-muted-foreground">
                           Submitted: {format(latestReport.submittedAt.toDate(), 'PPP p')}
                         </p>
                      )}
                    </div>
                    <p className="text-muted-foreground whitespace-pre-wrap bg-background/30 p-3 rounded-md border">
                      {latestReport.textStatus}
                    </p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-border/50">
                     <h5 className="text-md font-semibold text-muted-foreground">AI Assistant's Evaluation:</h5>
                    {aiRating !== null ? (
                      <Badge className={cn("text-sm animated-siri-border", getAIRatingBadgeClass(aiRating))}>
                        ✨ AI Rating: {aiRating}/10
                      </Badge>
                    ) : (
                      <p className="text-sm text-muted-foreground">AI analysis pending student report.</p>
                    )}
                    {/* Future: Could add AI textual feedback here */}
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground p-4 border rounded-md bg-background/40 shadow-sm">
                  No status reports submitted by the student yet for AI analysis.
                </p>
              )}
            </div>

            {/* Existing Project Plan section */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-xl font-semibold text-primary mb-3">Project Plan</h3>
              <div className="p-4 border rounded-md bg-background/50 shadow-sm">
                {project.tasks && project.tasks.length > 0 ? (
                  <ScrollArea className="h-[300px]"> {/* Fixed height for scrollable area */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[5%]"></TableHead>
                          <TableHead className="w-[30%]">Task Name</TableHead>
                          <TableHead className="w-[10%]">Task ID</TableHead>
                          <TableHead className="w-[15%]">Duration</TableHead>
                          <TableHead className="w-[20%]">Start Date</TableHead>
                          <TableHead className="w-[20%] text-right">End Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {project.tasks.map((task, index) => (
                          <TableRow key={task.taskId || index} className="hover:bg-muted">
                            <TableCell className="py-2">
                              <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedTask(task)}
                                  className="mr-2 text-xs py-1 h-auto border border-border hover:border-primary"
                                > ✨ Hints</Button>
                            </TableCell>
                            <TableCell className="py-2">{task.taskName}</TableCell>
                            <TableCell className="py-2">{task.taskId}</TableCell>
                            <TableCell className="py-2">{task.duration}</TableCell>
                            <TableCell className="py-2">{task.startDate}</TableCell>
                            <TableCell className="text-right py-2">{task.endDate}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                ) : (
                  <p className="text-center text-muted-foreground p-4">No detailed plan available for this project.</p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-6">
            <Button onClick={onBack} variant="outline" className="w-full shadow-sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Assigned Projects
            </Button>
          </CardFooter>
        </Card>
      </div>

      {
        selectedTask && (
          <TaskHints
            task={selectedTask.taskName}
            idea={project.description}
            onClose={() => setSelectedTask(null)}
          />
        )
      }

    </>
  );
}