
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Lightbulb, UserPlus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectIdea } from './page';
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

interface Task {
  TaskID: number;
  TaskName: string;
  StartDate?: string;
  EndDate?: string;
  Duration: string | number; // Allow number for programmatic setting
  PercentageComplete: number;
  Dependencies: string;
  Milestone: boolean;
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
    const [projectPlan, setProjectPlan] = useState<Task[]>([]);
    const [loadingPlan, setLoadingPlan] = useState(false);
    const [today, setToday] = useState(new Date());

  useEffect(() => {
    setToday(new Date());
  }, []);


  const fetchProjectPlan = useCallback(async () => {
    setLoadingPlan(true);
    setProjectPlan([]); // Clear previous plan and show loader
    try {
      const result = await generateProjectPlan({ projectIdea: idea.description });
  
      let parsedData: Task[];
      try {
        parsedData = JSON.parse(result.projectPlan);
      } catch (jsonError: any) {
        console.error("Failed to parse project plan JSON:", jsonError);
        alert("Failed to parse project plan data. The format might be incorrect.");
        setProjectPlan([]);
        setLoadingPlan(false);
        return;
      }
  
      let currentDate = new Date(today);
  
      const dataWithDates = parsedData.map((item) => {
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
        const itemEndDate = addDays(itemStartDate, validDuration -1 );
  
        const newItem = {
          ...item,
          StartDate: itemStartDate.toISOString().slice(0, 10),
          EndDate: itemEndDate.toISOString().slice(0, 10),
          Duration: `${validDuration} day${validDuration > 1 ? 's' : ''}`,
  
        };
        currentDate = addDays(itemEndDate, 1);
        return newItem;
      });
  
      setProjectPlan(dataWithDates);
    } catch (error: any) {
      console.error("Error during project plan generation:", error);
      alert(error.message || "An unexpected error occurred.");
      setProjectPlan([]);
    } finally {
      setLoadingPlan(false);
    }
  }, [today]);

  const IconComponent = idea.icon || Lightbulb;

  useEffect(() => {
    fetchProjectPlan()
  }, []);

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
                    Generation Project Plan
                    <LoadingSpinner />
                  </>
                ) : (
                  <ScrollArea className="md:max-h-[calc(100vh-12rem)]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60%]">Task Name</TableHead>
                          <TableHead className="w-[20%]">Duration</TableHead>
                          <TableHead className="w-[20%] text-right">End Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projectPlan.map((task) => (
                          <TableRow key={task.TaskID} className={cn("hover:bg-muted", task.Milestone ? "bg-secondary/70 font-semibold" : "")}>
                            <TableCell className="flex items-center py-2">
                              {task.Milestone ? (
                                  <span className="mr-2">⭐</span>
                              ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {}}
                                className="mr-2 text-xs py-1 h-auto border border-border hover:border-primary"
                              > ✨ Hints</Button>
                              )}
                              {task.TaskName}
                            </TableCell>
                            <TableCell className="py-2">{task.Duration}</TableCell>
                            <TableCell className="text-right py-2">{task.EndDate}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
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
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Assign to Student
              </Button>
          </CardFooter>
        </Card>
      </div>

      {idea && user && (
        <AssignProjectDialog
          project={idea}
          isOpen={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          teacherId={user.uid}
        />
      )}
    </>
    
  );
}
