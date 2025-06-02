// idea-detail.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Lightbulb, UserPlus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import TaskHints, { Task } from './task-hints';

// This interface represents the *raw* data structure coming from your AI's project plan generation.
// This is what will be stored in `projectPlan` state for *display* in IdeaDetail.
interface DisplayTask {
  TaskID: number;
  TaskName: string;
  StartDate?: string;
  EndDate?: string;
  Duration: string | number; // This is the AI's raw duration (e.g., "2 days")
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
  duration: string;
}

// Updated ProjectIdea interface:
// It has `id`, `title`, `description`, `difficulty`, `duration`, `icon`
// And now, its `tasks` array will conform to the `SavedProjectTask` structure for saving.
export interface ProjectIdea { // Exported for use in page.tsx
  id?: string;
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
  const { toast } = useToast();
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

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

      let currentDate = new Date(today);

      const tasksForDisplay: DisplayTask[] = parsedData.map((item) => {
        let durationValue: number;
        if (typeof item.Duration === 'string') {
          const durationMatch = item.Duration.match(/(\d+)/);
          durationValue = durationMatch ? parseInt(durationMatch[0], 10) : 1;
        } else if (typeof item.Duration === 'number') {
          durationValue = item.Duration;
        } else {
          durationValue = 1;
        }
        const validDuration = isNaN(durationValue) || durationValue <= 0 ? 1 : durationValue;

        const itemStartDate = new Date(currentDate);
        const itemEndDate = addDays(itemStartDate, validDuration - 1); // -1 because addDays is inclusive of the start day

        // Update currentDate for the next task
        currentDate = addDays(itemEndDate, 1);

        // Return the full DisplayTask object, ensuring calculated dates/duration are set
        return {
          ...item, // Keep all original properties from AI for display
          StartDate: itemStartDate.toISOString().slice(0, 10), // Set actual start date
          EndDate: itemEndDate.toISOString().slice(0, 10),     // Set actual end date
          Duration: `${validDuration} day${validDuration > 1 ? 's' : ''}`, // Format duration for display
        };
      });

      setProjectPlan(tasksForDisplay); // Set the state with the full DisplayTask array for table display
      toast({
        title: "Project Plan Generated!",
        description: "The project plan has been successfully generated.",
      });
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
    }
  }, [fetchProjectPlan, idea]);

  // --- Crucial Change: Create a *separate* tasks array for Firestore saving
  //    that includes ONLY the desired fields and uses camelCase. ---
  const tasksForFirestore: SavedProjectTask[] = projectPlan.map(task => ({
    taskId: task.TaskID, // camelCase
    taskName: task.TaskName, // camelCase
    startDate: task.StartDate || '', // camelCase (ensure string, fallback)
    endDate: task.EndDate || '',     // camelCase (ensure string, fallback)
    duration: String(task.Duration), // camelCase (ensure string)
  }));
  // -----------------------------------------------------------------

  // Construct the ProjectIdea object with *simplified* tasks for the dialog
  const projectIdeaWithTasks: ProjectIdea = {
    ...idea, // Copy existing properties
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
              <Badge variant="outline">Duration: {idea.duration}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{idea.description}</p>
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
                          </TableRow></TableHeader> {/* <--- REMOVED WHITESPACE */}
                        <TableBody>
                          {projectPlan.map((task, index) => (
                            <TableRow key={index} className={cn("hover:bg-muted", task.Milestone ? "bg-secondary/70 font-semibold" : "")}>
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
                              <TableCell className="py-2">{task.TaskName}</TableCell>
                              <TableCell className="py-2">{task.Duration}</TableCell>
                              <TableCell className="py-2">{task.StartDate}</TableCell>
                              <TableCell className="text-right py-2">{task.EndDate}</TableCell>
                              <TableCell className="text-right py-2">{task.PercentageComplete}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <p className="text-center text-muted-foreground p-4">No project plan generated yet.</p>
                  )
                }
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
            idea={idea.description}
            onClose={() => setSelectedTask(null)}
          />
        )
      }

    </>
  );
}