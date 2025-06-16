// task-hints.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, Lightbulb, Target, CheckCircle2, X } from "lucide-react";

// Apollo Design System Components
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export interface Task {
  TaskName: string;
  [key: string]: any;
}

export default function TaskHints({
  task,
  idea,
  onClose,
}: {
  task: string;
  idea: string;
  onClose: () => void;
}) {
  const FIREBASE_FUNCTION_URL = 'https://us-central1-role-auth-7bc43.cloudfunctions.net/suggestTaskHintsFn';
  const [taskHints, setTaskHints] = useState<string[]>([]);
  const [loadingHints, setLoadingHints] = useState(false);

  console.log("Task hints for:", task, idea);
  
  const generateTaskHints = useCallback(async () => {
    setLoadingHints(true);
    setTaskHints([]);
    
    try {
      const requestBody = {
        taskDescription: task,
        projectGoal: idea,
        relevantMilestones: ""
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

      setTaskHints(rawResponseText.hints || []);
    } catch (error: any) {
      console.error("Error generating task hints:", error);
      setTaskHints([]);
    } finally {
      setLoadingHints(false);
    }
  }, [task, idea]);

  useEffect(() => {
    if (task) {
      generateTaskHints();
    }
  }, [generateTaskHints, task]);

  // Loading State Component
  const LoadingState = () => (
    <Card variant="ghost" className="text-center py-12">
      <CardContent>
        <LoadingSpinner 
          size="lg" 
          variant="primary" 
          showLabel={true}
          label="Generating Hints"
          description="Our AI is analyzing the task and creating personalized suggestions..."
        />
      </CardContent>
    </Card>
  );

  // Empty State Component
  const EmptyState = () => (
    <Card variant="ghost" className="text-center py-8">
      <CardContent>
        <div className="mx-auto mb-4 w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center">
          <Lightbulb className="w-8 h-8 text-neutral-400" />
        </div>
        <CardTitle size="default" className="mb-2">
          No hints available
        </CardTitle>
        <p className="body-text text-neutral-600 dark:text-neutral-400">
          Unable to generate hints for this task at the moment. Please try again later.
        </p>
      </CardContent>
    </Card>
  );

  // Hint Item Component
  const HintItem = ({ hint, index }: { hint: string; index: number }) => (
    <Card variant="outlined" className="group hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <div className="w-6 h-6 bg-blueberry-100 dark:bg-blueberry-950 rounded-full flex items-center justify-center group-hover:bg-blueberry-500 transition-colors">
              <CheckCircle2 className="w-3 h-3 text-blueberry-600 dark:text-blueberry-400 group-hover:text-white transition-colors" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="overline-text text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {hint}
            </p>
          </div>
          <Badge variant="outline" size="sm" className="flex-shrink-0 ml-2">
            {index + 1}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={!!task} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blueberry-500 to-blueberry-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="heading-3 text-neutral-900 dark:text-neutral-100">
                  AI Task Suggestions
                </DialogTitle>
                <DialogDescription className="body-text text-neutral-600 dark:text-neutral-400">
                  Personalized hints and guidance for task completion
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {task && (
          <>
            <Separator />

            {/* Hints Content */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {loadingHints ? (
                <LoadingState />
              ) : taskHints.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="subtitle text-neutral-900 dark:text-neutral-100">
                        Suggested Approaches
                      </h3>
                      <Badge variant="soft-primary" size="sm">
                        {taskHints.length} hints
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="h-full pr-4">
                    <div className="space-y-3">
                      {taskHints.map((hint, index) => (
                        <HintItem 
                          key={index} 
                          hint={hint} 
                          index={index}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState />
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex-shrink-0 border-t border-neutral-200 dark:border-neutral-700 pt-4">
              <div className="flex items-center justify-between">
                <p className="body-text text-neutral-500 dark:text-neutral-400 text-sm">
                  AI-generated suggestions • Use as guidance for task completion
                </p>
                <Button variant="default" onClick={onClose} className="shadow-sm">
                  Got it, thanks!
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
