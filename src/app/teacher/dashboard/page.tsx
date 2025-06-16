// teacher/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { collection, query, where, getDocs, doc, getDoc, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db as firebaseDbService } from '@/lib/firebase';
import { 
  BookOpen, 
  UserRound, 
  Lightbulb, 
  TrendingUp,
  TrendingDown,
  Clock,
  Star,
  Filter,
  BarChart3,
  Users,
  CheckCircle,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

// Apollo Design System Components
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import TeacherAssignedProjectDetail from '@/components/teacher/teacher-assigned-project-detail';
import { ProjectIdea, SavedProjectTask } from './student-mentor/idea-detail';
import { cn } from '@/lib/utils';
import { ProjectReport } from '@/types';
import { generateAIReview, AIReviewResult } from '@/services/aiReviewService';
import { updateAssignedProjectAIReview } from '@/services/firestoreService';

// Define an interface that combines data from 'assignedProjects' and 'projects' collections
interface AssignedProjectWithDetails {
  assignedProjectId: string;
  projectId: string;
  studentUid: string;
  studentName: string;
  teacherUid: string;
  assignedAt: Timestamp;
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  tasks?: SavedProjectTask[];
  latestReport?: ProjectReport | null;
  aiReview?: AIReviewResult | null;
}

// Enhanced Dashboard Header Component
const DashboardHeader = ({ 
  totalProjects, 
  onTrackCount, 
  offTrackCount 
}: { 
  totalProjects: number;
  onTrackCount: number;
  offTrackCount: number;
}) => (
  <Card variant="gradient" className="mb-8">
    <CardHeader className="text-center pb-6">
      <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blueberry-500 to-blueberry-600 rounded-2xl flex items-center justify-center shadow-lg">
        <BookOpen className="w-8 h-8 text-white" />
      </div>
      <CardTitle size="lg" gradient className="mb-2">
        My Assigned Projects
      </CardTitle>
      <p className="body-text text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
        Monitor student progress, review AI insights, and provide guidance for optimal learning outcomes
      </p>
    </CardHeader>
    
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blueberry-100 dark:bg-blueberry-950 rounded-xl flex items-center justify-center mx-auto">
            <BarChart3 className="w-6 h-6 text-blueberry-600 dark:text-blueberry-400" />
          </div>
          <div>
            <p className="heading-2 text-neutral-900 dark:text-neutral-100">{totalProjects}</p>
            <p className="body-text text-neutral-600 dark:text-neutral-400">Total Projects</p>
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-success-100 dark:bg-success-950 rounded-xl flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
          </div>
          <div>
            <p className="heading-2 text-success-600 dark:text-success-400">{onTrackCount}</p>
            <p className="body-text text-neutral-600 dark:text-neutral-400">On Track</p>
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-error-100 dark:bg-error-950 rounded-xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-error-600 dark:text-error-400" />
          </div>
          <div>
            <p className="heading-2 text-error-600 dark:text-error-400">{offTrackCount}</p>
            <p className="body-text text-neutral-600 dark:text-neutral-400">Need Attention</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Enhanced Filter Component
const ProjectFilter = ({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void;
}) => (
  <Card variant="outlined" className="mb-6">
    <CardContent className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blueberry-600 dark:text-blueberry-400" />
          <span className="subtitle text-neutral-700 dark:text-neutral-300">Filter & Sort Projects</span>
        </div>
        
        <Select onValueChange={onChange} value={value}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select filter option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            <Separator />
            <SelectItem value="on-track">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success-600" />
                Status: On Track
              </div>
            </SelectItem>
            <SelectItem value="off-track">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-error-600" />
                Status: Off Track
              </div>
            </SelectItem>
            <Separator />
            <SelectItem value="review-high">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success-600" />
                Rating: High (6-10)
              </div>
            </SelectItem>
            <SelectItem value="review-low">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-error-600" />
                Rating: Low (0-5)
              </div>
            </SelectItem>
            <Separator />
            <SelectItem value="ai-asc">Rating: Low to High</SelectItem>
            <SelectItem value="ai-desc">Rating: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardContent>
  </Card>
);

// Enhanced Project Card Component
const ProjectCard = ({ 
  project, 
  onClick 
}: { 
  project: AssignedProjectWithDetails; 
  onClick: () => void;
}) => {
  const getStatusVariant = (status?: string) => {
    switch (status) {
      case 'on-track': return 'success';
      case 'off-track': return 'destructive';
      default: return 'secondary';
    }
  };

  const getRatingVariant = (rating: number) => {
    if (rating >= 8) return 'success';
    if (rating >= 6) return 'default';
    if (rating >= 4) return 'warning';
    return 'destructive';
  };

  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Card 
      variant="interactive"
      className="group cursor-pointer h-full flex flex-col hover:shadow-2xl transition-all duration-300"
      onClick={onClick}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <CardTitle className="heading-3 text-neutral-900 dark:text-neutral-100 line-clamp-2 group-hover:text-blueberry-600 dark:group-hover:text-blueberry-400 transition-colors">
            {project.title}
          </CardTitle>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="w-4 h-4 text-warning-500" />
            <span className="body-text text-neutral-600 dark:text-neutral-400">
              {project.aiReview?.rating || 'N/A'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <UserRound className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
          <span className="body-text text-neutral-700 dark:text-neutral-300">
            {project.studentName}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant={getDifficultyVariant(project.difficulty)} size="sm">
            {project.difficulty}
          </Badge>
          <Badge variant="outline" size="sm">
            <Clock className="w-3 h-3 mr-1" />
            {project.duration}
          </Badge>
          {project.aiReview?.studentProjectStatus && (
            <Badge variant={getStatusVariant(project.aiReview.studentProjectStatus)} size="sm">
              {project.aiReview.studentProjectStatus === 'on-track' ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : (
                <AlertTriangle className="w-3 h-3 mr-1" />
              )}
              {project.aiReview.studentProjectStatus.replace('-', ' ')}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 flex-1 flex flex-col">
        <p className="body-text text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-4 flex-1">
          {project.description}
        </p>
        
        {project.aiReview && (
          <Card variant="feature" size="sm" className="mt-auto">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blueberry-500 to-blueberry-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="subtitle text-blueberry-900 dark:text-blueberry-100">
                      AI Insights
                    </span>
                    <Badge variant={getRatingVariant(project.aiReview.rating)} size="sm">
                      {project.aiReview.rating}/10
                    </Badge>
                  </div>
                  <p className="body-text text-blueberry-800 dark:text-blueberry-200 text-sm line-clamp-2">
                    {project.aiReview.note}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

// Empty State Component
const EmptyState = ({ hasFilter }: { hasFilter: boolean }) => (
  <Card variant="ghost" className="text-center py-12">
    <CardContent>
      <div className="mx-auto mb-6 w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center">
        <BookOpen className="w-10 h-10 text-neutral-400" />
      </div>
      <CardTitle size="default" className="mb-2">
        {hasFilter ? 'No projects match your filter' : 'No projects assigned yet'}
      </CardTitle>
      <p className="body-text text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
        {hasFilter 
          ? 'Try adjusting your filter settings to see more projects.'
          : 'Start by visiting the Student Mentor section to assign your first project to a student.'
        }
      </p>
      {!hasFilter && (
        <Button variant="default" className="shadow-button">
          <Users className="w-4 h-4 mr-2" />
          Go to Student Mentor
        </Button>
      )}
    </CardContent>
  </Card>
);

// Loading State Component
const LoadingState = () => (
  <div className="flex justify-center items-center py-20">
    <LoadingSpinner 
      size="xl" 
      variant="primary" 
      showLabel={true}
      label="Loading Projects"
      description="Fetching your assigned projects and AI insights..."
    />
  </div>
);

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

  // Calculate statistics
  const totalProjects = assignedProjects.length;
  const onTrackCount = assignedProjects.filter(p => p.aiReview?.studentProjectStatus === 'on-track').length;
  const offTrackCount = assignedProjects.filter(p => p.aiReview?.studentProjectStatus === 'off-track').length;

  if (authLoading) {
    return <LoadingState />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card variant="feature" className="text-center max-w-md">
          <CardContent className="p-8">
            <p className="body-text text-neutral-600 dark:text-neutral-400">
              Please sign in to view your dashboard.
            </p>
          </CardContent>
        </Card>
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <DashboardHeader 
        totalProjects={totalProjects}
        onTrackCount={onTrackCount}
        offTrackCount={offTrackCount}
      />

      <ProjectFilter 
        value={projectFilter}
        onChange={(value) => setProjectFilter(value as any)}
      />

      {loadingProjects ? (
        <LoadingState />
      ) : assignedProjects.length === 0 ? (
        <EmptyState hasFilter={false} />
      ) : filteredProjects.length === 0 ? (
        <EmptyState hasFilter={true} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.assignedProjectId}
              project={project}
              onClick={() => handleViewDetails(project)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
