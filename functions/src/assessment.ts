import * as functions from 'firebase-functions';
import *dministrator from 'firebase-admin';

// Initialize Firebase Admin SDK
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

const TEMPLATE_ID = 'main_template'; // Using a fixed ID for the single template

// --- Callable Function: getAssessmentTemplate ---
// Fetches the main assessment template.
export const getAssessmentTemplate = functions.https.onCall(async (data, context) => {
    // No auth check needed as templates are public to logged-in users
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to view templates.');
    }

    try {
        const templateDoc = await db.collection('personalityAssessmentTemplates').doc(TEMPLATE_ID).get();
        if (!templateDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Assessment template not found.');
        }
        return templateDoc.data();
    } catch (error) {
        console.error("Error fetching assessment template:", error);
        throw new functions.https.HttpsError('internal', 'Could not fetch assessment template.');
    }
});

// --- Callable Function: updateAssessmentTemplate ---
// Updates the main assessment template. Only callable by the teacher who owns it.
export const updateAssessmentTemplate = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to update the template.');
    }

    const { section1Questions, goalQuestions, section2FixedQuestions } = data;
    const teacherId = context.auth.uid;

    try {
        const templateRef = db.collection('personalityAssessmentTemplates').doc(TEMPLATE_ID);
        const templateDoc = await templateRef.get();

        // Security Check: If template exists, only the owner can update it.
        // If it doesn't exist, anyone can create it and becomes the owner.
        if (templateDoc.exists && templateDoc.data()?.teacherId !== teacherId) {
            throw new functions.https.HttpsError('permission-denied', 'You are not authorized to update this template.');
        }

        await templateRef.set({
            teacherId,
            section1Questions,
            goalQuestions,
            section2FixedQuestions,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true }); // Use merge:true to create or overwrite

        return { success: true, message: 'Template updated successfully.' };

    } catch (error) {
        console.error("Error updating assessment template:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Could not update assessment template.');
    }
});

// --- Callable Function: createOrGetUserAssessment ---
// Gets or creates a user's assessment by snapshotting the latest template.
export const createOrGetUserAssessment = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
    }
    const userId = context.auth.uid;

    try {
        const userAssessmentRef = db.collection('userAssessments').doc(userId);
        const userAssessmentDoc = await userAssessmentRef.get();

        if (userAssessmentDoc.exists) {
            return userAssessmentDoc.data(); // Return existing assessment
        } else {
            // Snapshot the template to create a new assessment
            const templateDoc = await db.collection('personalityAssessmentTemplates').doc(TEMPLATE_ID).get();
            if (!templateDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Assessment template not found. Cannot create assessment.');
            }

            const templateData = templateDoc.data();
            const newAssessment = {
                userId,
                templateVersion: templateDoc.data()?.updatedAt || admin.firestore.FieldValue.serverTimestamp(),
                status: 'in-progress',
                startedAt: admin.firestore.FieldValue.serverTimestamp(),
                answers: {},
                goals: [],
                ...templateData // Copy all question structures
            };

            await userAssessmentRef.set(newAssessment);
            return newAssessment;
        }
    } catch (error) {
        console.error("Error in createOrGetUserAssessment:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Could not get or create user assessment.');
    }
});

// --- Callable Function: saveAssessment ---
// Saves a user's answers and goals to their assessment document.
export const saveAssessment = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
    }
    const userId = context.auth.uid;
    const { answers, goals } = data;

    if (!answers && !goals) {
         throw new functions.https.HttpsError('invalid-argument', 'Must provide answers or goals to save.');
    }

    try {
        const userAssessmentRef = db.collection('userAssessments').doc(userId);

        const updateData = {
            ...(answers && { answers }),
            ...(goals && { goals }),
            lastSaved: admin.firestore.FieldValue.serverTimestamp()
        };

        await userAssessmentRef.update(updateData);
        return { success: true, message: 'Progress saved.' };

    } catch (error) {
        console.error("Error saving assessment:", error);
        throw new functions.https.HttpsError('internal', 'Could not save assessment progress.');
    }
});
