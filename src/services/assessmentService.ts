import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase'; // Ensure you have a Firebase app instance exported from here

const functions = getFunctions(app);

// --- Admin Functions ---

/**
 * Fetches the current assessment template from the backend.
 */
export const getAssessmentTemplate = httpsCallable(functions, 'getAssessmentTemplate');

/**
 * Updates the assessment template.
 * @param data - An object containing the question structures.
 *  { section1Questions, goalQuestions, section2FixedQuestions }
 */
export const updateAssessmentTemplate = httpsCallable(functions, 'updateAssessmentTemplate');


// --- Student Functions ---

/**
 * Fetches the user's current assessment.
 * If one doesn't exist, it creates a new one by snapshotting the template.
 */
export const createOrGetUserAssessment = httpsCallable(functions, 'createOrGetUserAssessment');

/**
 * Saves the user's assessment progress.
 * @param data - An object containing answers and/or goals.
 * { answers, goals }
 */
export const saveAssessment = httpsCallable(functions, 'saveAssessment');
