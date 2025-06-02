// idea-detail.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
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
import TaskHints, { Task } from './task-hints';

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
}

// This interface represents the *specific subset* of task data you want to save in Firestore,
// using camelCase for consistency.
export interface SavedProjectTask { // Exported for use in assign-project-dialog.tsx
  taskId: number;
  taskName: string;
  startDate: string;
  endDate: string;
  duration: number; // Represent duration in days
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


export default function IdeaDetail(
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
  const [calculatedOverallDuration, setCalculatedOverallDuration] = useState<string>(idea.duration); // New state

  // projectPlan now holds the *full* AI-generated tasks for *display* in the table
  const [projectPlan, setProjectPlan] = useState<DisplayTask[]>([]); // Use DisplayTask[] here
  const [loadingPlan, setLoadingPlan] = useState(false);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [today, setToday] = useState(new Date());

  const FIREBASE_FUNCTION_URL = 'https://us-central1-role-auth-7bc43.cloudfunctions.net/generateProjectPlanFn';


  useEffect(() => {
    setToday(new Date());
  }, []);

  const fetchProjectPlan = useCallback(async () => {
    setLoadingPlan(true);
    setProjectPlan([]); // Clear previous plan and show loader
    try {
      // const result = await generateProjectPlan({ projectIdea: idea.description });

      let parsedData: DisplayTask[]; // Parse as DisplayTask


      const requestBody = {
        projectIdea: idea.description,
      };

      const response = await fetch(FIREBASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      // Align initial date calculation with recalculateTaskDates logic
      let currentDate = idea.projectStartDate ? new Date(idea.projectStartDate) : new Date(today);

      const tasksForDisplay: DisplayTask[] = parsedData.map((item) => {
        // item.Duration is the raw duration from AI (e.g., "2 days", "1 week")
        // It's typed as 'number' in DisplayTask due to previous changes,
        // but JSON.parse might leave it as string if AI sends string.
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
            // Fallback for strings that might just contain a number (treat as days)
            const genericMatch = durationStr.match(/(\d+)/);
            if (genericMatch && genericMatch[1]) {
              durationInDays = parseInt(genericMatch[1], 10);
            }
          }
        } else if (typeof item.Duration === 'number') {
          // Handles cases where duration might already be a number
          durationInDays = item.Duration;
        }

        // Ensure duration is at least 1 day and a whole number
        const validDuration = Math.max(1, Math.floor(isNaN(durationInDays) ? 1 : durationInDays));

        const itemStartDate = new Date(currentDate);
        const itemEndDate = addDays(itemStartDate, validDuration - 1); // -1 because addDays is inclusive of the start day

        // Update currentDate for the next task
        currentDate = addDays(itemEndDate, 1);

        // Return the full DisplayTask object, ensuring calculated dates/duration are set
        return {
          ...item, // Keep all original properties from AI for display
          StartDate: itemStartDate.toISOString().slice(0, 10), // Set actual start date
          EndDate: itemEndDate.toISOString().slice(0, 10),     // Set actual end date
          Duration: validDuration, // Store duration as a number (in days)
        };
      });

      setProjectPlan(tasksForDisplay); // Set the state with the full DisplayTask array for table display
    } catch (error: any) {
      console.error("Error during project plan generation:", error);
      setProjectPlan([]);
    } finally {
      setLoadingPlan(false);
    }
  }, [idea.description, today]);

  const IconComponent = idea.icon || Lightbulb;

  useEffect(() => {
    if (idea) {
      fetchProjectPlan();
      setEditableDescription(idea.description); // Reset editable description if idea object itself changes
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

    const baseStartDate = idea.projectStartDate ? new Date(idea.projectStartDate) : new Date(today);
    const recalculatedPlan = recalculateTaskDates(updatedOncePlan, baseStartDate);
    setProjectPlan(recalculatedPlan);
  };

  const handleAddTask = () => {
    const newTask: DisplayTask = {
      TaskID: Math.max(0, ...projectPlan.map(t => t.TaskID)) + 1, // Generate new ID
      TaskName: "New Task - Edit Me",
      Duration: 1,
      StartDate: "", // Will be set by recalculateTaskDates
      EndDate: "",   // Will be set by recalculateTaskDates
      PercentageComplete: 0,
      Dependencies: "",
      Milestone: false,
    };
    const updatedPlan = [...projectPlan, newTask];
    const baseStartDate = idea.projectStartDate ? new Date(idea.projectStartDate) : new Date(today);
    const recalculatedPlan = recalculateTaskDates(updatedPlan, baseStartDate);
    setProjectPlan(recalculatedPlan);
  };

  const handleRemoveTask = (taskIdToRemove: number) => {
    const updatedPlan = projectPlan.filter(task => task.TaskID !== taskIdToRemove);
    const baseStartDate = idea.projectStartDate ? new Date(idea.projectStartDate) : new Date(today);
    const recalculatedPlan = recalculateTaskDates(updatedPlan, baseStartDate);
    setProjectPlan(recalculatedPlan);
  };

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
  }));
  // -----------------------------------------------------------------

  // Construct the ProjectIdea object with *simplified* tasks for the dialog
  const projectIdeaWithTasks: ProjectIdea = {
    ...idea, // Copy existing properties
    description: editableDescription, // Use edited description
    duration: calculatedOverallDuration, // Use calculated duration
    tasks: tasksForFirestore, // Assign the *simplified* tasks array here
  };

  return (
    <>
      <div className="flex-grow flex flex-col items-center p-6 space-y-6">
        <div className="w-full flex justify-start">
          <Button onClick={goBack} variant="outline" className="shadow-sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Ideas
          </Button>
        </div>
        <Card className="w-full shadow-xl">
          <CardHeader>
            <div className="flex justify-between items-start mb-2">
              <CardTitle className="text-2xl font-bold text-primary">{idea.title}</CardTitle>
              <IconComponent size={28} className="text-accent flex-shrink-0" />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="secondary">Difficulty: {idea.difficulty}</Badge>
              <Badge variant="outline">Duration: {calculatedOverallDuration}</Badge> {/* Use calculatedOverallDuration */}
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={editableDescription}
              onChange={(e) => setEditableDescription(e.target.value)}
              placeholder="Enter project description..."
              className="mb-4 p-2 border rounded-md w-full text-muted-foreground leading-relaxed bg-transparent hover:border-primary focus:border-primary"
              rows={Math.max(3, editableDescription.split('\n').length)} 
            />
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-xl font-semibold text-primary mb-3">Project Plan</h3>
              <div className="p-4 border rounded-md bg-background/50 shadow-sm">
                {
                  loadingPlan ? (
                    <>
                      <div className="flex items-center justify-center p-4 text-muted-foreground">
                        <LoadingSpinner size={24} className="mr-2" /> Generating Project Plan...
                      </div>
                    </>
                  ) : projectPlan && projectPlan.length > 0 ? (
                    <ScrollArea className="h-[300px]">
                      <Table><TableHeader><TableRow> {/* <--- REMOVED WHITESPACE */}
                            <TableHead className="w-[5%]">Task Name</TableHead>
                            <TableHead className="w-[30%]">Task Name</TableHead>
                            <TableHead className="w-[15%]">Duration</TableHead>
                            <TableHead className="w-[15%]">Start Date</TableHead>
                            <TableHead className="w-[15%] text-right">Due Date</TableHead>
                            <TableHead className="w-[15%] text-right">Progress</TableHead>
                            <TableHead className="w-[10%] text-center">Actions</TableHead> {/* Action column */}
                          </TableRow></TableHeader> {/* <--- REMOVED WHITESPACE */}
                        <TableBody>
                          {projectPlan.map((task) => ( // Changed key to task.TaskID for stability
                            <TableRow key={task.TaskID} className={cn("hover:bg-muted", task.Milestone ? "bg-secondary/70 font-semibold" : "")}>
                              <TableCell className="flex items-center py-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTask(task);
                                  }}
                                  className="mr-2 text-xs py-1 h-auto border border-border hover:border-primary"
                                > ✨ Hints</Button>
                              </TableCell>
                              <TableCell className="py-2">
                                <Input
                                  type="text"
                                  value={task.TaskName}
                                  onChange={(e) => handleTaskNameChange(task.TaskID, e.target.value)}
                                  className="w-full p-1 h-8 border-transparent hover:border-slate-300 focus:border-slate-300 bg-transparent"
                                />
                              </TableCell>
                              <TableCell className="py-2 w-[100px]"> {/* Added w-[100px] for consistency */}
                                <Input
                                  type="number"
                                  value={task.Duration}
                                  onChange={(e) => handleTaskDurationChange(task.TaskID, e.target.value)}
                                  className="w-full p-1 h-8 border-transparent hover:border-slate-300 focus:border-slate-300 bg-transparent text-center"
                                  min="1"
                                />
                              </TableCell>
                              <TableCell className="py-2">{task.StartDate}</TableCell>
                              <TableCell className="text-right py-2">{task.EndDate}</TableCell>
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
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <p className="text-center text-muted-foreground p-4">No project plan generated yet. Click "Add New Task" to get started.</p>
                  )
                }
                <div className="mt-4">
                  <Button variant="outline" onClick={handleAddTask} className="w-full sm:w-auto">
                    Add New Task
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-6">
            <Button
              variant="default"
              className="w-full text-primary-foreground bg-primary hover:bg-primary/90"
              onClick={() => {
                setIsAssignDialogOpen(true);
              }}
              disabled={loadingPlan || projectPlan.length === 0}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Assign to Student
            </Button>
          </CardFooter>
        </Card>
      </div>

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
            idea={editableDescription} // Use edited description for hints context
            onClose={() => setSelectedTask(null)}
          />
        )
      }

    </>
  );
}