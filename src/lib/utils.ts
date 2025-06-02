import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Import necessary date-fns functions and types
import { addDays, format as formatDate } from 'date-fns';
import type { SavedProjectTask } from '@/app/teacher/dashboard/student-mentor/idea-detail'; // Assuming this type is appropriate

// Input task type for the utility function might only need a subset of SavedProjectTask,
// specifically duration and any other fields that should be passed through.
// For now, let's assume tasks passed in are at least { duration: number, ...otherData }
// and the output will be full SavedProjectTask with calculated dates.
interface InputTask {
  taskId: number; // Or string, depending on original structure
  taskName: string;
  duration: number | string; // Accept string as well, parse within function
  // Include other fields that should be preserved
  [key: string]: any;
}

export interface CalculatedTask extends SavedProjectTask {
  // Inherits taskId, taskName, startDate, endDate, duration from SavedProjectTask
  [key: string]: any; // Allow other properties to be present
}

/**
 * Calculates start and end dates for a list of tasks based on a project start date.
 * @param tasks The list of tasks. Each task must have a `duration`.
 * @param projectStartDateString The project's start date in 'yyyy-MM-dd' format.
 * @returns A new array of tasks with calculated `startDate` and `endDate`.
 */
export function calculateTaskDates(
  tasks: InputTask[],
  projectStartDateString: string
): CalculatedTask[] {
  if (!tasks || tasks.length === 0) {
    return [];
  }

  const newTasks: CalculatedTask[] = [];
  // Ensure projectStartDateString is valid and parse it, handling potential timezone issues by setting time to noon.
  // Using 'T12:00:00' helps avoid issues with date changes due to DST when only the date is relevant.
  let currentTaskStartDate = new Date(projectStartDateString + 'T12:00:00');

  if (isNaN(currentTaskStartDate.getTime())) {
    // Invalid start date string
    console.error("Invalid project start date provided to calculateTaskDates:", projectStartDateString);
    // Fallback: use current date, or could throw error
    currentTaskStartDate = new Date(); 
    currentTaskStartDate.setHours(12,0,0,0); // Normalize time
  }


  tasks.forEach(task => {
    let taskDurationDays: number;

    if (typeof task.duration === 'number') {
      taskDurationDays = task.duration;
    } else if (typeof task.duration === 'string') {
      // Basic parsing for "X days" string, can be expanded
      const match = task.duration.match(/(\d+)/);
      taskDurationDays = match ? parseInt(match[1], 10) : 1;
    } else {
      taskDurationDays = 1; // Default if duration is missing or invalid type
    }
    
    // Ensure duration is at least 1 day
    taskDurationDays = Math.max(1, Math.floor(taskDurationDays));

    const taskStartDateStr = formatDate(currentTaskStartDate, 'yyyy-MM-dd');
    const taskEndDate = addDays(currentTaskStartDate, taskDurationDays - 1); // -1 because duration includes start day
    const taskEndDateStr = formatDate(taskEndDate, 'yyyy-MM-dd');

    newTasks.push({
      // Spread original task properties first to preserve them
      ...task, 
      // Then override/add the calculated and processed ones
      // Ensure taskId and taskName are present, default if not (though they should be)
      taskId: task.taskId || 0, 
      taskName: task.taskName || 'Unnamed Task',
      startDate: taskStartDateStr,
      endDate: taskEndDateStr,
      duration: taskDurationDays, // Use the processed numerical duration
    });

    // Next task starts the day after the current one ends
    currentTaskStartDate = addDays(taskEndDate, 1);
  });

  return newTasks;
}
