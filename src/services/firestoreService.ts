import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp, arrayUnion, collection, addDoc } from "firebase/firestore";
import { Timestamp } from "firebase/firestore"; // Import Timestamp explicitly
import { ProjectReport, AIReviewResult } from '@/types'; // Import ProjectReport and AIReviewResult

export async function updateProjectReportAIReview(
  reportId: string,
  textStatus: string,
  studentProjectStatus: 'on-track' | 'off-track' | 'at-risk' | 'completed' | undefined,
) {
  const reportRef = doc(db, "projectReports", reportId);
  try {
    await updateDoc(reportRef, {
      textStatus: textStatus,
      studentProjectStatus: studentProjectStatus,
    });
    console.log("Project report successfully updated:", reportId);
  } catch (error) {
    console.error("Error updating project report:", reportId, error);
    throw error; // Re-throw to handle upstream
  }
}

export async function addProjectReportWithAIReview(
  projectId: string,
  studentUid: string,
  teacherUid: string,
  textStatus: string,
  studentProjectStatus: 'on-track' | 'off-track' | 'at-risk' | 'completed' | undefined
): Promise<ProjectReport> {
  try {
    const newReportRef = await addDoc(collection(db, "projectReports"), {
      projectId,
      studentUid,
      teacherUid,
      submittedAt: serverTimestamp(),
      textStatus,
      studentProjectStatus,
    });
    console.log("New project report successfully added:", newReportRef.id);
    // Return the created report with its ID and timestamp for frontend consistency
    return {
      id: newReportRef.id,
      projectId,
      studentUid,
      teacherUid,
      submittedAt: Timestamp.now(), // Use client timestamp for immediate use
      textStatus,
      studentProjectStatus,
    } as ProjectReport;
  } catch (error) {
    console.error("Error adding new project report:", error);
    throw error; // Re-throw to handle upstream
  }
}

export async function updateAssignedProjectAIReview(
  assignedProjectId: string,
  aiReview: AIReviewResult
) {
  const assignedProjectRef = doc(db, "assignedProjects", assignedProjectId);
  try {
    await updateDoc(assignedProjectRef, {
      aiReview: {
        rating: aiReview.rating,
        note: aiReview.note,
        timestamp: serverTimestamp(), // Use serverTimestamp for AI review timestamp
        sourceTextStatus: aiReview.sourceTextStatus || null, // Ensure it's explicitly null if undefined
        sourceStudentProjectStatus: aiReview.sourceStudentProjectStatus || null, // Ensure it's explicitly null if undefined
      },
    });
    console.log("AI review successfully updated for assigned project:", assignedProjectId);
  } catch (error) {
    console.error("Error updating AI review for assigned project:", assignedProjectId, error);
    throw error; // Re-throw to handle upstream
  }
} 