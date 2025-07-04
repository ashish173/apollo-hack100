'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PdfUpload from '@/components/hrportal/PdfUpload';
import PdfViewer from '@/components/hrportal/PdfViewer';
import EmailInput from '@/components/hrportal/EmailInput';
import GoogleServiceCheckboxes, { GoogleService } from '@/components/hrportal/GoogleServiceCheckboxes';
import { requestGoogleServiceAuth, checkGoogleServiceAuth } from '@/lib/googleAuth';
import AccountInfo from '@/components/hrportal/AccountInfo';
import { useAuth } from '@/context/auth-context';
import { uploadResumeToStorage, createInterviewDocument } from '@/services/firestoreService';

const HrPortalPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [interviewerEmail, setInterviewerEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateEmailError, setCandidateEmailError] = useState<string | null>(null);
  const [serviceChecked, setServiceChecked] = useState<Record<GoogleService, boolean>>({
    gmail: false,
    calendar: false,
    meet: false,
  });
  const [serviceLoading, setServiceLoading] = useState<Record<GoogleService, boolean>>({
    gmail: false,
    calendar: false,
    meet: false,
  });
  const [serviceError, setServiceError] = useState<Record<GoogleService, string | null>>({
    gmail: null,
    calendar: null,
    meet: null,
  });
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [interviewDocId, setInterviewDocId] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<{ docId: string; candidateEmail: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Remove the useEffect that does the silent check

  if (loading || !user) {
    return null;
  }

  const handleServiceChange = async (service: GoogleService, checked: boolean) => {
    if (checked && !serviceChecked[service]) {
      setServiceLoading(prev => ({ ...prev, [service]: true }));
      setServiceError(prev => ({ ...prev, [service]: null }));
      const granted = await requestGoogleServiceAuth(service);
      setServiceLoading(prev => ({ ...prev, [service]: false }));
      if (granted) {
        setServiceChecked(prev => ({ ...prev, [service]: true }));
        setServiceError(prev => ({ ...prev, [service]: null }));
      } else {
        setServiceChecked(prev => ({ ...prev, [service]: false }));
        setServiceError(prev => ({ ...prev, [service]: 'Permission denied' }));
      }
    }
    // Do nothing if trying to uncheck a granted permission
  };

  const serviceDisabled: Record<GoogleService, boolean> = {
    gmail: serviceChecked.gmail,
    calendar: serviceChecked.calendar,
    meet: serviceChecked.meet,
  };

  // Compute if upload is allowed
  const canUpload = pdfFile !== null && interviewerEmail.length > 0 && !emailError && candidateEmail.length > 0 && !candidateEmailError && !pdfError;

  // Handle upload button click
  const handleUploadClick = async () => {
    if (!pdfFile) {
      setPdfError('Please select a PDF file before uploading.');
      setGeneralError(null);
      return;
    }
    setPdfError(null);
    setGeneralError(null);
    try {
      // Use candidateEmail from input
      // Upload PDF to Firebase Storage
      const url = await uploadResumeToStorage(pdfFile);
      setResumeUrl(url);
      // Create Interview document in Firestore
      const status = 'pending';
      const interviewId = `interview_${Date.now()}`;
      const docId = await createInterviewDocument({
        candidateEmail,
        interviewerEmail,
        resumeUrl: url,
        status,
        interviewId,
      });
      setInterviewDocId(docId);
      setLastSuccess({ docId, candidateEmail });
      setGeneralError(null);
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
    }
  };

  return (
    <main style={{ maxWidth: 480, margin: '2rem auto', padding: '2rem', border: '1px solid #eee', borderRadius: 8, background: '#fff' }}>
      <AccountInfo />
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Interview Initiation</h1>
      {/* Success Message */}
      {lastSuccess && !pdfError && !generalError && (
        <div style={{ background: '#e6f4ea', color: '#256029', border: '1px solid #b7ebc6', borderRadius: 4, padding: '1rem', marginBottom: '1.5rem', fontWeight: 500 }}>
          Interview created successfully! (ID: {lastSuccess.docId})<br />
          Candidate: {lastSuccess.candidateEmail}
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
      {/* Candidate Email Section */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5rem' }}>Candidate Email</h2>
        <div style={{ border: '1px dashed #bbb', padding: '1rem', borderRadius: 4, background: '#fafafa' }}>
          <EmailInput
            value={candidateEmail}
            onChange={e => setCandidateEmail(e.target.value)}
            onError={setCandidateEmailError}
            label="Enter candidate email"
            placeholder="candidate@example.com"
          />
          {candidateEmailError && candidateEmail.length > 0 && (
            <p style={{ color: '#d32f2f', fontSize: 14, marginTop: 4 }}>{candidateEmailError}</p>
          )}
        </div>
      </section>
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
            Upload
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
          <GoogleServiceCheckboxes checked={serviceChecked} onChange={handleServiceChange} disabled={serviceDisabled} />
          <div style={{ marginTop: 12 }}>
            {(['gmail', 'calendar', 'meet'] as GoogleService[]).map(service => (
              <div key={service}>
                {serviceLoading[service] && <span style={{ color: '#888', fontSize: 14 }}>Requesting {service} permission...</span>}
                {serviceError[service] && <span style={{ color: '#d32f2f', fontSize: 14 }}>{serviceError[service]}</span>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default HrPortalPage; 