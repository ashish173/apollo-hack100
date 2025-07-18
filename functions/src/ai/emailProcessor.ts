import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { ai } from './ai-instance';
import cors from 'cors';
import { z } from 'genkit';

if (!admin.apps.length) {
  admin.initializeApp();
}

const corsHandler = cors({ origin: true });

// Define input and output schemas for the AI flow
const ProcessEmailInputSchema = z.object({
  conversationContent: z.string(),
  conversationSubject: z.string(),
  interviewerEmail: z.string(),
  candidateEmail: z.string(),
  emailFrom: z.string(),
  emailTo: z.string(),
});

const ProcessEmailOutputSchema = z.object({
  interviewerSlots: z.array(z.string()),
  candidateSlots: z.array(z.string()),
  matchingSlots: z.array(z.string()),
  nextActionTaker: z.enum(['scheduler', 'interviewer', 'candidate', 'human']),
  nextActionMetadata: z.object({
    emailContent: z.string().optional(),
    messageForHuman: z.string().optional(),
  }),
});

type ProcessEmailInput = z.infer<typeof ProcessEmailInputSchema>;

// Define the prompt using Genkit
const processEmailPrompt = ai.definePrompt({
  name: 'processEmailPrompt',
  input: { schema: ProcessEmailInputSchema },
  output: { schema: ProcessEmailOutputSchema },
  prompt: `You are an intelligent email processor and a meeting scheduler for interview scheduling. Analyze the following email conversation and extract time slot information.

Context:
- Interviewer Email: {{{interviewerEmail}}}
- Candidate Email: {{{candidateEmail}}}
- Recruiter email: {{{recruiterEmail}}}
- Email From: {{{emailFrom}}}
- Email To: {{{emailTo}}}
- Subject: {{{conversationSubject}}}
- Content: {{{conversationContent}}}

For reference:
- Interviewer Email: {{{interviewerEmail}}}
- Candidate Email: {{{candidateEmail}}}
- Recruiter Email: {{{recruiterEmail}}}

Your task:
1. Identify if this email contains time slot information from either the interviewer or candidate.
2. Extract any mentioned time slots.
3. Determine the next action needed.
4. Determine who will be the next action taker.

Please respond in the following JSON format:
{
  "interviewerSlots": ["array of time slots mentioned by interviewer"],
  "candidateSlots": ["array of time slots mentioned by candidate"],
  "matchingSlots": ["array of matching time slots if any"],
  "nextActionTaker": "scheduler|interviewer|candidate|human",
  "nextActionMetadata": {
    "emailContent": "Generate a clear, professional email to the next action taker (interviewer or candidate) if needed.
                    - When generating an email, always greet the recipient with their role (for eg:- Candidate or Interviewer), a clear body with line breaks, and a polite sign-off.
                    - Never mention a 'scheduler' in the email content or sign-off. The sign-off should always be the recruiter's name, or 'Recruiter Team'.
                    - If writing to the interviewer, summarize the candidate’s available slots. 
                    - If writing to the candidate, summarize the interviewer’s available slots. If no overlap, ask the candidate to suggest new times. 
                    - Leave this field empty if the next action taker is 'human' or 'scheduler'. 
                    - Format the email, the email should be ready to send to the next Action taker, polite, and easy to understand.
                    - Use plain text or simple HTML for formatting (e.g.,<p>for paragraph or <br> for line breaks if HTML is supported).
                    - Always mention time slots in ISO 8601 format or as a clear, human-readable format (e.g., 'Saturday, July 19, 2025 at 5:00 PM') and never use vague terms like 'tomorrow' or 'next week'.
                    - For any time slot mentioned in relative terms (e.g., 'tomorrow 5 pm', 'next Monday', 'day after tomorrow', 'next week'), resolve it to an absolute date and time using the timestamp at the start of the message as the reference point. 
                    - Output all slots in ISO 8601 format. The timestamp for each message is provided in the conversation history in square brackets before the sender.",
    "messageForHuman": "message for human intervention if needed"
  }
}

Rules:
- If both interviewer and candidate have provided slots and there is at least one matching slot, set nextActionTaker to "scheduler" and nextStep to "confirmation_of_event".
- If only the candidate has provided slots, set nextActionTaker to "interviewer" and nextStep to "email_to_interviewer".
- If only the interviewer has provided slots, set nextActionTaker to "candidate" and nextStep to "email_to_candidate".
- If both interviewer and candidate have provided slots but there is no overlap, set nextActionTaker to "candidate" and nextStep to "email_to_candidate". In the emailContent, include the interviewer's available slots and ask the candidate to suggest new times that overlap.
- If the situation is unclear or complex, set nextActionTaker to "human" and nextStep to "human_intervention_needed".
- Time slots should be in ISO format or clear date/time format. Only include relevant email content in the metadata fields.
- Identify implicit confirmations of time slots(eg:- "yes i am available", "this works for me." etc)
  Always follow the above rules strictly and do not guess. The emailContent should be a complete, ready-to-send email, not instructions.
`,
});

// Define the flow using Genkit
const processEmailFlow = ai.defineFlow<
  typeof ProcessEmailInputSchema,
  typeof ProcessEmailOutputSchema
>({
  name: 'processEmailFlow',
  inputSchema: ProcessEmailInputSchema,
  outputSchema: ProcessEmailOutputSchema,
}, async (input) => {
  const { output } = await processEmailPrompt(input);
  return output!;
});

interface ProcessEmailRequest {
  conversationId: string;
  interviewId: string;
  messageId: string;
}

const SEND_GMAIL_EMAIL_URL =
  process.env.SEND_GMAIL_EMAIL_URL ||
  'https://sendgmailemail-fvtj5v3sya-uc.a.run.app';

async function sendEmailViaFunction(emailData: any) {
  const response = await fetch(SEND_GMAIL_EMAIL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emailData),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }
  return response.json();
}

async function handleNextStepActions({
  aiResponse,
  nextStep,
  interviewId,
  conversationId,
  messageId,
  recruiterEmail,
  recruiterName,
  interviewData,
  conversationData,
  admin
}: {
  aiResponse: any,
  nextStep: string,
  interviewId: string,
  conversationId: string,
  messageId: string,
  recruiterEmail: string,
  recruiterName: string,
  interviewData: any,
  conversationData: any,
  admin: typeof import('firebase-admin')
}) {
  const interviewRef = admin.firestore().collection('interviews').doc(interviewId);
  const recruiterUid = interviewData.created_by; // Assumes recruiter UID is stored as created_by

  switch (nextStep) {
    case 'email_to_candidate': {
      // Send email to candidate
      await sendEmailViaFunction({
        to: interviewData.candidateEmail,
        from: recruiterEmail,
        subject: conversationData.subject,
        html: aiResponse.nextActionMetadata.emailContent,
        uid: recruiterUid
      });
      // Add new Conversation document for outgoing email
      await admin.firestore().collection('conversations').add({
        interview_id: interviewId,
        // For outgoing messages, generate a new message_id using timestamp
        message_id: `outgoing_${Date.now()}`,
        to: interviewData.candidateEmail,
        from: recruiterEmail,
        subject: conversationData.subject,
        content: aiResponse.nextActionMetadata.emailContent,
        processState: true, // Mark as processed
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      // Update Interview document status
      await interviewRef.update({ status: 'email_to_candidate' });
      break;
    }
    case 'email_to_interviewer': {
      // Send email to interviewer
      await sendEmailViaFunction({
        to: interviewData.interviewerEmail,
        from: recruiterEmail,
        subject: conversationData.subject,
        html: aiResponse.nextActionMetadata.emailContent,
        uid: recruiterUid
      });
      // Add new Conversation document for outgoing email
      await admin.firestore().collection('conversations').add({
        interview_id: interviewId,
        // For outgoing messages, generate a new message_id using timestamp
        message_id: `outgoing_${Date.now()}`,
        to: interviewData.interviewerEmail,
        from: recruiterEmail,
        subject: conversationData.subject,
        content: aiResponse.nextActionMetadata.emailContent,
        processState: true, // Mark as processed
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      // Update Interview document status
      await interviewRef.update({ status: 'email_to_interviewer' });
      break;
    }
    case 'human_intervention_needed': {
      // Update Interview document status to failed
      await interviewRef.update({ status: 'failed' });
      break;
    }
    case 'confirmation_of_event': {
      // Update Interview document with meeting time (first matching slot)
      const meetingTime = aiResponse.matchingSlots && aiResponse.matchingSlots.length > 0 ? aiResponse.matchingSlots[0] : null;
      if (meetingTime) {
        await interviewRef.update({ meetingTime: { timeStamp: meetingTime }, status: 'Scheduled' });
        // Placeholder: schedule calendar event and update Interview with event details
        // await scheduleCalendarEvent({ ... });
      }
      break;
    }
    default:
      // No action
      break;
  }
}

export const processEmailWithAI = onRequest({ region: 'us-central1' }, (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const { conversationId, interviewId, messageId }: ProcessEmailRequest = req.body;

      if (!conversationId || !interviewId || !messageId) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameters: conversationId, interviewId, messageId'
        });
        return;
      }

      // Get conversation document
      const conversationDoc = await admin.firestore()
        .collection('conversations')
        .doc(conversationId)
        .get();

      if (!conversationDoc.exists) {
        res.status(404).json({
          success: false,
          error: 'Conversation not found'
        });
        return;
      }

      const conversationData = conversationDoc.data()!;
      
      // Check if already processed
      if (conversationData.processState === true) {
        res.status(200).json({
          success: true,
          message: 'Conversation already processed'
        });
        return;
      }

      // Get interview document
      const interviewDoc = await admin.firestore()
        .collection('interviews')
        .doc(interviewId)
        .get();

      if (!interviewDoc.exists) {
        res.status(404).json({
          success: false,
          error: 'Interview not found'
        });
        return;
      }

      const interviewData = interviewDoc.data()!;

      // Define a type for conversation messages
      type ConversationMessage = {
        from: string;
        to: string;
        content: string;
        createdAt: FirebaseFirestore.Timestamp;
        [key: string]: any;
      };

      // Fetch all conversation docs for the interview (no order)
      const conversationSnapshot = await admin.firestore()
        .collection('conversations')
        .where('interview_id', '==', interviewId)
        .get();

      // Load them into an array
      const messages: ConversationMessage[] = [];
      conversationSnapshot.forEach(doc => messages.push(doc.data() as ConversationMessage));

      // Sort the array in memory by createdAt
      messages.sort((a, b) => {
        // If createdAt is a Firestore Timestamp
        return a.createdAt.seconds - b.createdAt.seconds;
        // Or, if using Date objects:
        // return a.createdAt.toDate() - b.createdAt.toDate();
      });

      // Build the full conversation string
      let fullConversation = '';
      messages.forEach(data => {
        const sender = data.from === interviewData.candidateEmail ? 'Candidate' :
                       data.from === interviewData.interviewerEmail ? 'Interviewer' : data.from;
        const timestamp = data.createdAt?.toDate().toISOString() || '';
        fullConversation += `[${timestamp}] ${sender} (${data.from}): ${data.content}\n`;
      });

      // Use fullConversation as the context for the AI
      const context: ProcessEmailInput = {
        conversationContent: fullConversation,
        conversationSubject: conversationData.subject,
        interviewerEmail: interviewData.interviewerEmail,
        candidateEmail: interviewData.candidateEmail,
        emailFrom: conversationData.from,
        emailTo: conversationData.to,
      };

      // Process with AI using the flow
      const aiResponse = await processEmailFlow(context);

      // Determine next step based on matchingSlots and nextActionTaker
      let nextStep: string;
      if (aiResponse.matchingSlots && aiResponse.matchingSlots.length > 0) {
        nextStep = 'confirmation_of_event';
      } else {
        switch (aiResponse.nextActionTaker) {
          case 'interviewer':
            nextStep = 'email_to_interviewer';
            break;
          case 'candidate':
            nextStep = 'email_to_candidate';
            break;
          case 'human':
          default:
            nextStep = 'human_intervention_needed';
            break;
        }
      }

      // Save AI response
      const aiRequestSnapshot = await admin.firestore()
        .collection('aiRequests')
        .where('conversation_id', '==', conversationId)
        .limit(1)
        .get();

      if (!aiRequestSnapshot.empty) {
        const aiRequestDoc = aiRequestSnapshot.docs[0];
        await aiRequestDoc.ref.update({
          nextStep: nextStep,
          output: aiResponse,
          status: 'completed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // Optionally handle the case where the document does not exist
        // For now, log a warning
        console.warn(`No aiRequests document found for conversation_id: ${conversationId}`);
      }

      // Update conversation as processed
      await admin.firestore()
        .collection('conversations')
        .doc(conversationId)
        .update({
          processState: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      // --- Call the new handler for next step actions ---
      await handleNextStepActions({
        aiResponse,
        nextStep,
        interviewId,
        conversationId,
        messageId,
        recruiterEmail: interviewData.recruiterEmail || 'recruiter@example.com', // fallback
        recruiterName: interviewData.recruiterName || 'Recruiter', // fallback
        interviewData,
        conversationData,
        admin
      });

      res.status(200).json({
        success: true,
        aiRequestId: aiRequestSnapshot.docs[0]?.id || 'N/A', // Use the ID of the updated document
        nextStep: nextStep,
        response: aiResponse
      });

    } catch (error: any) {
      console.error('AI Email processing error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process email with AI'
      });
    }
  });
}); 