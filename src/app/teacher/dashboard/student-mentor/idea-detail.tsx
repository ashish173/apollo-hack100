// idea-detail.tsx
"use client";

import { useState, useEffect, useCallback, useRef, memo } from 'react'; // Added memo
import { Lightbulb, UserPlus, ArrowLeft, Trash2 } from 'lucide-react'; // Added Trash2
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { generateProjectPlan } from '@/ai/flows/generate-project-plan';
import { addDays } from 'date-fns';
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
import LoadingSpinner from '@/components/ui/loading-spinner';
import AssignProjectDialog from '@/components/teacher/assign-project-dialog';
import { useAuth } from '@/context/auth-context';
import TaskHints from './task-hints';

const FIREBASE_FUNCTION_URL_HINTS = 'https://us-central1-role-auth-7bc43.cloudfunctions.net/suggestTaskHintsFn';

// This interface represents the *raw* data structure coming from your AI's project plan generation.
// This is what will be stored in `projectPlan` state for *display* in IdeaDetail.
interface DisplayTask {
  TaskID: number;
  TaskName: string;
  StartDate?: string;
  EndDate?: string;
  Duration: number; // This field will store the duration in days
  PercentageComplete: number;
  Dependencies: string;
  Milestone: boolean;
  hints?: string[]; // Add this line to store the generated hints
}

// This interface represents the *specific subset* of task data you want to save in Firestore,
// using camelCase for consistency.
export interface SavedProjectTask { // Exported for use in assign-project-dialog.tsx
  taskId: number;
  taskName: string;
  startDate: string;
  endDate: string;
  duration: number; // Represent duration in days
  hints?: string[]; // Add this line to store the generated hints
}

// Updated ProjectIdea interface:
// It has `id`, `title`, `description`, `difficulty`, `duration`, `icon`
// And now, its `tasks` array will conform to the `SavedProjectTask` structure for saving.
export interface ProjectIdea { // Exported for use in page.tsx
  id?: string;
  projectStartDate?: string; // Optional: ISO format (YYYY-MM-DD)
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  icon?: React.ComponentType<{ size: number; className: string }>;
  tasks?: SavedProjectTask[]; // This type is for the *saved* version of tasks
}


export default memo(function IdeaDetail(
  {
    idea,
    goBack,
    handleAssign
  }: {
    idea: ProjectIdea,
    goBack: () => void,
    handleAssign: () => void
  }) {
  const { user, loading: authLoading } = useAuth();
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [editableDescription, setEditableDescription] = useState(idea.description);
  const [calculatedOverallDuration, setCalculatedOverallDuration] = useState<string>(idea.duration);
  const [projectStartDateState, setProjectStartDateState] = useState<Date>(
    idea.projectStartDate ? new Date(idea.projectStartDate) : new Date() // Initialize with idea.projectStartDate or today
  );

  // projectPlan now holds the *full* AI-generated tasks for *display* in the table
  const [projectPlan, setProjectPlan] = useState<DisplayTask[]>([]); // Use DisplayTask[] here
  const [loadingPlan, setLoadingPlan] = useState(false);

  const [selectedTask, setSelectedTask] = useState<DisplayTask | null>(null);

  const [today, setToday] = useState(new Date()); // today can remain for other non-plan specific uses if any

  const FIREBASE_FUNCTION_URL = 'https://us-central1-role-auth-7bc43.cloudfunctions.net/generateProjectPlanFn';

  // Helper function for retrying fetches
  const retryFetch = async (url: string, options: RequestInit, retries: number = 5, delay: number = 1000, timeout: number = 20000) => {
    for (let i = 0; i < retries; i++) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error: any) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
          console.warn(`Fetch attempt ${i + 1} for ${url} timed out after ${timeout / 1000} seconds.`);
        } else {
          console.error(`Fetch attempt ${i + 1} failed for ${url}:`, error);
        }
        if (i < retries - 1) {
          await new Promise(res => setTimeout(res, delay));
        }
      }
    }
    throw new Error(`Failed to fetch ${url} after ${retries} attempts.`);
  };

  useEffect(() => {
    // Initialize or update projectStartDateState if idea.projectStartDate changes
    setProjectStartDateState(idea.projectStartDate ? new Date(idea.projectStartDate) : new Date(todayRef.current));
  }, [idea.projectStartDate]);
  
  // Keep 'today' date reference stable unless component remounts, to avoid unnecessary recalculations if 'today' was used directly in other effects.
  const todayRef = useRef(new Date());
  useEffect(() => {
    todayRef.current = new Date(); // Update if needed, but today state itself is removed to avoid conflicts
  }, []);


  const fetchProjectPlan = useCallback(async () => {
    setLoadingPlan(true);
    setProjectPlan([]); // Clear previous plan and show loader
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
        setProjectPlan([]); setLoadingPlan(false); return;
      }

      // Use projectStartDateState for initial calculation
      let currentDate = new Date(projectStartDateState);

      // Map tasks and generate hints for each
      const tasksForDisplayPromises = parsedData.map(async (item) => {
        let durationInDays = 1; // Default duration

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

        // Update currentDate for the next task
        currentDate = addDays(itemEndDate, 1);

        return {
          ...item,
          StartDate: itemStartDate.toISOString().slice(0, 10),
          EndDate: itemEndDate.toISOString().slice(0, 10),
          Duration: validDuration,
          hints: ["Generating hints..."], // Initialize hints with a loading placeholder
        };
      });

      const initialTasksForDisplay = await Promise.all(tasksForDisplayPromises);
      setProjectPlan(initialTasksForDisplay);
      setLoadingPlan(false); // Set loadingPlan to false here to display tasks immediately

      const BATCH_SIZE = 5; // Define your batch size

      // Function to process tasks in batches
      const processTasksInBatches = async (tasks: DisplayTask[]) => {
        for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
          const batch = tasks.slice(i, i + BATCH_SIZE);
          await Promise.all(batch.map(async (taskToUpdate) => {
            let hints: string[] = [];
            try {
              const hintRequestBody = {
                taskDescription: taskToUpdate.TaskName,
                projectGoal: idea.description,
                relevantMilestones: "",
              };

              const hintData = await retryFetch(
                FIREBASE_FUNCTION_URL_HINTS,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(hintRequestBody),
                },
                5, // Max 5 retries
                2000, // 2-second delay between retries
                20000 // 20-second timeout for each attempt
              );
              hints = hintData?.response?.hints || [];
            } catch (hintError) {
              console.error("Error generating hints for task:", taskToUpdate.TaskName, hintError);
              hints = ["Failed to load hints."];
            }

            setProjectPlan(prevPlan =>
              prevPlan.map(pTask =>
                pTask.TaskID === taskToUpdate.TaskID ? { ...pTask, hints: hints } : pTask
              )
            );
          }));
        }
      };

      // Call the batch processing function
      processTasksInBatches(initialTasksForDisplay);

    } catch (error: any) {
      console.error("Error during project plan generation:", error);
      setProjectPlan([]);
      setLoadingPlan(false); // Ensure loading state is false even on error
    }
  }, [idea.description, idea.title]);

  const IconComponent = idea.icon || Lightbulb;

  useEffect(() => {
    if (idea) {
      fetchProjectPlan();
      setEditableDescription(idea.description);
    }
  }, [idea.description, idea.title]);

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
      const duration = Math.max(1, Number(task.Duration)); // Ensure duration is at least 1
      const startDate = new Date(currentDate);
      const endDate = addDays(startDate, duration - 1);

      currentDate = addDays(endDate, 1); // Next task starts day after current one ends

      return {
        ...task,
        StartDate: startDate.toISOString().slice(0, 10),
        EndDate: endDate.toISOString().slice(0, 10),
        Duration: duration, // Ensure duration is stored as number
      };
    });
  };

  const handleTaskDurationChange = (taskId: number, newDurationStr: string) => {
    const newDuration = parseInt(newDurationStr, 10);
    if (isNaN(newDuration) || newDuration < 1) {
      // Optionally, provide feedback to the user about invalid duration
      // For now, just don't update if invalid or less than 1
      // Or, clamp it to 1: const validNewDuration = Math.max(1, newDuration);
      return; 
    }

    const updatedOncePlan = projectPlan.map(task =>
      task.TaskID === taskId ? { ...task, Duration: newDuration } : task
    );

    // Use projectStartDateState for recalculation
    const recalculatedPlan = recalculateTaskDates(updatedOncePlan, new Date(projectStartDateState));
    setProjectPlan(recalculatedPlan);
  };

  const handleAddTask = () => {
    const newTask: DisplayTask = {
      TaskID: Math.max(0, ...projectPlan.map(t => t.TaskID)) + 1,
      TaskName: "New Task - Edit Me",
      Duration: 1,
      StartDate: "", EndDate: "", // Will be set by recalculateTaskDates
      PercentageComplete: 0, Dependencies: "", Milestone: false,
    };
    const updatedPlan = [...projectPlan, newTask];
    // Use projectStartDateState for recalculation
    const recalculatedPlan = recalculateTaskDates(updatedPlan, new Date(projectStartDateState));
    setProjectPlan(recalculatedPlan);
  };

  const handleRemoveTask = (taskIdToRemove: number) => {
    const updatedPlan = projectPlan.filter(task => task.TaskID !== taskIdToRemove);
    // Use projectStartDateState for recalculation
    const recalculatedPlan = recalculateTaskDates(updatedPlan, new Date(projectStartDateState));
    setProjectPlan(recalculatedPlan);
  };

  // Effect to recalculate all task dates if projectStartDateState changes
  useEffect(() => {
    if (projectPlan.length > 0) { // Only run if there are tasks to recalculate
      const recalculatedPlan = recalculateTaskDates([...projectPlan], new Date(projectStartDateState));
      setProjectPlan(recalculatedPlan);
    }
    // Adding projectPlan as a dependency could cause loop if recalculateTaskDates always creates new array.
    // However, setProjectPlan should handle this. For safety, could compare stringified plans.
    // For now, this ensures dates update when start date changes.
  }, [projectStartDateState]); // projectPlan removed to prevent potential loops, recalculation is explicit on change.


  useEffect(() => {
    if (projectPlan && projectPlan.length > 0) {
      // Sum of all task durations
      const totalDays = projectPlan.reduce((sum, task) => sum + Math.max(1, task.Duration), 0);
      setCalculatedOverallDuration(`${totalDays} day${totalDays !== 1 ? 's' : ''}`);
    } else {
      setCalculatedOverallDuration("0 days"); // Or "N/A" or fallback to idea.duration
    }
  }, [projectPlan]);

  // --- Crucial Change: Create a *separate* tasks array for Firestore saving
  //    that includes ONLY the desired fields and uses camelCase. ---
  // This derivation of tasksForFirestore will now automatically use the updated
  // projectPlan which includes edited names, durations, and recalculated dates.
  // The duration logic here also simplifies as task.Duration is guaranteed to be a number.
  const tasksForFirestore: SavedProjectTask[] = projectPlan.map(task => ({
    taskId: task.TaskID,
    taskName: task.TaskName,
    startDate: task.StartDate || '',
    endDate: task.EndDate || '',
    duration: Math.max(1, Math.floor(task.Duration)), // Ensure positive integer
    hints: task.hints || [], // Include the hints array
  }));
  // -----------------------------------------------------------------

  const areHintsStillGenerating = projectPlan.some(task => 
    task.hints && task.hints.length > 0 && task.hints[0] === "Generating hints..."
  ); // Check if any task still has the loading hint

  // Construct the ProjectIdea object with *simplified* tasks for the dialog
  const projectIdeaWithTasks: ProjectIdea = {
    ...idea, // Copy existing properties
    description: editableDescription,
    duration: calculatedOverallDuration,
    // Pass the current projectStartDateState to the dialog, formatted as string
    projectStartDate: projectStartDateState.toISOString().slice(0,10), 
    tasks: tasksForFirestore,
  };
  
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="flex-grow flex flex-col p-6 space-y-6 mx-auto w-full max-w-6xl">
      <div className="w-full flex justify-start">
        <Button onClick={goBack} variant="outline" className="shadow-sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Ideas
        </Button>
      </div>
      <Card className="w-full shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-start mb-2">
          <CardTitle size="lg" className="text-neutral-900 dark:text-neutral-100">{idea.title}</CardTitle>
            <IconComponent size={28} className="text-accent flex-shrink-0" />
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="secondary">Difficulty: {idea.difficulty}</Badge>
            <Badge variant="outline">Duration: {calculatedOverallDuration}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Project Start Date Picker */}
          <div className="mb-4">
            <label htmlFor="projectStartDate" className="block text-sm font-medium text-gray-700 mb-1">
              Project Start Date:
            </label>
            <Input
              type="date"
              id="projectStartDate"
              value={formatDateForInput(projectStartDateState)}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                // Ensure newDate is valid and not in the past if needed, though HTML input handles some of this
                // For time zone issues, ensure date is parsed correctly (e.g. new Date(e.target.value + 'T00:00:00') if needed)
                if (!isNaN(newDate.getTime())) {
                  setProjectStartDateState(newDate);
                }
              }}
              className="w-full sm:w-auto p-2 border rounded-md"
            />
          </div>

          <Textarea
            value={editableDescription}
            onChange={(e) => setEditableDescription(e.target.value)}
            placeholder="Enter project description..."
            className="mb-4 p-2 border rounded-md w-full text-muted-foreground leading-relaxed bg-transparent hover:border-primary focus:border-primary"
            rows={Math.max(5, editableDescription.split('\n').length)} 
          />
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-xl font-semibold text-black mb-3">Project Plan</h3>
            <div className="p-4 border rounded-md bg-background/50 shadow-sm">
              {
                loadingPlan ? (
                  <>
                    <div className="flex items-center justify-center p-4 text-muted-foreground">
                      <LoadingSpinner size={24} className="mr-2" /> Generating Project Plan...
                    </div>
                  </>
                ) : projectPlan && projectPlan.length > 0 ? (
                  <ScrollArea className="h-[500px] overflow-y-auto">
                    <Table><TableHeader className="sticky top-0 z-10 bg-white"><TableRow>
                          <TableHead className="w-[8%]">Hints</TableHead>
                          <TableHead className="w-[27%]">Task Name</TableHead>
                          <TableHead className="w-[8%]">Duration</TableHead>
                          <TableHead className="w-[18%]">Start Date</TableHead>
                          <TableHead className="w-[18%] text-right">Due Date</TableHead>
                          <TableHead className="w-[8%] text-right">Progress</TableHead>
                          <TableHead className="w-[13%] text-center">Actions</TableHead>
                        </TableRow></TableHeader><TableBody>
                        {projectPlan.map((task) => (
                          <TableRow key={task.TaskID} className={cn("hover:bg-muted", task.Milestone ? "bg-secondary/70 font-semibold" : "")}>
                            <TableCell className="py-2">
                              {task.hints && task.hints[0] === "Generating hints..." ? (
                                <span className="text-sm text-muted-foreground flex items-center">
                                  <LoadingSpinner size={16} className="mr-1" /> Generating...
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedTask(task)}
                                  className="mr-2 text-xs py-1 h-auto border border-border hover:border-primary"
                                > ✨ Hints</Button>
                              )}
                            </TableCell>
                            <TableCell className="py-2">{task.TaskName}</TableCell>
                            <TableCell className="py-2">{task.Duration}</TableCell>
                            <TableCell className="py-2 whitespace-nowrap">{task.StartDate}</TableCell>
                            <TableCell className="py-2 text-right whitespace-nowrap">{task.EndDate}</TableCell>
                            <TableCell className="text-right py-2">{task.PercentageComplete}%</TableCell>
                            <TableCell className="text-center py-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveTask(task.TaskID)}
                                aria-label="Remove task"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={7}>
                            <Button onClick={handleAddTask} variant="ghost" className="w-full text-left justify-start text-muted-foreground hover:text-black">
                              <UserPlus className="mr-2 h-4 w-4" /> Add Task
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody></Table>
                  </ScrollArea>
                ) : (
                  <p className="text-center text-muted-foreground p-4">No project plan generated yet. Click "Add New Task" to get started.</p>
                )
              }
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-6">
          <Button
             className="w-full bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => {
              setIsAssignDialogOpen(true);
            }}
            disabled={loadingPlan || projectPlan.length === 0 || areHintsStillGenerating}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Assign to Student
          </Button>
        </CardFooter>
      </Card>

      {/* Pass the projectIdeaWithTasks which includes the generated *simplified* tasks */}
      {projectIdeaWithTasks && user && (
        <AssignProjectDialog
          project={projectIdeaWithTasks}
          isOpen={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          teacherId={user.uid}
        />
      )}

      {
        selectedTask && (
          <TaskHints
            task={selectedTask.TaskName}
            idea={editableDescription}
            initialHints={selectedTask.hints}
            onClose={() => setSelectedTask(null)}
          />
        )
      }
    </div>
  );
});