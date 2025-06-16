// assign-project-dialog.tsx
"use client";

import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db as firebaseDbService } from '@/lib/firebase';
import type { ProjectIdea, SavedProjectTask } from '@/app/teacher/dashboard/student-mentor/idea-detail';
import type { UserProfile } from '@/types';
import { format as formatDate } from 'date-fns';
import { 
  UserCheck, 
  Calendar, 
  Clock, 
  Target, 
  Users, 
  CheckCircle2,
  AlertCircle,
  Search,
  User
} from 'lucide-react';

// Apollo Design System Components
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { calculateTaskDates } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssignProjectDialogProps {
  project: ProjectIdea | null;
  isOpen: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  teacherId: string;
}

// Enhanced Project Summary Component
const ProjectSummary = ({ project }: { project: ProjectIdea }) => {
  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'difficult': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Card variant="feature" size="sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blueberry-100 dark:bg-blueberry-950 rounded-lg flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-blueberry-600 dark:text-blueberry-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="subtitle text-blueberry-900 dark:text-blueberry-100 mb-2">
              {project.title}
            </h4>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant={getDifficultyVariant(project.difficulty)} size="sm">
                {project.difficulty}
              </Badge>
              <Badge variant="outline" size="sm">
                <Clock className="w-3 h-3 mr-1" />
                {project.duration}
              </Badge>
              {project.tasks && (
                <Badge variant="soft-primary" size="sm">
                  {project.tasks.length} tasks
                </Badge>
              )}
            </div>
            <p className="body-text text-blueberry-800 dark:text-blueberry-200 text-sm line-clamp-2">
              {project.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Student Selection Component
const StudentSelector = ({
  students,
  selectedStudentUid,
  setSelectedStudentUid,
  isLoading,
  isAssigning
}: {
  students: UserProfile[];
  selectedStudentUid: string | undefined;
  setSelectedStudentUid: (uid: string | undefined) => void;
  isLoading: boolean;
  isAssigning: boolean;
}) => {
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

  const selectedStudent = students.find(student => student.uid === selectedStudentUid);
  const selectedStudentDisplayValue = selectedStudent?.displayName || selectedStudent?.email || "Select student...";

  if (isLoading) {
    return (
      <Card variant="outline" className="p-4">
        <div className="flex items-center gap-3">
          <LoadingSpinner size="sm" variant="primary" />
          <span className="body-text text-neutral-600 dark:text-neutral-400">
            Loading students...
          </span>
        </div>
      </Card>
    );
  }

  if (students.length === 0) {
    return (
      <Card variant="outline" className="p-4 border-warning-200 bg-warning-50 dark:border-warning-700 dark:bg-warning-950">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-warning-600 dark:text-warning-400" />
          <span className="body-text text-warning-700 dark:text-warning-300">
            No students found in the system
          </span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isComboboxOpen}
            className="w-full justify-between h-12 text-left"
            disabled={isAssigning}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center flex-shrink-0">
                {selectedStudent ? (
                  <CheckCircle2 className="w-4 h-4 text-success-600" />
                ) : (
                  <User className="w-4 h-4 text-neutral-500" />
                )}
              </div>
              <span className={cn(
                "truncate",
                selectedStudentUid ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-500 dark:text-neutral-400"
              )}>
                {selectedStudentDisplayValue}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput 
              placeholder="Search students..." 
              leftIcon={<Search className="w-4 h-4" />}
            />
            <CommandList>
              <CommandEmpty>
                <div className="text-center py-6">
                  <Users className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  <p className="body-text text-neutral-600 dark:text-neutral-400">
                    No students found
                  </p>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {students.map((student) => (
                  <CommandItem
                    key={student.uid}
                    value={student.displayName || student.email || student.uid}
                    onSelect={() => {
                      setSelectedStudentUid(student.uid === selectedStudentUid ? undefined : student.uid);
                      setIsComboboxOpen(false);
                    }}
                    className="flex items-center gap-3 p-3"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 text-success-600",
                        selectedStudentUid === student.uid ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="w-8 h-8 bg-success-100 dark:bg-success-950 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-success-700 dark:text-success-300">
                        {(student.displayName || student.email || 'S').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="subtitle text-neutral-900 dark:text-neutral-100 truncate">
                        {student.displayName || 'Student'}
                      </p>
                      <p className="body-text text-neutral-600 dark:text-neutral-400 text-sm truncate">
                        {student.email}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedStudent && (
        <Card variant="outline" className="p-3 bg-success-50 dark:bg-success-950 border-success-200 dark:border-success-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold">
                {(selectedStudent.displayName || selectedStudent.email || 'S').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="subtitle text-success-900 dark:text-success-100">
                {selectedStudent.displayName || 'Student'}
              </p>
              <p className="body-text text-success-700 dark:text-success-300 text-sm">
                {selectedStudent.email}
              </p>
            </div>
            <Badge variant="success" size="sm">
              Selected
            </Badge>
          </div>
        </Card>
      )}
    </div>
  );
};

export default function AssignProjectDialog({ 
  project, 
  isOpen, 
  onOpenChange, 
  teacherId 
}: AssignProjectDialogProps) {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [selectedStudentUid, setSelectedStudentUid] = useState<string | undefined>(undefined);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();

  // State for project start date
  const [projectStartDate, setProjectStartDate] = useState<string>(''); 
  // State for tasks with recalculated dates
  const [processedTasks, setProcessedTasks] = useState<SavedProjectTask[]>([]);

  useEffect(() => {
    if (isOpen && project) {
      // Initialize projectStartDate state from prop when dialog opens or project changes
      setProjectStartDate(project.projectStartDate ? project.projectStartDate : formatDate(new Date(), 'yyyy-MM-dd'));
    }
  }, [isOpen, project]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!isOpen || !firebaseDbService) return;
      setIsLoadingStudents(true);
      try {
        const usersRef = collection(firebaseDbService, 'users');
        const q = query(usersRef, where('role', '==', 'student'));
        const querySnapshot = await getDocs(q);
        const studentList: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
          studentList.push({ uid: doc.id, ...doc.data() } as UserProfile);
        });
        setStudents(studentList);
      } catch (error) {
        console.error("Error fetching students:", error);
        toast({
          title: "Error Fetching Students",
          description: "Could not load the list of students. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingStudents(false);
      }
    };

    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen, toast]);

  // Effect to recalculate task dates when project or projectStartDate changes
  useEffect(() => {
    if (project && project.tasks && projectStartDate) {
      const processed = calculateTaskDates(project.tasks, projectStartDate);
      setProcessedTasks(processed);
    } else if (project && project.tasks) {
      setProcessedTasks(project.tasks.map(task => ({
        ...task,
        duration: typeof task.duration === 'number' && task.duration > 0 ? task.duration : 1,
      })));
    } else {
      setProcessedTasks([]);
    }
  }, [project, projectStartDate]);

  const handleAssignProject = async () => {
    if (!project || !selectedStudentUid || !firebaseDbService) {
      toast({
        title: "Assignment Error",
        description: "Project or student not selected, or database service unavailable.",
        variant: "destructive",
      });
      return;
    }

    const selectedStudent = students.find(s => s.uid === selectedStudentUid);
    if (!selectedStudent) {
      toast({ 
        title: "Student not found", 
        description: "Selected student details could not be found.", 
        variant: "destructive" 
      });
      return;
    }

    setIsAssigning(true);
    try {
      // Step 1: Create a new project document in 'projects' collection with an auto-generated ID
      const projectDataForDatabase = {
        title: project.title,
        description: project.description,
        difficulty: project.difficulty,
        duration: project.duration,
        projectStartDate: projectStartDate,
        tasks: processedTasks,
        createdAt: serverTimestamp(),
      };
      
      const newProjectRef = await addDoc(collection(firebaseDbService, 'projects'), projectDataForDatabase);
      const newProjectId = newProjectRef.id;

      // Step 2: Create assignment in 'assignedProjects' collection
      const assignmentData = {
        projectId: newProjectId,
        studentUid: selectedStudentUid,
        studentName: selectedStudent.displayName || selectedStudent.email || 'N/A',
        teacherUid: teacherId,
        assignedAt: serverTimestamp(),
        status: 'assigned',
      };

      await addDoc(collection(firebaseDbService, 'assignedProjects'), assignmentData);
      
      toast({
        title: "Project Assigned Successfully!",
        description: `${project.title} has been assigned to ${selectedStudent.displayName || selectedStudent.email}.`,
      });
      
      onOpenChange(false);
      setSelectedStudentUid(undefined);
    } catch (error) {
      console.error("Error assigning project:", error);
      toast({
        title: "Assignment Failed",
        description: "Could not assign the project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  if (!project) return null;

  return (
    <TooltipProvider>
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          onOpenChange(open);
          if (!open) {
            setSelectedStudentUid(undefined);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blueberry-500 to-blueberry-600 rounded-xl flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="heading-3 text-neutral-900 dark:text-neutral-100">
                  Assign Project to Student
                </DialogTitle>
                <DialogDescription className="body-text text-neutral-600 dark:text-neutral-400">
                  Configure project details and select a student to begin their learning journey
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Project Summary */}
            <div className="space-y-3">
              <Label className="subtitle text-neutral-700 dark:text-neutral-300">
                Project Overview
              </Label>
              <ProjectSummary project={project} />
            </div>

            <Separator />

            {/* Project Start Date */}
            <div className="space-y-3">
              <Label htmlFor="project-start-date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blueberry-600 dark:text-blueberry-400" />
                Project Start Date
              </Label>
              <Input
                type="date"
                id="project-start-date"
                value={projectStartDate}
                onChange={(e) => setProjectStartDate(e.target.value)}
                disabled={isAssigning}
                description="Task dates will be automatically calculated based on this start date"
              />
            </div>

            <Separator />

            {/* Student Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blueberry-600 dark:text-blueberry-400" />
                Select Student
              </Label>
              <StudentSelector
                students={students}
                selectedStudentUid={selectedStudentUid}
                setSelectedStudentUid={setSelectedStudentUid}
                isLoading={isLoadingStudents}
                isAssigning={isAssigning}
              />
            </div>

            {/* Task Preview */}
            {processedTasks.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blueberry-600 dark:text-blueberry-400" />
                    Task Timeline Preview
                  </Label>
                  <Card variant="outline">
                    <CardContent className="p-4">
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {processedTasks.slice(0, 3).map((task, index) => (
                          <div key={task.taskId} className="flex items-center justify-between text-sm">
                            <span className="body-text text-neutral-700 dark:text-neutral-300 truncate">
                              {task.taskName}
                            </span>
                            <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                              <span className="font-mono">{task.startDate}</span>
                              <span>→</span>
                              <span className="font-mono">{task.endDate}</span>
                            </div>
                          </div>
                        ))}
                        {processedTasks.length > 3 && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center py-2">
                            + {processedTasks.length - 3} more tasks
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex items-center gap-3 pt-6">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  onClick={handleAssignProject}
                  disabled={!selectedStudentUid || isAssigning || isLoadingStudents || students.length === 0}
                  loading={isAssigning}
                  loadingText="Assigning..."
                  className="shadow-button"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Assign Project
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Assign this project to the selected student and create their personalized timeline</p>
              </TooltipContent>
            </Tooltip>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
