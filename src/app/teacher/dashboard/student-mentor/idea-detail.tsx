// idea-detail.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Lightbulb, 
  UserPlus, 
  ArrowLeft, 
  Trash2, 
  Plus,
  Calendar,
  Clock,
  Target,
  Sparkles,
  CheckCircle2,
  Edit3
} from 'lucide-react';
import { addDays } from 'date-fns';

// Apollo Design System Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { cn } from '@/lib/utils';
import AssignProjectDialog from '@/components/teacher/assign-project-dialog';
import { useAuth } from '@/context/auth-context';
import TaskHints, { Task } from './task-hints';

// This interface represents the *raw* data structure coming from your AI's project plan generation.
interface DisplayTask {
  TaskID: number;
  TaskName: string;
  StartDate?: string;
  EndDate?: string;
  Duration: number;
  PercentageComplete: number;
  Dependencies: string;
  Milestone: boolean;
}

// This interface represents the *specific subset* of task data you want to save in Firestore.
export interface SavedProjectTask {
  taskId: number;
  taskName: string;
  startDate: string;
  endDate: string;
  duration: number;
}

// Updated ProjectIdea interface
export interface ProjectIdea {
  id?: string;
  projectStartDate?: string;
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  icon?: React.ComponentType<{ size: number; className: string }>;
  tasks?: SavedProjectTask[];
}

// Enhanced Project Header Component
const ProjectHeader = ({ 
  idea, 
  calculatedDuration,
  onBack 
}: { 
  idea: ProjectIdea; 
  calculatedDuration: string;
  onBack: () => void;
}) => {
  const IconComponent = idea.icon || Lightbulb;
  
  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'difficult': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <Button onClick={onBack} variant="outline" className="shadow-sm">
        <ArrowLeft className="mr-2 h-4 w-4" /> 
        Back to Ideas
      </Button>
      
      <Card variant="feature" className="shadow-2xl">
        <CardHeader>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 space-y-3">
              <CardTitle size="lg" className="text-neutral-900 dark:text-neutral-100">
                {idea.title}
              </CardTitle>
              <div className="flex flex-wrap gap-3">
                <Badge variant={getDifficultyVariant(idea.difficulty)} size="default">
                  <Target className="w-3 h-3 mr-1" />
                  {idea.difficulty}
                </Badge>
                <Badge variant="outline" size="default">
                  <Clock className="w-3 h-3 mr-1" />
                  {calculatedDuration}
                </Badge>
                <Badge variant="soft-primary" size="default">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Generated
                </Badge>
              </div>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-blueberry-500 to-blueberry-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <IconComponent className="w-8 h-8 text-white" />
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};

// Enhanced Project Configuration Component
const ProjectConfiguration = ({
  projectStartDate,
  setProjectStartDate,
  editableDescription,
  setEditableDescription
}: {
  projectStartDate: Date;
  setProjectStartDate: (date: Date) => void;
  editableDescription: string;
  setEditableDescription: (desc: string) => void;
}) => (
  <Card variant="outline" className="mb-6">
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blueberry-100 dark:bg-blueberry-950 rounded-lg flex items-center justify-center">
          <Edit3 className="w-4 h-4 text-blueberry-600 dark:text-blueberry-400" />
        </div>
        <CardTitle size="default">Project Configuration</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="projectStartDate">
          <Calendar className="w-4 h-4 mr-2 inline" />
          Project Start Date
        </Label>
        <Input
          type="date"
          id="projectStartDate"
          value={projectStartDate.toISOString().split('T')[0]}
          onChange={(e) => {
            const newDate = new Date(e.target.value);
            if (!isNaN(newDate.getTime())) {
              setProjectStartDate(newDate);
            }
          }}
          className="w-full sm:w-auto"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Project Description
        </Label>
        <Textarea
          id="description"
          value={editableDescription}
          onChange={(e) => setEditableDescription(e.target.value)}
          placeholder="Enter detailed project description..."
          className="min-h-24"
          rows={Math.max(3, editableDescription.split('\n').length)} 
        />
      </div>
    </CardContent>
  </Card>
);

// Enhanced Task Table Component
const TaskTable = ({
  projectPlan,
  onTaskNameChange,
  onTaskDurationChange,
  onRemoveTask,
  onShowHints
}: {
  projectPlan: DisplayTask[];
  onTaskNameChange: (taskId: number, newName: string) => void;
  onTaskDurationChange: (taskId: number, newDuration: string) => void;
  onRemoveTask: (taskId: number) => void;
  onShowHints: (task: DisplayTask) => void;
}) => (
  <ScrollArea className="h-[400px] rounded-lg border">
    <Table>
      <TableHeader className="sticky top-0 bg-white dark:bg-neutral-900 z-10">
        <TableRow>
          <TableHead className="w-[100px]">Actions</TableHead>
          <TableHead className="w-[30%]">Task Name</TableHead>
          <TableHead className="w-[100px]">Duration (days)</TableHead>
          <TableHead className="w-[120px]">Start Date</TableHead>
          <TableHead className="w-[120px]">End Date</TableHead>
          <TableHead className="w-[100px]">Progress</TableHead>
          <TableHead className="w-[80px] text-center">Remove</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projectPlan.map((task) => (
          <TableRow 
            key={task.TaskID} 
            className={cn(
              "hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors",
              task.Milestone && "bg-blueberry-50 dark:bg-blueberry-950/20 border-l-4 border-l-blueberry-500"
            )}
          >
            <TableCell>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onShowHints(task)}
                      className="border-blueberry-200 text-blueberry-600 hover:bg-blueberry-50 dark:border-blueberry-700 dark:text-blueberry-400 dark:hover:bg-blueberry-950"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Hints
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Get AI-powered hints for this task</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableCell>
            
            <TableCell>
              <Input
                type="text"
                value={task.TaskName}
                onChange={(e) => onTaskNameChange(task.TaskID, e.target.value)}
                className="border-transparent hover:border-neutral-300 focus:border-blueberry-500 bg-transparent"
                placeholder="Enter task name..."
              />
            </TableCell>
            
            <TableCell>
              <Input
                type="number"
                value={task.Duration}
                onChange={(e) => onTaskDurationChange(task.TaskID, e.target.value)}
                className="border-transparent hover:border-neutral-300 focus:border-blueberry-500 bg-transparent text-center w-20"
                min="1"
              />
            </TableCell>
            
            <TableCell className="font-mono text-sm">
              {task.StartDate}
            </TableCell>
            
            <TableCell className="font-mono text-sm">
              {task.EndDate}
            </TableCell>
            
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="w-12 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blueberry-500 transition-all duration-300"
                    style={{ width: `${task.PercentageComplete}%` }}
                  />
                </div>
                <span className="text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                  {task.PercentageComplete}%
                </span>
              </div>
            </TableCell>
            
            <TableCell className="text-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveTask(task.TaskID)}
                      className="text-error-600 hover:text-error-700 hover:bg-error-50 dark:hover:bg-error-950"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Remove this task</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </ScrollArea>
);

export default function IdeaDetail({
  idea,
  goBack,
  handleAssign
}: {
  idea: ProjectIdea;
  goBack: () => void;
  handleAssign: () => void;
}) {
  const { user, loading: authLoading } = useAuth();
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [editableDescription, setEditableDescription] = useState(idea.description);
  const [calculatedOverallDuration, setCalculatedOverallDuration] = useState<string>(idea.duration);
  const [projectStartDateState, setProjectStartDateState] = useState<Date>(
    idea.projectStartDate ? new Date(idea.projectStartDate) : new Date()
  );

  const [projectPlan, setProjectPlan] = useState<DisplayTask[]>([]);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const todayRef = useRef(new Date());
  const FIREBASE_FUNCTION_URL = 'https://us-central1-role-auth-7bc43.cloudfunctions.net/generateProjectPlanFn';

  useEffect(() => {
    setProjectStartDateState(idea.projectStartDate ? new Date(idea.projectStartDate) : new Date(todayRef.current));
  }, [idea.projectStartDate]);

  useEffect(() => {
    todayRef.current = new Date();
  }, []);

  const fetchProjectPlan = useCallback(async () => {
    setLoadingPlan(true);
    setProjectPlan([]);
    try {
      let parsedData: DisplayTask[];

      const requestBody = { projectIdea: idea.description };
      const response = await fetch(FIREBASE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      const data = await response.json();
      const rawResponseText = data.response;

      try {
        parsedData = JSON.parse(rawResponseText.projectPlan);
      } catch (jsonError: any) {
        console.error("Failed to parse project plan JSON:", jsonError);
        setProjectPlan([]);
        setLoadingPlan(false);
        return;
      }

      let currentDate = new Date(projectStartDateState);

      const tasksForDisplay: DisplayTask[] = parsedData.map((item) => {
        let durationInDays = 1;

        if (typeof (item.Duration as any) === 'string') {
          const durationStr = (item.Duration as any).toLowerCase();
          const weekMatch = durationStr.match(/(\d+)\s*week(s)?/);
          const dayMatch = durationStr.match(/(\d+)\s*day(s)?/);

          if (weekMatch && weekMatch[1]) {
            durationInDays = parseInt(weekMatch[1], 10) * 7;
          } else if (dayMatch && dayMatch[1]) {
            durationInDays = parseInt(dayMatch[1], 10);
          } else {
            const genericMatch = durationStr.match(/(\d+)/);
            if (genericMatch && genericMatch[1]) {
              durationInDays = parseInt(genericMatch[1], 10);
            }
          }
        } else if (typeof item.Duration === 'number') {
          durationInDays = item.Duration;
        }

        const validDuration = Math.max(1, Math.floor(isNaN(durationInDays) ? 1 : durationInDays));

        const itemStartDate = new Date(currentDate);
        const itemEndDate = addDays(itemStartDate, validDuration - 1);

        currentDate = addDays(itemEndDate, 1);

        return {
          ...item,
          StartDate: itemStartDate.toISOString().slice(0, 10),
          EndDate: itemEndDate.toISOString().slice(0, 10),
          Duration: validDuration,
        };
      });

      setProjectPlan(tasksForDisplay);
    } catch (error: any) {
      console.error("Error during project plan generation:", error);
      setProjectPlan([]);
    } finally {
      setLoadingPlan(false);
    }
  }, [idea.description]);

  const IconComponent = idea.icon || Lightbulb;

  useEffect(() => {
    if (idea) {
      fetchProjectPlan(); 
      setEditableDescription(idea.description);
    }
  }, [fetchProjectPlan, idea]);

  const handleTaskNameChange = (taskId: number, newName: string) => {
    setProjectPlan(prevPlan =>
      prevPlan.map(task =>
        task.TaskID === taskId ? { ...task, TaskName: newName } : task
      )
    );
  };

  const recalculateTaskDates = (tasks: DisplayTask[], projectStartDate: Date): DisplayTask[] => {
    let currentDate = new Date(projectStartDate);
    return tasks.map(task => {
      const duration = Math.max(1, Number(task.Duration));
      const startDate = new Date(currentDate);
      const endDate = addDays(startDate, duration - 1);

      currentDate = addDays(endDate, 1);

      return {
        ...task,
        StartDate: startDate.toISOString().slice(0, 10),
        EndDate: endDate.toISOString().slice(0, 10),
        Duration: duration,
      };
    });
  };

  const handleTaskDurationChange = (taskId: number, newDurationStr: string) => {
    const newDuration = parseInt(newDurationStr, 10);
    if (isNaN(newDuration) || newDuration < 1) {
      return; 
    }

    const updatedOncePlan = projectPlan.map(task =>
      task.TaskID === taskId ? { ...task, Duration: newDuration } : task
    );

    const recalculatedPlan = recalculateTaskDates(updatedOncePlan, new Date(projectStartDateState));
    setProjectPlan(recalculatedPlan);
  };

  const handleAddTask = () => {
    const newTask: DisplayTask = {
      TaskID: Math.max(0, ...projectPlan.map(t => t.TaskID)) + 1,
      TaskName: "New Task - Edit Me",
      Duration: 1,
      StartDate: "",
      EndDate: "",
      PercentageComplete: 0,
      Dependencies: "",
      Milestone: false,
    };
    const updatedPlan = [...projectPlan, newTask];
    const recalculatedPlan = recalculateTaskDates(updatedPlan, new Date(projectStartDateState));
    setProjectPlan(recalculatedPlan);
  };

  const handleRemoveTask = (taskIdToRemove: number) => {
    const updatedPlan = projectPlan.filter(task => task.TaskID !== taskIdToRemove);
    const recalculatedPlan = recalculateTaskDates(updatedPlan, new Date(projectStartDateState));
    setProjectPlan(recalculatedPlan);
  };

  useEffect(() => {
    if (projectPlan.length > 0) {
      const recalculatedPlan = recalculateTaskDates([...projectPlan], new Date(projectStartDateState));
      setProjectPlan(recalculatedPlan);
    }
  }, [projectStartDateState]);

  useEffect(() => {
    if (projectPlan && projectPlan.length > 0) {
      const totalDays = projectPlan.reduce((sum, task) => sum + Math.max(1, task.Duration), 0);
      setCalculatedOverallDuration(`${totalDays} day${totalDays !== 1 ? 's' : ''}`);
    } else {
      setCalculatedOverallDuration("0 days");
    }
  }, [projectPlan]);

  const tasksForFirestore: SavedProjectTask[] = projectPlan.map(task => ({
    taskId: task.TaskID,
    taskName: task.TaskName,
    startDate: task.StartDate || '',
    endDate: task.EndDate || '',
    duration: Math.max(1, Math.floor(task.Duration)),
  }));

  const projectIdeaWithTasks: ProjectIdea = {
    ...idea,
    description: editableDescription,
    duration: calculatedOverallDuration,
    projectStartDate: projectStartDateState.toISOString().slice(0,10), 
    tasks: tasksForFirestore,
  };

  // Loading State
  const PlanLoadingState = () => (
    <Card variant="ghost" className="text-center py-12">
      <CardContent>
        <LoadingSpinner 
          size="lg" 
          variant="default" 
          showLabel={true}
          label="Generating Project Plan"
          description="Our AI is creating a detailed timeline for this project..."
        />
      </CardContent>
    </Card>
  );

  // Empty Plan State
  const EmptyPlanState = () => (
    <Card variant="ghost" className="text-center py-12">
      <CardContent>
        <div className="mx-auto mb-6 w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center">
          <Calendar className="w-8 h-8 text-neutral-400" />
        </div>
        <CardTitle size="default" className="mb-2">
          No project plan generated yet
        </CardTitle>
        <p className="body-text text-neutral-600 dark:text-neutral-400 mb-6">
          Click "Add New Task" below to start building your project timeline manually.
        </p>
      </CardContent>
    </Card>
  );

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-6xl mx-auto">
        <ProjectHeader 
          idea={idea}
          calculatedDuration={calculatedOverallDuration}
          onBack={goBack}
        />

        <ProjectConfiguration
          projectStartDate={projectStartDateState}
          setProjectStartDate={setProjectStartDateState}
          editableDescription={editableDescription}
          setEditableDescription={setEditableDescription}
        />

        {/* Project Plan Section */}
        <Card variant="elevated" className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blueberry-100 dark:bg-blueberry-950 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blueberry-600 dark:text-blueberry-400" />
                </div>
                <div>
                  <CardTitle size="default">Project Timeline</CardTitle>
                  <p className="body-text text-neutral-600 dark:text-neutral-400">
                    AI-generated task breakdown with customizable timeline
                  </p>
                </div>
              </div>
              {projectPlan.length > 0 && (
                <Badge variant="soft-primary" size="lg">
                  {projectPlan.length} Tasks
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {loadingPlan ? (
              <PlanLoadingState />
            ) : projectPlan && projectPlan.length > 0 ? (
              <TaskTable
                projectPlan={projectPlan}
                onTaskNameChange={handleTaskNameChange}
                onTaskDurationChange={handleTaskDurationChange}
                onRemoveTask={handleRemoveTask}
                onShowHints={(task) => setSelectedTask(task)}
              />
            ) : (
              <EmptyPlanState />
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleAddTask}
                className="shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Task
              </Button>
              
              {projectPlan.length > 0 && (
                <Button
                  variant="default"
                  onClick={() => setIsAssignDialogOpen(true)}
                  disabled={loadingPlan}
                  className="shadow-button"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign to Student
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assignment Dialog */}
        {projectIdeaWithTasks && user && (
          <AssignProjectDialog
            project={projectIdeaWithTasks}
            isOpen={isAssignDialogOpen}
            onOpenChange={setIsAssignDialogOpen}
            teacherId={user.uid}
          />
        )}

        {/* Task Hints Dialog */}
        {selectedTask && (
          <TaskHints
            task={selectedTask.TaskName}
            idea={editableDescription}
            onClose={() => setSelectedTask(null)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
