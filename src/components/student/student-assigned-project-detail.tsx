// components/student/student-assigned-project-detail.tsx
"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, CheckCircle, Hourglass, Clock, Calendar, User, Target, AlertCircle, Send, TrendingUp, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp as FirestoreTimestamp, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
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
import { Timestamp as FirebaseTimestampType } from 'firebase/firestore';
import { format } from 'date-fns';

// Import the ProjectIdea and SavedProjectTask types from teacher's area for consistency
import { ProjectIdea, SavedProjectTask } from '@/app/teacher/dashboard/student-mentor/idea-detail';

// Define the interface for the project data this component expects
interface StudentAssignedProjectDetailProps {
  project: {
    assignedProjectId: string;
    projectId: string;
    studentUid: string;
    studentName: string;
    teacherUid: string;
    assignedAt: FirebaseTimestampType;
    status: string;
    title: string;
    description: string;
    difficulty: string;
    duration: string;
    tasks?: SavedProjectTask[];
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
        const reportData = { id: reportDoc.id, ...reportDoc.data() } as ProjectReport;
        if (reportData.submittedAt && !(reportData.submittedAt instanceof FirestoreTimestamp)) {
          if (reportData.submittedAt && typeof reportData.submittedAt === 'object' && 'seconds' in reportData.submittedAt && 'nanoseconds' in reportData.submittedAt) {
             reportData.submittedAt = new FirestoreTimestamp((reportData.submittedAt as any).seconds, (reportData.submittedAt as any).nanoseconds);
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
        return { variant: 'secondary' as const, icon: AlertCircle };
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

  // Helper function to get project status badge variant
  const getProjectStatusBadgeVariant = (status: 'on-track' | 'off-track' | undefined) => {
    switch (status) {
      case 'on-track':
        return 'success' as const;
      case 'off-track':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
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
      const statusToSubmit = studentProjectStatus as 'on-track' | 'off-track';

      const newReportData: Omit<ProjectReport, 'id'> = {
        projectId: project.projectId,
        studentUid: project.studentUid,
        teacherUid: project.teacherUid,
        textStatus: textStatus,
        studentProjectStatus: statusToSubmit,
        submittedAt: serverTimestamp() as any,
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

  const statusProps = getStatusBadgeProps(project.status);
  const StatusIcon = statusProps.icon;

  return (
    <div className="flex-grow flex flex-col p-6 space-y-8 max-w-6xl mx-auto bg-neutral-50 dark:bg-neutral-900">
      {/* Header Navigation */}
      <div className="flex items-center gap-4">
        <Button 
          onClick={onBack} 
          variant="ghost" 
          size="default"
          className="text-blueberry-600 hover:text-blueberry-700 hover:bg-blueberry-50 dark:text-blueberry-400 dark:hover:bg-blueberry-950"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to My Projects
        </Button>
        <div className="h-6 w-px bg-neutral-300 dark:bg-neutral-600" />
        <Badge variant="outline-primary" size="default">
          <User size={14} className="mr-1" />
          Project Details
        </Badge>
      </div>

      {/* Project Overview Card */}
      <Card variant="feature" className="shadow-2xl">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blueberry-500 to-blueberry-600 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen size={32} className="text-white" />
            </div>
            <div className="flex-1">
              <CardTitle size="lg" className="text-neutral-900 dark:text-neutral-100 mb-3">
                {project.title}
              </CardTitle>
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={16} className="text-neutral-500 dark:text-neutral-400" />
                <span className="body-text text-neutral-600 dark:text-neutral-400">
                  Assigned on: <span className="font-semibold text-blueberry-700 dark:text-blueberry-300">
                    {project.assignedAt ? format(project.assignedAt.toDate(), 'PPP') : 'N/A'}
                  </span>
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                <Badge variant={getDifficultyBadgeVariant(project.difficulty)} size="default">
                  <Target size={14} className="mr-1" />
                  {project.difficulty}
                </Badge>
                <Badge variant="outline" size="default">
                  <Clock size={14} className="mr-1" />
                  {project.duration}
                </Badge>
                <Badge variant={statusProps.variant} size="default">
                  <StatusIcon size={14} className="mr-1" />
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent size="lg">
          <div className="space-y-6">
            <div>
              <h3 className="subtitle text-neutral-900 dark:text-neutral-100 mb-3">Project Description</h3>
              <p className="body-text text-neutral-700 dark:text-neutral-300 leading-relaxed bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg">
                {project.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Status Section */}
      <Card variant="elevated" className="shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success-100 dark:bg-success-900 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-success-600 dark:text-success-400" />
            </div>
            <CardTitle className="text-success-700 dark:text-success-300">Current Status</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingReport ? (
            <LoadingSpinner 
              layout="inline"
              size="default"
              variant="primary"
              label="Loading status report"
              showLabel
            />
          ) : latestReport ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <Badge variant={getProjectStatusBadgeVariant(latestReport.studentProjectStatus)} size="default">
                  <TrendingUp size={14} className="mr-1" />
                  {latestReport.studentProjectStatus === 'on-track' ? 'On Track' : 
                   latestReport.studentProjectStatus === 'off-track' ? 'Off Track' : 'Unknown'}
                </Badge>
                {latestReport.submittedAt && (
                  <span className="body-text text-neutral-500 dark:text-neutral-400 text-sm">
                    Submitted: {format(latestReport.submittedAt.toDate(), 'PPP p')}
                  </span>
                )}
              </div>
              <Card variant="ghost" className="bg-neutral-100 dark:bg-neutral-800">
                <CardContent size="lg">
                  <p className="body-text text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
                    {latestReport.textStatus}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card variant="ghost" className="text-center py-8">
              <CardContent>
                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText size={32} className="text-neutral-400 dark:text-neutral-500" />
                </div>
                <p className="body-text text-neutral-500 dark:text-neutral-400">
                  No status reports submitted yet. Submit your first progress report below.
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Project Plan Section */}
      <Card variant="elevated" className="shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blueberry-100 dark:bg-blueberry-900 rounded-lg flex items-center justify-center">
              <Target size={20} className="text-blueberry-600 dark:text-blueberry-400" />
            </div>
            <div>
              <CardTitle className="text-blueberry-700 dark:text-blueberry-300">Project Plan</CardTitle>
              <CardDescription className="body-text text-neutral-600 dark:text-neutral-400">
                Detailed task breakdown and timeline
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {project.tasks && project.tasks.length > 0 ? (
            <Card variant="ghost" className="border border-neutral-200 dark:border-neutral-700">
              <CardContent noPadding>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-50 dark:bg-neutral-800">
                        <TableHead className="subtitle text-neutral-900 dark:text-neutral-100">Task Name</TableHead>
                        <TableHead className="subtitle text-neutral-900 dark:text-neutral-100">Task ID</TableHead>
                        <TableHead className="subtitle text-neutral-900 dark:text-neutral-100">Duration</TableHead>
                        <TableHead className="subtitle text-neutral-900 dark:text-neutral-100">Start Date</TableHead>
                        <TableHead className="subtitle text-neutral-900 dark:text-neutral-100 text-right">End Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {project.tasks.map((task, index) => (
                        <TableRow key={task.taskId || index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                          <TableCell className="body-text text-neutral-800 dark:text-neutral-200 font-medium">{task.taskName}</TableCell>
                          <TableCell className="body-text text-neutral-600 dark:text-neutral-400">{task.taskId}</TableCell>
                          <TableCell className="body-text text-neutral-600 dark:text-neutral-400">{task.duration}</TableCell>
                          <TableCell className="body-text text-neutral-600 dark:text-neutral-400">{task.startDate}</TableCell>
                          <TableCell className="body-text text-neutral-600 dark:text-neutral-400 text-right">{task.endDate}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card variant="ghost" className="text-center py-12">
              <CardContent>
                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Target size={32} className="text-neutral-400 dark:text-neutral-500" />
                </div>
                <p className="body-text text-neutral-500 dark:text-neutral-400">
                  No detailed plan available for this project.
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Weekly Progress Report Card */}
      <Card variant="feature" className="shadow-2xl border-blueberry-200 dark:border-blueberry-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blueberry-500 to-blueberry-600 rounded-xl flex items-center justify-center shadow-lg">
              <Send size={24} className="text-white" />
            </div>
            <div>
              <CardTitle size="lg" className="text-blueberry-800 dark:text-blueberry-200">Weekly Progress Report</CardTitle>
              <CardDescription className="body-text text-blueberry-700 dark:text-blueberry-300">
                Submit your weekly status and rate your progress
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent size="lg" className="space-y-6">
          <div className="space-y-3">
            <Label 
              variant="default" 
              size="default"
              className="text-neutral-700 dark:text-neutral-300"
            >
              Describe your progress and any challenges:
            </Label>
            <Textarea
              variant="outline"
              size="lg"
              value={textStatus}
              onChange={(e) => setTextStatus(e.target.value)}
              placeholder="Enter your status update, challenges faced, accomplishments, and next steps..."
              className="min-h-[120px] bg-white dark:bg-neutral-800"
            />
          </div>
          
          <div className="space-y-3">
            <Label 
              variant="default" 
              size="default"
              className="text-neutral-700 dark:text-neutral-300"
            >
              Project Status:
            </Label>
            <Select value={studentProjectStatus} onValueChange={setStudentProjectStatus}>
              <SelectTrigger 
                variant="outline"
                size="lg"
                className="bg-white dark:bg-neutral-800"
              >
                <SelectValue placeholder="Select your current project status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="on-track">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-success-500 rounded-full" />
                    On Track - Meeting deadlines and objectives
                  </div>
                </SelectItem>
                <SelectItem value="off-track">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-error-500 rounded-full" />
                    Off Track - Facing challenges or delays
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handleSubmitReport} 
            disabled={isSubmitting || !textStatus.trim() || !studentProjectStatus}
            loading={isSubmitting}
            loadingText="Submitting your report..."
            variant="gradient"
            size="lg"
            className="w-full shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            {!isSubmitting && (
              <>
                <Send size={18} className="mr-2" />
                Submit Progress Report
              </>
            )}
          </Button>
          
          {(!textStatus.trim() || !studentProjectStatus) && (
            <p className="body-text text-neutral-500 dark:text-neutral-400 text-center text-sm">
              Please fill in both fields to submit your report
            </p>
          )}
        </CardContent>
      </Card>

      {/* Navigation Footer */}
      <Card variant="ghost" className="border-none">
        <CardContent className="flex justify-center">
          <Button 
            onClick={onBack} 
            variant="outline" 
            size="lg"
            className="border-blueberry-300 text-blueberry-700 hover:bg-blueberry-50 dark:border-blueberry-600 dark:text-blueberry-400 dark:hover:bg-blueberry-950"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to My Projects
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}