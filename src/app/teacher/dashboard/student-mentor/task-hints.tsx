"use client";

import { useEffect, useState } from "react";

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

export default function TaskHints(
  {
    task,
    idea,
    onClose,
    initialHints,
  }: {
    task: string,
    idea: string,
    onClose: () => void,
    initialHints?: string[]
  }) {
    const [taskHints, setTaskHints] = useState<string[]>([]);
    const [loadingHints, setLoadingHints] = useState(true); // Set to true initially while content is processed

    useEffect(() => {
      if (initialHints && initialHints.length > 0) {
        setTaskHints(initialHints);
        setLoadingHints(false);
      } else {
        setTaskHints(["No hints generated for this task."]); // Display a message if no hints are provided
        setLoadingHints(false);
      }
    }, [initialHints])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
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
    </div>
  );
}