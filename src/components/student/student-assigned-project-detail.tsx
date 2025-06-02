// components/student/student-assigned-project-detail.tsx
"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, CheckCircle, Hourglass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp as FirestoreTimestamp, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'; // Renamed Timestamp to avoid conflict
import { ProjectReport } from '@/types';
import { useToast } from '@/hooks/use-toast';
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
import { Timestamp as FirebaseTimestampType } from 'firebase/firestore'; // Original Timestamp for props
import { format } from 'date-fns';

// Import the ProjectIdea and SavedProjectTask types from teacher's area for consistency
import { ProjectIdea, SavedProjectTask } from '@/app/teacher/dashboard/student-mentor/idea-detail';

// Define the interface for the project data this component expects
// This should match the 'AssignedProjectWithDetails' in app/student/dashboard/page.tsx
interface StudentAssignedProjectDetailProps {
  project: {
    assignedProjectId: string;
    projectId: string;
    studentUid: string;
    studentName: string;
    teacherUid: string;
    assignedAt: FirebaseTimestampType; // Use the aliased Timestamp for props
    status: string;
    title: string;
    description: string;
    difficulty: string;
    duration: string;
    tasks?: SavedProjectTask[]; // Expects the camelCase structure for tasks
  };
  onBack: () => void;
}

export default function StudentAssignedProjectDetail({ project, onBack }: StudentAssignedProjectDetailProps) {
  const { toast } = useToast();
  const [textStatus, setTextStatus] = useState('');
  const [studentProjectStatus, setStudentProjectStatus] = useState<'on-track' | 'off-track' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestReport, setLatestReport] = useState<ProjectReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(true);

  useEffect(() => {
    if (!project.projectId) {
      setIsLoadingReport(false);
      return;
    }

    setIsLoadingReport(true);
    console.log("db: ", db);
    window.db_ = db;
    const reportsRef = collection(db, "projectReports");
    const q = query(
      reportsRef,
      where("projectId", "==", project.projectId),
      orderBy("submittedAt", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const reportDoc = querySnapshot.docs[0];
        // Ensure submittedAt is correctly handled as FirestoreTimestamp
        const reportData = { id: reportDoc.id, ...reportDoc.data() } as ProjectReport;
        if (reportData.submittedAt && !(reportData.submittedAt instanceof FirestoreTimestamp)) {
          // Attempt to convert if it's a plain object (e.g. from SSR or incorrect hydration)
          // This is a common Firestore hydration issue if not handled carefully across client/server
          if (reportData.submittedAt && typeof reportData.submittedAt === 'object' && 'seconds' in reportData.submittedAt && 'nanoseconds' in reportData.submittedAt) {
             reportData.submittedAt = new FirestoreTimestamp((reportData.submittedAt as any).seconds, (reportData.submittedAt as any).nanoseconds);
          } else {
            // If conversion is not straightforward, log an error or handle appropriately
            console.warn("latestReport.submittedAt is not a Firestore Timestamp:", reportData.submittedAt);
            // Fallback or error handling: possibly set to null or a default date, or treat as invalid
          }
        }
        setLatestReport(reportData);
      } else {
        setLatestReport(null);
      }
      setIsLoadingReport(false);
    }, (error) => {
      console.error("Error fetching latest report: ", error);
      toast({
        title: "Error",
        description: "Could not load the latest project status.",
        variant: "destructive",
      });
      setIsLoadingReport(false);
      setLatestReport(null);
    });

    return () => unsubscribe();
  }, [project.projectId, toast]);

  const getStatusBadgeClass = (status: 'on-track' | 'off-track' | undefined): string => {
    if (status === 'on-track') return "bg-green-500 hover:bg-green-600 text-white";
    if (status === 'off-track') return "bg-red-500 hover:bg-red-600 text-white";
    return "bg-gray-500 hover:bg-gray-600 text-white"; // Default or undetermined
  };

  const handleSubmitReport = async () => {
    if (!textStatus.trim() || !studentProjectStatus) {
      toast({
        title: "Missing information",
        description: "Please describe your progress and select a project status.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure studentProjectStatus is one of the allowed literal types for the ProjectReport interface
      const statusToSubmit = studentProjectStatus as 'on-track' | 'off-track';

      const newReportData: Omit<ProjectReport, 'id'> = {
        projectId: project.projectId,
        studentUid: project.studentUid,
        teacherUid: project.teacherUid,
        textStatus: textStatus,
        studentProjectStatus: statusToSubmit,
        submittedAt: serverTimestamp() as any, // Cast to any because serverTimestamp is a sentinel
      };

      await addDoc(collection(db, "projectReports"), newReportData);

      toast({
        title: "Report Submitted",
        description: "Your progress report has been submitted successfully!",
      });
      setTextStatus('');
      setStudentProjectStatus('');
    } catch (error) {
      console.error("Error submitting report: ", error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center p-6 space-y-6 max-w-4xl mx-auto">
      <div className="w-full flex justify-start">
        <Button onClick={onBack} variant="outline" className="shadow-sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Projects
        </Button>
      </div>
      <Card className="w-full shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-start mb-2">
            <CardTitle className="text-2xl font-bold text-primary">{project.title}</CardTitle>
              <BookOpen size={28} className="text-accent flex-shrink-0" />
            </div>
            <CardDescription className="flex items-center text-md text-muted-foreground">
              Assigned on: <span className="font-semibold text-primary ml-1">
                {project.assignedAt ? format(project.assignedAt.toDate(), 'PPP') : 'N/A'}
              </span>
            </CardDescription>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary">Difficulty: {project.difficulty}</Badge>
              <Badge variant="outline">Duration: {project.duration}</Badge>
              <Badge
                variant={project.status === 'completed' ? 'default' : project.status === 'assigned' ? 'secondary' : 'destructive'}
                className={`text-sm ${
                  project.status === 'completed' ? 'bg-green-500 hover:bg-green-600 text-white' :
                  project.status === 'assigned' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                  'bg-yellow-500 hover:bg-yellow-600 text-white'
                }`}
              >
                {project.status === 'completed' && <CheckCircle className="mr-1.5 h-4 w-4" />}
                {project.status === 'assigned' && <Hourglass className="mr-1.5 h-4 w-4" />}
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{project.description}</p>

            {/* Current Status Section */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-lg font-semibold text-primary mb-3">Current Status</h4>
              {isLoadingReport ? (
                <p className="text-muted-foreground">Loading status...</p>
              ) : latestReport ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Badge className={cn("text-sm", getStatusBadgeClass(latestReport.studentProjectStatus))}>
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
              ) : (
                <p className="text-muted-foreground">No status reports submitted yet.</p>
              )}
            </div>

            {/* Project Plan section */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-xl font-semibold text-primary mb-3">Project Plan</h3>
              <div className="p-4 border rounded-md bg-background/50 shadow-sm">
                {project.tasks && project.tasks.length > 0 ? (
                  <ScrollArea className="h-[300px]">
                    <Table><TableHeader><TableRow>
                        <TableHead className="w-[30%]">Task Name</TableHead>
                        <TableHead className="w-[10%]">Task ID</TableHead>
                        <TableHead className="w-[15%]">Duration</TableHead>
                        <TableHead className="w-[20%]">Start Date</TableHead>
                        <TableHead className="w-[20%] text-right">End Date</TableHead>
                      </TableRow></TableHeader>
                    <TableBody>
                      {project.tasks.map((task, index) => (
                        <TableRow key={task.taskId || index} className="hover:bg-muted">
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
        {/* Removed CardFooter from here to place the new Card above it */}
      </Card>

      {/* Weekly Progress Report Card */}
      <Card className="w-full shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary">Weekly Progress Report</CardTitle>
          <CardDescription>Submit your weekly status and rate your progress.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="textStatus">Describe your progress and any challenges:</Label>
            <Textarea
              id="textStatus"
              value={textStatus}
              onChange={(e) => setTextStatus(e.target.value)}
              placeholder="Enter your status update..."
              rows={5}
              className="shadow-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="studentProjectStatus">Project Status:</Label>
            <Select value={studentProjectStatus} onValueChange={setStudentProjectStatus}>
              <SelectTrigger id="studentProjectStatus" className="w-full shadow-sm">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="on-track">On Track</SelectItem>
                <SelectItem value="off-track">Off Track</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSubmitReport} disabled={isSubmitting} className="w-full shadow-md">
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </CardContent>
      </Card>

      {/* Moved CardFooter to be below the new report card */}
      <Card className="w-full shadow-xl mt-0"> {/* Use a wrapper Card to maintain spacing, or adjust classes as needed */}
        <CardFooter className="pt-6">
            <Button onClick={onBack} variant="outline" className="w-full shadow-sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Projects
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}