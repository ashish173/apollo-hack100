// components/student/student-assigned-project-detail.tsx
"use client";

import { ArrowLeft, BookOpen, CheckCircle, Hourglass } from 'lucide-react';
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
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

// Import the ProjectIdea and SavedProjectTask types from teacher's area for consistency
import { ProjectIdea, SavedProjectTask } from '@/app/teacher/dashboard/student-mentor/idea-detail';

// Define the interface for the project data this component expects
// This should match the 'AssignedProjectWithDetails' in app/student/dashboard/page.tsx
interface StudentAssignedProjectDetailProps {
  project: {
    assignedProjectId: string;
    projectId: string;
    studentUid: string;
    studentName: string;
    teacherUid: string;
    assignedAt: Timestamp;
    status: string;
    title: string;
    description: string;
    difficulty: string;
    duration: string;
    tasks?: SavedProjectTask[]; // Expects the camelCase structure for tasks
  };
  onBack: () => void;
}

export default function StudentAssignedProjectDetail({ project, onBack }: StudentAssignedProjectDetailProps) {

  return (
      <div className="flex-grow flex flex-col items-center p-6 space-y-6 max-w-4xl mx-auto">
        <div className="w-full flex justify-start">
          <Button onClick={onBack} variant="outline" className="shadow-sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Projects
          </Button>
        </div>
        <Card className="w-full shadow-xl">
          <CardHeader>
            <div className="flex justify-between items-start mb-2">
              <CardTitle className="text-2xl font-bold text-primary">{project.title}</CardTitle>
              <BookOpen size={28} className="text-accent flex-shrink-0" />
            </div>
            <CardDescription className="flex items-center text-md text-muted-foreground">
              Assigned on: <span className="font-semibold text-primary ml-1">
                {project.assignedAt ? format(project.assignedAt.toDate(), 'PPP') : 'N/A'}
              </span>
            </CardDescription>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary">Difficulty: {project.difficulty}</Badge>
              <Badge variant="outline">Duration: {project.duration}</Badge>
              <Badge
                variant={project.status === 'completed' ? 'default' : project.status === 'assigned' ? 'secondary' : 'destructive'}
                className={`text-sm ${
                  project.status === 'completed' ? 'bg-green-500 hover:bg-green-600 text-white' :
                  project.status === 'assigned' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                  'bg-yellow-500 hover:bg-yellow-600 text-white'
                }`}
              >
                {project.status === 'completed' && <CheckCircle className="mr-1.5 h-4 w-4" />}
                {project.status === 'assigned' && <Hourglass className="mr-1.5 h-4 w-4" />}
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{project.description}</p>
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-xl font-semibold text-primary mb-3">Project Plan</h3>
              <div className="p-4 border rounded-md bg-background/50 shadow-sm">
                {project.tasks && project.tasks.length > 0 ? (
                  <ScrollArea className="h-[300px]">
                    <Table><TableHeader><TableRow> {/* Hydration fix */}
                        <TableHead className="w-[30%]">Task Name</TableHead>
                        <TableHead className="w-[10%]">Task ID</TableHead>
                        <TableHead className="w-[15%]">Duration</TableHead>
                        <TableHead className="w-[20%]">Start Date</TableHead>
                        <TableHead className="w-[20%] text-right">End Date</TableHead>
                      </TableRow></TableHeader>
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
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Projects
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}