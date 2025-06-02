"use client";

import { useCallback, useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CardContent } from "@/components/ui/card";
import BeatLoader from "react-spinners/BeatLoader";
import { useToast } from '@/hooks/use-toast';

export default function TaskHints(
  {
    task,
    idea,
    onClose,
  }: {
    task: string,
    idea: string,
    onClose: () => void
  }) {
    const { toast } = useToast();
    const FIREBASE_FUNCTION_URL = 'https://us-central1-role-auth-7bc43.cloudfunctions.net/suggestTaskHintsFn';
    const [taskHints, setTaskHints] = useState<string[]>([]);
    const [loadingHints, setLoadingHints] = useState(false);

    console.log("sfasdfafadfad", task, idea);
    
    const generateTaskHints = useCallback(async () => {
      setLoadingHints(true);
      setTaskHints([]);
      try {
        const requestBody = {
          taskDescription: task,
          projectGoal: idea,
          relevantMilestones: ""
          }
  
        const response = await fetch(FIREBASE_FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
  
        const data = await response.json();
        const rawResponseText = data.response;
  
        setTaskHints(rawResponseText.hints);
        if (rawResponseText.hints && rawResponseText.hints.length > 0) {
          toast({
            title: "Hints Generated!",
            description: "Successfully generated hints for the task.",
          });
        }

      } catch (error: any) {
      } finally {
        setLoadingHints(false);
      }
    }, []);

    useEffect(() => {
      generateTaskHints();
    }, [])

  return (
    <>
      <Dialog open={!!task} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-[90%] md:max-w-[60%] lg:max-w-[50%] h-[90%]">
          <DialogHeader>
            <DialogTitle>Task Suggestions</DialogTitle>
            {task && <DialogDescription>
              For task: {task}
            </DialogDescription>}
          </DialogHeader>
          {task && (
            <CardContent className="pt-4">
              {loadingHints ? (
                 <div className="flex justify-center items-center h-32">
                    <BeatLoader color="hsl(var(--primary))" />
                 </div>
              ) : taskHints.length > 0 ? (
                <ScrollArea className="rounded-md border p-4">
                  <ul className="space-y-2">
                    {taskHints.map((hint, index) => (
                      <li key={index} className="list-disc ml-5 text-sm">
                        {hint}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : (
                <p className="text-muted-foreground text-center py-10">No hints available for this task, or still loading.</p>
              )}
            </CardContent>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}