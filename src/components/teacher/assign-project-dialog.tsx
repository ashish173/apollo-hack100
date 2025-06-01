
"use client";

import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { db as firebaseDbService } from '@/lib/firebase';
import type { ProjectIdea } from '@/app/teacher/dashboard/student-mentor/page';
import type { UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssignProjectDialogProps {
  project: ProjectIdea | null;
  isOpen: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  teacherId: string;
}

export default function AssignProjectDialog({ project, isOpen, onOpenChange, teacherId }: AssignProjectDialogProps) {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [selectedStudentUid, setSelectedStudentUid] = useState<string | undefined>(undefined);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStudents = async () => {
      if (!isOpen || !firebaseDbService) return;
      setIsLoadingStudents(true);
      try {
        const usersRef = collection(firebaseDbService, 'users');
        const q = query(usersRef, where('role', '==', 'student'));
        const querySnapshot = await getDocs(q);
        const studentList: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
          studentList.push({ uid: doc.id, ...doc.data() } as UserProfile);
        });
        setStudents(studentList);
      } catch (error) {
        console.error("Error fetching students:", error);
        toast({
          title: "Error Fetching Students",
          description: "Could not load the list of students. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingStudents(false);
      }
    };

    if (isOpen) {
        fetchStudents();
    }
  }, [isOpen, toast]);

  const handleAssignProject = async () => {
    if (!project || !selectedStudentUid || !firebaseDbService) {
      toast({
        title: "Assignment Error",
        description: "Project or student not selected, or database service unavailable.",
        variant: "destructive",
      });
      return;
    }

    const selectedStudent = students.find(s => s.uid === selectedStudentUid);
    if (!selectedStudent) {
        toast({ title: "Student not found", description: "Selected student details could not be found.", variant: "destructive" });
        return;
    }

    setIsAssigning(true);
    try {
      // Step 1: Create a new project document in 'projects' collection with an auto-generated ID
      const projectDataForDatabase = {
        title: project.title,
        description: project.description,
        difficulty: project.difficulty,
        duration: project.duration,
        // You could add teacherId as originalCreatorId or project.id as originalMockIdeaId if needed for traceability
        createdAt: serverTimestamp(), 
      };
      // Use addDoc to get an auto-generated ID for the new project document
      const newProjectRef = await addDoc(collection(firebaseDbService, 'projects'), projectDataForDatabase);
      const newProjectId = newProjectRef.id; // This is the Firestore auto-generated ID

      // Step 2: Create assignment in 'assignedProjects' collection, referencing the newProjectId
      const assignmentData = {
        projectId: newProjectId, // Use the new auto-generated ID
        studentUid: selectedStudentUid,
        studentName: selectedStudent.displayName || selectedStudent.email || 'N/A',
        teacherUid: teacherId,
        assignedAt: serverTimestamp(),
        status: 'assigned', 
      };

      await addDoc(collection(firebaseDbService, 'assignedProjects'), assignmentData);
      toast({
        title: "Project Assigned!",
        description: `${project.title} has been assigned to ${selectedStudent.displayName || selectedStudent.email}.`,
      });
      onOpenChange(false); 
      setSelectedStudentUid(undefined); 
    } catch (error) {
      console.error("Error assigning project:", error);
      toast({
        title: "Assignment Failed",
        description: "Could not assign the project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };
  
  if (!project) return null;

  const selectedStudentDisplayValue = students.find(student => student.uid === selectedStudentUid)?.displayName || students.find(student => student.uid === selectedStudentUid)?.email || "Select student...";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
            setSelectedStudentUid(undefined); // Reset student selection on close
            setIsComboboxOpen(false);
        }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Project: <span className="text-primary">{project.title}</span></DialogTitle>
          <DialogDescription>
            Select a student from the list below to assign this project to.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="student-select" className="text-right col-span-1">
              Student
            </Label>
            <div className="col-span-3">
              {isLoadingStudents ? (
                  <div className="flex items-center">
                      <LoadingSpinner size={20} className="mr-2"/> Loading students...
                  </div>
              ) : students.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No students found.</p>
              ) : (
                <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isComboboxOpen}
                      className="w-full justify-between text-muted-foreground hover:text-muted-foreground"
                      disabled={isAssigning}
                    >
                      {selectedStudentUid
                        ? selectedStudentDisplayValue
                        : "Select student..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search student..." />
                      <CommandList>
                        <CommandEmpty>No student found.</CommandEmpty>
                        <CommandGroup>
                          {students.map((student) => (
                            <CommandItem
                              key={student.uid}
                              value={student.displayName || student.email || student.uid}
                              onSelect={() => {
                                setSelectedStudentUid(student.uid === selectedStudentUid ? undefined : student.uid);
                                setIsComboboxOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedStudentUid === student.uid ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {student.displayName || student.email || student.uid}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isAssigning}>Cancel</Button>
          </DialogClose>
          <Button 
            type="button" 
            onClick={handleAssignProject} 
            disabled={!selectedStudentUid || isAssigning || isLoadingStudents || students.length === 0}
          >
            {isAssigning ? <LoadingSpinner size={20} iconClassName="text-primary-foreground" /> : 'Assign Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
