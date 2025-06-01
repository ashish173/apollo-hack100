
"use client";

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db as firebaseDbService } from '@/lib/firebase';
import { generateProjectIdeas } from "@/ai/flows/generate-project-ideas";
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

export default function StudentMentorPage() {
  const { user, loading: authLoading } = useAuth(); 

  const [projectKeywords, setProjectKeywords] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [duration, setDuration] = useState('3 weeks');
  const [isSavingQuery, setIsSavingQuery] = useState(false);
  const [selectedProjectIdea, setSelectedProjectIdea] = useState("");
  const [projectPlan, setProjectPlan] = useState<Task[]>([]);
  const [loadingPlan, setLoadingPlan] = useState(false);


  const [projectIdeas, setProjectIdeas] = useState<string[]>([]);

  const [today, setToday] = useState(new Date());

  useEffect(() => {
    setToday(new Date());
  }, []);

  if (authLoading || !user) { 
    return (
     <div className="flex-grow flex items-center justify-center p-6">
       <p>Loading...</p>
     </div>
   );
 }



 const handleGenProjectIdeas = async () => {
  if (!projectKeywords.trim()) {
    console.error("Project keywords are empty.");
    return;
  }

  if (!user || !user.uid || !user.email) {
    console.error("User is not authenticated or does not have a valid UID or email.");
    return;
  }

  if (!firebaseDbService) {
    console.error("Firebase database service is not initialized.");
    return;
  }

  setProjectIdeas([]);
  // Make GenAI API call

  try {
    const result = await generateProjectIdeas({ topic: projectKeywords, difficulty: difficulty, duration: duration });
    setProjectIdeas(result.ideas);
  } catch (error: any) {
    console.log("error in gen ai query");
  } finally {
    // 
  }

  // Make it async
  setIsSavingQuery(true);
  try {
    const queryData = {
      userId: user.uid,
      userEmail: user.email,
      keywords: projectKeywords.trim(),
      difficulty: difficulty,
      duration: duration,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(firebaseDbService, "projectIdeaQueries"), queryData);

    // Placeholder for future AI generation functionality
    console.log("Project Idea Query Saved:", queryData);

  } catch (error) {
    console.error("Error saving project idea query:", error);
    
  } finally {
    setIsSavingQuery(false);
  }
};


const handleGenerateProjectPlan = useCallback(async (idea: string) => {
  setSelectedProjectIdea(idea);
  setLoadingPlan(true);
  setProjectPlan([]); // Clear previous plan and show loader
  try {
    const result = await generateProjectPlan({ projectIdea: idea });

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


    return (
      <div className="flex-grow flex flex-col items-center justify-center p-12">
      <div className="w-full max-w-xl space-y-10">
        <div className="text-center">
          <Lightbulb size={56} className="mx-auto mb-5 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight text-primary">Project Idea Generator</h1>
          <p className="mt-3 text-lg text-muted-foreground">
          Real-world problem focused project ideas to capture the young minds.
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="project-keywords" className="text-md font-medium sr-only">Project Keywords</Label>
            <Input 
              id="project-keywords" 
              type="search"
              placeholder="e.g., Python, Web App, Machine Learning, Art History" 
              value={projectKeywords}
              onChange={(e) => setProjectKeywords(e.target.value)}
              className="bg-card text-lg h-14 px-6 rounded-lg shadow-sm w-full focus:ring-2 focus:ring-primary"
              disabled={isSavingQuery}
            />
              <p className="text-xs text-muted-foreground px-1">Enter topics to generate real-world problem focused project ideas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="difficulty-level" className="text-md font-medium">Difficulty Level</Label>
              <Select onValueChange={setDifficulty} defaultValue={difficulty} disabled={isSavingQuery}>
                <SelectTrigger id="difficulty-level" className="text-base h-11 bg-card">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="difficult">Difficult</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration-level" className="text-md font-medium">Est. Duration</Label>
              <Select onValueChange={setDuration} defaultValue={duration} disabled={isSavingQuery}>
                <SelectTrigger id="duration-level" className="text-base h-11 bg-card">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 week">1 Week</SelectItem>
                  <SelectItem value="3 weeks">3 Weeks</SelectItem>
                  <SelectItem value="5+ weeks">5+ Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            onClick={handleGenProjectIdeas} 
            className="w-full py-3 text-lg h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md shadow-md transition-transform transform hover:scale-105"
            aria-label="Generate Project Ideas"
            disabled={isSavingQuery || authLoading}
          >
            {isSavingQuery ? (
              <p>Loading...</p>
            ) : (
              <>
                <Lightbulb className="mr-2 h-5 w-5" />
                Gen Project Ideas
              </>
            )}
          </Button>
        </div>
      </div>
      {projectIdeas.map((idea, index) => (
        <>
          <div>{idea}</div>
          <Button onClick={() => handleGenerateProjectPlan(idea)}>Generate Plan</Button>
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
        </>
      ))}

    </div>
    );
}
