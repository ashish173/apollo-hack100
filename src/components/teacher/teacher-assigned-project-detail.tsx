// components/teacher/teacher-assigned-project-detail.tsx
"use client";

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

// Import the ProjectIdea and SavedProjectTask types from idea-detail.tsx
import { ProjectIdea, SavedProjectTask } from '@/app/teacher/dashboard/student-mentor/idea-detail';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp for date conversion

// Define the interface for the project data this component expects
interface AssignedProjectWithDetails {
  assignedProjectId: string;
  projectId: string;
  studentUid: string;
  studentName: string;
  teacherUid: string;
  assignedAt: Timestamp; // Using Timestamp from Firestore
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  tasks?: SavedProjectTask[]; // Expects the camelCase structure
}

interface TeacherAssignedProjectDetailProps {
  project: AssignedProjectWithDetails;
  onBack: () => void;
}

export default function TeacherAssignedProjectDetail({ project, onBack }: TeacherAssignedProjectDetailProps) {
  // Function to format Firestore Timestamp to a readable date string
  const formatAssignedDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <div className="flex-grow flex flex-col items-center p-6 space-y-6">
        <div className="w-full flex justify-start">
          <Button onClick={onBack} variant="outline" className="shadow-sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Assigned Projects
          </Button>
        </div>
        <Card className="w-full shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary mb-2">{project.title}</CardTitle>
            <CardDescription className="flex items-center text-md text-muted-foreground">
              Assigned to: <span className="font-semibold text-primary ml-1">{project.studentName}</span>
              {project.assignedAt && (
                <span className="ml-4 text-sm text-muted-foreground">
                  (on {formatAssignedDate(project.assignedAt)})
                </span>
              )}
            </CardDescription>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary">Difficulty: {project.difficulty}</Badge>
              <Badge variant="outline">Duration: {project.duration}</Badge>
              <Badge variant="default">Status: Assigned</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{project.description}</p>
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-xl font-semibold text-primary mb-3">Project Plan</h3>
              <div className="p-4 border rounded-md bg-background/50 shadow-sm">
                {project.tasks && project.tasks.length > 0 ? (
                  <ScrollArea className="h-[300px]"> {/* Fixed height for scrollable area */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[30%]">Task Name</TableHead>
                          <TableHead className="w-[10%]">Task ID</TableHead>
                          <TableHead className="w-[15%]">Duration</TableHead>
                          <TableHead className="w-[20%]">Start Date</TableHead>
                          <TableHead className="w-[20%] text-right">End Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {project.tasks.map((task, index) => (
                          <TableRow key={task.taskId || index} className="hover:bg-muted">
                            <TableCell className="py-2">{task.taskName}</TableCell>
                            <TableCell className="py-2">{task.taskId}</TableCell>
                            <TableCell className="py-2">{task.duration}</TableCell>
                            <TableCell className="py-2">{task.startDate}</TableCell>
                            <TableCell className="text-right py-2">{task.endDate}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                ) : (
                  <p className="text-center text-muted-foreground p-4">No detailed plan available for this project.</p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-6">
            <Button onClick={onBack} variant="outline" className="w-full shadow-sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Assigned Projects
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}