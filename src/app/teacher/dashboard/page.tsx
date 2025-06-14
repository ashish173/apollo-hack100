// teacher/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { collection, query, where, getDocs, doc, getDoc, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db as firebaseDbService } from '@/lib/firebase';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, UserRound, BookOpen, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TeacherAssignedProjectDetail from '@/components/teacher/teacher-assigned-project-detail';
import { ProjectIdea, SavedProjectTask } from './student-mentor/idea-detail'; // Import types from idea-detail
import { cn } from '@/lib/utils'; // Import cn for conditional classnames
import { ProjectReport } from '@/types'; // Import ProjectReport type
import { generateAIReview, AIReviewResult } from '@/services/aiReviewService'; // Import AI review generation
import { updateAssignedProjectAIReview } from '@/services/firestoreService'; // Import Firestore service for updating AI review
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  latestReport?: ProjectReport | null; // Add latest report for direct access
  aiReview?: AIReviewResult | null; // Add AI review directly to assigned project
}

export default function TeacherDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [assignedProjects, setAssignedProjects] = useState<AssignedProjectWithDetails[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedProject, setSelectedProject] = useState<AssignedProjectWithDetails | null>(null);
  const [projectFilter, setProjectFilter] = useState<'all' | 'off-track' | 'on-track' | 'ai-asc' | 'ai-desc' | 'review-high' | 'review-low'>('all');

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
        const assignedProjectId = assignedDoc.id;
        const projectId = assignedData.projectId;
        const studentUid = assignedData.studentUid;
        const teacherUid = assignedData.teacherUid;

        // Fetch the corresponding project details from the 'projects' collection
        const projectRef = doc(firebaseDbService, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);

        let latestReport: ProjectReport | null = null;
        // Attempt to fetch the latest project report for the student and project from 'projectReports'
        const reportsRef = collection(firebaseDbService, "projectReports");
        const reportQuery = query(
          reportsRef,
          where("projectId", "==", projectId),
          where("studentUid", "==", studentUid),
          where("teacherUid", "==", teacherUid),
          orderBy("submittedAt", "desc"),
          limit(1)
        );
        const reportSnapshot = await getDocs(reportQuery);
        if (!reportSnapshot.empty) {
          const reportData = reportSnapshot.docs[0].data();
          latestReport = { id: reportSnapshot.docs[0].id, ...reportData } as ProjectReport;
        }

        console.log("Latest Report for project", projectId, ":", latestReport);

        let currentAIReview: AIReviewResult | null | undefined = assignedData.aiReview as AIReviewResult | null | undefined;

        let shouldGenerateAIReview = false;
        const now = Timestamp.now();
        const oneWeekAgo = new Timestamp(now.seconds - (7 * 24 * 60 * 60), now.nanoseconds);

        let studentProjectStatusForAI: string | undefined = latestReport?.studentProjectStatus;
        let textStatusForAI: string | undefined = latestReport?.textStatus;

        // Determine if the report is stale (i.e., existing report but no update for a week)
        const hasStaleReport = latestReport &&
                               latestReport.submittedAt instanceof Timestamp &&
                               latestReport.submittedAt.toMillis() < oneWeekAgo.toMillis();

        if (hasStaleReport) {
          studentProjectStatusForAI = 'off-track';
          textStatusForAI = 'The student has not provided a new status update for over a week since their last report.';
        }

        // Base conditions for regeneration
        if (!currentAIReview) {
          // Case 1: No existing AI review, always generate
          shouldGenerateAIReview = true;
        } else if (latestReport && latestReport.submittedAt instanceof Timestamp && currentAIReview.timestamp instanceof Timestamp) {
          // Case 2: Existing AI review and latest report, check if report is newer than AI review
          if (latestReport.submittedAt.toMillis() > currentAIReview.timestamp.toMillis()) {
            shouldGenerateAIReview = true;
          }
        } else if (currentAIReview.timestamp instanceof Timestamp && currentAIReview.timestamp.toMillis() < oneWeekAgo.toMillis()) {
          // Case 3: AI review exists but is older than one week, force regenerate (general weekly update)
          shouldGenerateAIReview = true;
        } else if (!(currentAIReview.timestamp instanceof Timestamp)) {
          // Case 4: Existing AI review but its timestamp is not a proper Timestamp object
          // This can happen if data was inserted without serverTimestamp() for aiReview.timestamp.
          // Force regeneration to correct the timestamp.
          shouldGenerateAIReview = true;
        }

        // Additional condition for regeneration: If the determined AI inputs (based on staleness or no report)
        // are different from what the current AI review was generated with.
        // This ensures that if a report *becomes* stale, or a project without reports now needs a 0/10,
        // and the AI review hasn't been regenerated for other reasons, it gets regenerated.
        if (currentAIReview && !shouldGenerateAIReview) {
            const currentSourceTextStatus = currentAIReview.sourceTextStatus;
            const currentSourceStudentProjectStatus = currentAIReview.sourceStudentProjectStatus;

            // Check if the inputs *that would be used for generation* are different from the ones saved
            const inputsChanged = (studentProjectStatusForAI !== currentSourceStudentProjectStatus) ||
                                  (textStatusForAI !== currentSourceTextStatus);

            if (inputsChanged) {
                shouldGenerateAIReview = true;
            }
        }

        if (shouldGenerateAIReview) {
          const aiReviewGenerated: AIReviewResult = generateAIReview({
            studentProjectStatus: studentProjectStatusForAI,
            textStatus: textStatusForAI
          });
          currentAIReview = aiReviewGenerated; // Use the newly generated one for display
          console.log("Generated/Updated AI Review for project", assignedProjectId, ":", currentAIReview);

          // Attempt to save the newly generated/updated AI review to Firestore
          try {
            await updateAssignedProjectAIReview(
              assignedProjectId,
              aiReviewGenerated
            );
          } catch (error) {
            console.error("Failed to update AI review in Firestore for assigned project:", assignedProjectId, error);
          }
        }

        if (projectDoc.exists()) {
          const projectData = projectDoc.data() as ProjectIdea;
          fetchedAssignedProjects.push({
            assignedProjectId: assignedProjectId,
            projectId: projectId,
            studentUid: studentUid,
            studentName: assignedData.studentName,
            teacherUid: teacherUid,
            assignedAt: assignedData.assignedAt,
            title: projectData.title,
            description: projectData.description,
            difficulty: projectData.difficulty,
            duration: projectData.duration,
            tasks: projectData.tasks || [],
            latestReport: latestReport,
            aiReview: currentAIReview,
          });
        } else {
          console.warn(`Project document with ID ${projectId} not found.`);
        }
      }
      setAssignedProjects(fetchedAssignedProjects);
    } catch (error) {
      console.error("Error fetching assigned projects:", error);
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
  };

  const filteredProjects = useMemo(() => {
    let currentProjects = [...assignedProjects];

    // Apply Filtering
    switch (projectFilter) {
      case 'on-track':
        currentProjects = currentProjects.filter(project => project.aiReview?.studentProjectStatus === 'on-track');
        break;
      case 'off-track':
        currentProjects = currentProjects.filter(project => project.aiReview?.studentProjectStatus === 'off-track');
        break;
      case 'review-high':
        currentProjects = currentProjects.filter(project => (project.aiReview?.rating ?? -1) >= 6);
        break;
      case 'review-low':
        currentProjects = currentProjects.filter(project => (project.aiReview?.rating ?? -1) <= 5);
        break;
      case 'all':
        // No filtering needed, all projects are already included
        break;
    }

    // Apply Sorting
    switch (projectFilter) {
      case 'ai-asc':
        currentProjects.sort((a, b) => (a.aiReview?.rating ?? -1) - (b.aiReview?.rating ?? -1));
        break;
      case 'ai-desc':
        currentProjects.sort((a, b) => (b.aiReview?.rating ?? -1) - (a.aiReview?.rating ?? -1));
        break;
    }

    return currentProjects;
  }, [assignedProjects, projectFilter]);

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

      {/* AI Rating Filter */}
      <div className="w-full max-w-4xl mx-auto flex justify-end">
        <div className="flex items-center gap-2 mt-6 mb-4">
          <label htmlFor="projectFilter" className="text-md font-medium text-muted-foreground">Filter/Sort Projects:</label>
          <Select onValueChange={(value: 'all' | 'off-track' | 'on-track' | 'ai-asc' | 'ai-desc' | 'review-high' | 'review-low') => setProjectFilter(value)} value={projectFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter/Sort Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="on-track">Status: On Track</SelectItem>
              <SelectItem value="off-track">Status: Off Track</SelectItem>
              <SelectItem value="review-high">Rating: High(6-10)</SelectItem>
              <SelectItem value="review-low">Rating: Low(0-5)</SelectItem>
              <SelectItem value="ai-asc">Rating: Low to High</SelectItem>
              <SelectItem value="ai-desc">Rating: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
                {projectFilter === 'all'
                  ? "You haven't assigned any projects yet. Go to \"Student Mentor\" to assign one!"
                  : "No projects match the selected filter."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card
                key={project.assignedProjectId}
                className="shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col"
                onClick={() => handleViewDetails(project)}
              >
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="flex flex-col justify-between min-h-[150px]">
                    <CardTitle className="text-xl text-primary font-semibold line-clamp-2 flex-grow">{project.title}</CardTitle>
                    <CardDescription className="flex items-center text-sm text-muted-foreground">
                      <UserRound className="mr-1 h-4 w-4 text-muted-foreground" />
                      Assigned to: <span className="ml-1 font-medium text-foreground">{project.studentName}</span>
                    </CardDescription>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Difficulty: {project.difficulty}</Badge>
                      <Badge variant="outline">Duration: {project.duration}</Badge>
                      <Badge variant="default">Status: Assigned</Badge>
                    </div>
                  </div>
                  {project.aiReview && (
                    <div className="w-full p-3 rounded-lg bg-secondary flex flex-col items-start">
                      <Badge className={cn("text-sm px-3 py-1 mb-2 font-semibold", getAIRatingBadgeClass(project.aiReview.rating))}>
                        ✨ AI Rating: {project.aiReview.rating}/10
                      </Badge>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">
                        AI Note: {project.aiReview.note}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function for AI rating badge class - should be defined outside the component or imported
const getAIRatingBadgeClass = (rating: number): string => {
  if (rating > 5) return "bg-green-500 hover:bg-green-600 text-white animated-siri-border";
  if (rating <= 5) return "bg-red-500 hover:bg-red-600 text-white animated-siri-border";
  return "bg-gray-400 hover:bg-gray-500 text-white"; // Default for unexpected values
};