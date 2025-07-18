'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PdfUpload from '@/components/hrportal/PdfUpload';
import PdfViewer from '@/components/hrportal/PdfViewer';
import EmailInput from '@/components/hrportal/EmailInput';

import { sendGmailEmail } from '@/services/gmailService';
import AccountInfo from '@/components/hrportal/AccountInfo';
import { useAuth } from '@/context/auth-context';
import { uploadResumeToStorage, createInterviewDocument, createConversationDocument, updateInterviewStatusToEmailSent } from '@/services/firestoreService';
import { parsePdfForEmail } from '@/services/pdfParserService';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const HrPortalPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [interviewerEmail, setInterviewerEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateEmailError, setCandidateEmailError] = useState<string | null>(null);
  const [pdfParsingLoading, setPdfParsingLoading] = useState(false);
  const [pdfParsingError, setPdfParsingError] = useState<string | null>(null);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [interviewDocId, setInterviewDocId] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<{ docId: string; candidateEmail: string } | null>(null);
  const [emailSendLoading, setEmailSendLoading] = useState(false);
  const [emailSendError, setEmailSendError] = useState<string | null>(null);
  const [emailSendSuccess, setEmailSendSuccess] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [conversationSuccess, setConversationSuccess] = useState(false);
  const [interviewStatusError, setInterviewStatusError] = useState<string | null>(null);
  const [interviewStatusSuccess, setInterviewStatusSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user) {
      const checkGmailConnection = async () => {
        const db = getFirestore();
        const tokenDoc = await getDoc(doc(db, 'gmailTokens', user.uid));
        setGmailConnected(!!(tokenDoc.exists() && tokenDoc.data().refresh_token));
      };
      checkGmailConnection();
    }
  }, [user, loading]);

  if (loading || !user) {
    return null;
  }

  // Remove GIS logic and Gmail checkbox
  // Remove serviceChecked, serviceLoading, serviceError, handleServiceChange, serviceDisabled

  // Compute if upload is allowed - now only needs PDF, interviewer email, and Gmail connection
  const canUpload = pdfFile !== null && interviewerEmail.length > 0 && !emailError && !pdfError && gmailConnected;

  // Handle upload button click
  const handleUploadClick = async () => {
    if (!pdfFile) {
      setPdfError('Please select a PDF file before uploading.');
      setGeneralError(null);
      return;
    }
    setPdfError(null);
    setGeneralError(null);
    setEmailSendError(null);
    setEmailSendSuccess(false);
    setConversationError(null);
    setConversationSuccess(false);
    setInterviewStatusError(null);
    setInterviewStatusSuccess(false);
    setPdfParsingError(null);
    setPdfParsingLoading(false);
    
    try {
      // Step 1: Upload PDF to Firebase Storage
      const url = await uploadResumeToStorage(pdfFile);
      setResumeUrl(url);
      
      // Step 2: Parse PDF to extract candidate email
      setPdfParsingLoading(true);
      const parseResult = await parsePdfForEmail(url, user.uid);
      setPdfParsingLoading(false);
      
      if (!parseResult.success) {
        setPdfParsingError(parseResult.error || 'Failed to extract email from PDF');
        return;
      }
      
      const extractedCandidateEmail = parseResult.candidateEmail!;
      setCandidateEmail(extractedCandidateEmail);
      
      // Step 3: Create Interview document in Firestore
      const status = 'pending';
      const docId = await createInterviewDocument({
        candidateEmail: extractedCandidateEmail,
        interviewerEmail,
        recruiterEmail: user.email || 'noreply@company.com',
        resumeUrl: url,
        status,
        createdBy: user.uid,
      });
      setInterviewDocId(docId);
      setLastSuccess({ docId, candidateEmail: extractedCandidateEmail });
      setGeneralError(null);
      
      // Step 4: Send email to candidate via backend using UID and template
      setEmailSendLoading(true);
      if (!gmailConnected) {
        setEmailSendError('Please connect your Gmail account first.');
        setEmailSendLoading(false);
        return;
      }
      
      // Fix TypeScript error by ensuring user.email is not null
      const senderEmail = user.email || 'noreply@company.com';
      
      const emailResult = await sendGmailEmail({
        to: extractedCandidateEmail,
        from: senderEmail,
        subject: 'Interview Invitation',
        html: `<p>Dear ${extractedCandidateEmail.split('@')[0]},<br/>You are invited to an interview. Please reply with your available time slots.<br/>Best regards,<br/>${user.displayName || senderEmail}</p>`,
        uid: user.uid,
      });
      setEmailSendLoading(false);
      
      if (!emailResult.success) {
        setEmailSendError(emailResult.error?.message || 'Failed to send email.');
      } else {
        setEmailSendSuccess(true);  
        // Create Conversation document in Firestore
        try {
          await createConversationDocument({
            interview_id: docId, // Use Firestore document ID for linking
            message_id: emailResult.messageId || '',
            to: extractedCandidateEmail,
            from: senderEmail, // Use authenticated user's email
            subject: 'Interview Invitation',
            content: `<p>Dear Candidate,<br/>You are invited to an interview. Please reply with your available time slots.<br/>Best regards,<br/>Recruiter</p>`,
            processState: true, // Mark as processed so AI does not reprocess
          });
          setConversationSuccess(true);
          // Update Interview status to 'email_to_candidate'
          try {
            await updateInterviewStatusToEmailSent(docId);
            setInterviewStatusSuccess(true);
          } catch (err: any) {
            setInterviewStatusError(err.message || 'Failed to update Interview status.');
          }
        } catch (err: any) {
          setConversationError(err.message || 'Failed to log conversation in Firestore.');
        }
      }
      
      // Reset form fields for next entry
      setPdfFile(null);
      setCandidateEmail('');
      setCandidateEmailError(null);
      setInterviewerEmail('');
      setEmailError(null);
      setResumeUrl(null);
      setTimeout(() => setInterviewDocId(null), 100); // Hide old success message
    } catch (err: any) {
      if (err.message && err.message.includes('Firebase Storage')) {
        setGeneralError('Failed to upload PDF to storage. Please try again.');
      } else if (err.message && err.message.includes('interview')) {
        setGeneralError('Failed to create interview record. Please try again.');
      } else {
        setPdfError(err.message || 'Failed to process or upload PDF.');
      }
      setInterviewDocId(null);
      setEmailSendLoading(false);
      setPdfParsingLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 480, margin: '2rem auto', padding: '2rem', border: '1px solid #eee', borderRadius: 8, background: '#fff' }}>
      <AccountInfo />
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Interview Initiation</h1>
      <p style={{ color: '#666', fontSize: 14, marginBottom: '1.5rem' }}>
        Upload a candidate's resume PDF and enter the interviewer's email. The system will automatically extract the candidate's email from the PDF and send an interview invitation.
      </p>
      {/* Gmail Connect UI */}
      {!gmailConnected ? (
        <button
          style={{ marginBottom: 16, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '0.5rem 1rem', cursor: 'pointer' }}
          onClick={() => {
            const popup = window.open(
              `https://startgmailauth-fvtj5v3sya-uc.a.run.app?uid=${user.uid}`,
              'gmail-oauth',
              'width=500,height=600'
            );
          }}
        >
          Connect Gmail
        </button>
      ) : (
        <div style={{ marginBottom: 16, color: '#388e3c', fontWeight: 500 }}>✅ Mail access granted</div>
      )}
      {/* Success Message */}
      {lastSuccess && !pdfError && !generalError && (
        <div style={{ background: '#e6f4ea', color: '#256029', border: '1px solid #b7ebc6', borderRadius: 4, padding: '1rem', marginBottom: '1.5rem', fontWeight: 500 }}>
          Interview created successfully! (ID: {lastSuccess.docId})<br />
          Candidate: {lastSuccess.candidateEmail}
          {pdfParsingLoading && <div style={{ color: '#1976d2', marginTop: 8 }}>Extracting email from PDF...</div>}
          {pdfParsingError && <div style={{ color: '#d32f2f', marginTop: 8 }}>PDF parsing error: {pdfParsingError}</div>}
          {emailSendLoading && <div style={{ color: '#1976d2', marginTop: 8 }}>Sending interview email...</div>}
          {emailSendSuccess && <div style={{ color: '#388e3c', marginTop: 8 }}>Interview email sent to candidate!</div>}
          {emailSendError && <div style={{ color: '#d32f2f', marginTop: 8 }}>Email error: {emailSendError}</div>}
          {conversationSuccess && <div style={{ color: '#388e3c', marginTop: 8 }}>Conversation logged in Firestore!</div>}
          {conversationError && <div style={{ color: '#d32f2f', marginTop: 8 }}>Conversation error: {conversationError}</div>}
          {interviewStatusSuccess && <div style={{ color: '#388e3c', marginTop: 8 }}>Interview status updated to "email_to_candidate"!</div>}
          {interviewStatusError && <div style={{ color: '#d32f2f', marginTop: 8 }}>Interview status error: {interviewStatusError}</div>}
        </div>
      )}
      {/* General Error Message */}
      {generalError && (
        <div style={{ background: '#fdecea', color: '#b71c1c', border: '1px solid #f5c6cb', borderRadius: 4, padding: '1rem', marginBottom: '1.5rem', fontWeight: 500 }}>
          {generalError}
        </div>
      )}
      {/* PDF Upload Section */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5rem' }}>Upload Resume (PDF)</h2>
        <div style={{ border: '1px dashed #bbb', padding: '1rem', borderRadius: 4, background: '#fafafa' }}>
          <PdfUpload onFileSelect={file => { setPdfFile(file); setPdfError(null); }} />
          {pdfFile === null ? (
            <p style={{ color: '#888', marginTop: 8 }}>No PDF selected</p>
          ) : (
            <p style={{ color: '#4caf50', marginTop: 8 }}>{pdfFile.name} selected</p>
          )}
          <PdfViewer file={pdfFile} />
          {pdfError && (
            <p style={{ color: '#d32f2f', fontSize: 14, marginTop: 4 }}>{pdfError}</p>
          )}
        </div>
      </section>
      {/* Candidate Email Display Section */}
      {candidateEmail && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5rem' }}>Extracted Candidate Email</h2>
          <div style={{ border: '1px solid #4caf50', padding: '1rem', borderRadius: 4, background: '#f1f8e9' }}>
            <p style={{ color: '#2e7d32', fontWeight: 500, margin: 0 }}>
              📧 {candidateEmail}
            </p>
            <p style={{ color: '#666', fontSize: 12, marginTop: 4, marginBottom: 0 }}>
              Email automatically extracted from the uploaded PDF
            </p>
          </div>
        </section>
      )}
      {/* Interviewer Email Section */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5rem' }}>Interviewer Email</h2>
        <div style={{ border: '1px dashed #bbb', padding: '1rem', borderRadius: 4, background: '#fafafa' }}>
          <EmailInput
            value={interviewerEmail}
            onChange={e => setInterviewerEmail(e.target.value)}
            onError={setEmailError}
          />
          {emailError && interviewerEmail.length > 0 && (
            <p style={{ color: '#d32f2f', fontSize: 14, marginTop: 4 }}>{emailError}</p>
          )}
          <button
            type="button"
            disabled={!canUpload}
            style={{
              marginTop: 16,
              padding: '0.75rem 1.5rem',
              borderRadius: 4,
              border: 'none',
              background: canUpload ? '#1976d2' : '#ccc',
              color: '#fff',
              fontWeight: 600,
              fontSize: 16,
              cursor: canUpload ? 'pointer' : 'not-allowed',
              width: '100%'
            }}
            onClick={handleUploadClick}
          >
            {pdfParsingLoading ? 'Processing PDF...' : 'Upload & Process'}
          </button>
        </div>
      </section>
      {/* Google Service Permissions Section */}
      <section>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5rem' }}>Google Service Permissions</h2>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>
          For your privacy and security, Google may ask you to grant access each time you use these features. You will see a popup requesting permission when you check a box below.
        </p>
        <div style={{ border: '1px dashed #bbb', padding: '1rem', borderRadius: 4, background: '#fafafa' }}>
          {/* Removed GoogleServiceCheckboxes */}
          <div style={{ marginTop: 12 }}>
            {/* Removed GIS service display */}
          </div>
        </div>
      </section>
    </main>
  );
};

export default HrPortalPage; 