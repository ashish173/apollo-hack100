'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check, Download, RefreshCw } from 'lucide-react';
import { AssessmentReport } from '@/components/student/AssessmentReport';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from '@/components/ui/use-toast';

const MAX_GOALS = 8;
const TEMPLATE_ID = 'main_template';

export default function StudentAssessmentPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [goals, setGoals] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [view, setView] = useState<'assessment' | 'report'>('assessment');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // --- Data Fetching and Snapshotting Logic ---
  useEffect(() => {
    if (user) {
      const userAssessmentRef = doc(db, 'userAssessments', user.uid);
      getDoc(userAssessmentRef).then(docSnap => {
        if (docSnap.exists()) {
          // User has an existing assessment
          const data = docSnap.data();
          setAssessmentData(data);
          setAnswers(data.answers || {});
          setGoals(data.goals && data.goals.length > 0 ? data.goals : ['']);
          setIsLoading(false);
        } else {
          // New user, snapshot the template
          const templateRef = doc(db, 'personalityAssessmentTemplates', TEMPLATE_ID);
          getDoc(templateRef).then(templateSnap => {
            if (templateSnap.exists()) {
              const templateData = templateSnap.data();
              const newAssessment = {
                userId: user.uid,
                templateVersion: templateSnap.data()?.updatedAt || serverTimestamp(),
                status: 'in-progress',
                startedAt: serverTimestamp(),
                answers: {},
                goals: [''],
                section1Questions: templateData.section1Questions || [],
                goalQuestions: templateData.goalQuestions || [],
                section2FixedQuestions: templateData.section2FixedQuestions || [],
              };
              setDoc(userAssessmentRef, newAssessment).then(() => {
                setAssessmentData(newAssessment);
                setAnswers(newAssessment.answers);
                setGoals(newAssessment.goals);
                setIsLoading(false);
              });
            } else {
              toast({ title: "Error", description: "Could not find assessment template.", variant: "destructive" });
              setIsLoading(false);
            }
          });
        }
      }).catch(err => {
        console.error(err);
        toast({ title: "Error", description: "Could not load your assessment.", variant: "destructive" });
        setIsLoading(false);
      });
    }
  }, [user, toast]);

  // --- Auto-saving Logic ---
  useEffect(() => {
    if (isLoading || !assessmentData) return;

    const interval = setInterval(() => {
      setIsSaving(true);
      const userAssessmentRef = doc(db, 'userAssessments', user.uid);
      updateDoc(userAssessmentRef, {
        answers,
        goals,
        lastSaved: serverTimestamp()
      }).then(() => {
        console.log("Progress auto-saved.");
        setIsSaving(false);
      }).catch(err => {
        console.error("Auto-save failed:", err);
        setIsSaving(false);
      });
    }, 5000); // Auto-save every 5 seconds

    return () => clearInterval(interval);
  }, [answers, goals, user, isLoading, assessmentData]);


  // --- Dynamic Sections Logic ---
  const assessmentSections = useMemo(() => {
    if (!assessmentData) return [];

    const definedGoals = goals.filter(g => g.trim() !== '');
    const goalSections = definedGoals.map((goal, index) => ({
        id: `goal_${index + 1}`,
        title: `Goal ${index + 1}`,
        isGoalSection: true,
        goal,
        questions: assessmentData.goalQuestions
    }));

    const baseSections = [
        { id: 's1', title: 'Section 1', questions: assessmentData.section1Questions },
        { id: 's2_goals', title: 'Goal Setting' },
        ...goalSections,
        { id: 's2_fixed', title: 'Section 2', questions: assessmentData.section2FixedQuestions }
    ];

    return baseSections.filter(s => (s.questions && s.questions.length > 0) || s.id === 's2_goals');
  }, [assessmentData, goals]);

  if (authLoading || isLoading) {
    return <div className="flex h-screen items-center justify-center"><LoadingSpinner size="xl" label="Loading Your Assessment..." /></div>;
  }

  if (!user) {
    return <p className="text-center mt-10">You must be logged in to take the assessment.</p>;
  }

  if (!assessmentData) {
     return <p className="text-center mt-10">Could not load assessment data. Please try again later.</p>;
  }

  const totalSections = assessmentSections.length;
  const progressPercentage = totalSections > 0 ? ((currentSectionIndex + 1) / totalSections) * 100 : 0;
  const currentSection = assessmentSections[currentSectionIndex];

  const handleNext = () => {
    if (currentSectionIndex < totalSections - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  const handleGoToSection = (index: number) => {
    setCurrentSectionIndex(index);
  };

  const handleGoalChange = (index: number, value: string) => {
    const newGoals = [...goals];
    newGoals[index] = value;
    setGoals(newGoals);
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({...prev, [questionId]: value}));
  }

  const addGoal = () => {
    if (goals.length < MAX_GOALS) {
        setGoals([...goals, '']);
    }
  };

  const handleFinish = () => {
    const userAssessmentRef = doc(db, 'userAssessments', user.uid);
    updateDoc(userAssessmentRef, { status: 'completed', completedAt: serverTimestamp() });
    setView('report');
  }

  const generatePdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);

    const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('assessment-report.pdf');
    setIsGeneratingPdf(false);
  };

  if (view === 'report') {
    const reportData = {
        section1: {
            title: "Section 1",
            questions: assessmentData.section1Questions.map((q:any) => ({...q, answer: answers[q.id] || ''}))
        },
        goalSections: assessmentSections.filter(s => s.isGoalSection).map((s:any) => ({
            ...s,
            questions: s.questions.map((q:any) => ({...q, answer: answers[`${s.id}_${q.id}`] || ''}))
        })),
        section2Fixed: {
            title: "Section 2",
            questions: assessmentData.section2FixedQuestions.map((q:any) => ({...q, answer: answers[q.id] || ''}))
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-3xl">Your Assessment Report</CardTitle>
                        <CardDescription>This is a summary of your responses. You can download it as a PDF.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                         <Button variant="outline" onClick={() => setView('assessment')}>
                            <RefreshCw className="mr-2 h-4 w-4"/> Back to Assessment
                        </Button>
                        <Button onClick={generatePdf} disabled={isGeneratingPdf}>
                            {isGeneratingPdf ? <LoadingSpinner /> : <><Download className="mr-2 h-4 w-4"/> Download PDF</>}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px' }}>
                        <div ref={reportRef}>
                            <AssessmentReport reportData={reportData} />
                        </div>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                         <AssessmentReport reportData={reportData} />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Personality & Goals Assessment</CardTitle>
          <CardDescription>
            {isSaving ? 'Saving...' : 'Complete all sections to generate your report.'}
          </CardDescription>

          <div className="pt-4">
            <Progress value={progressPercentage} className="mb-2"/>
            <div className="flex flex-wrap gap-2">
              {assessmentSections.map((section, index) => (
                <Button
                  key={section.id}
                  variant={index === currentSectionIndex ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleGoToSection(index)}
                  className="text-xs sm:text-sm"
                >
                  {section.title}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <h2 className="text-2xl font-bold mb-6">{currentSection.title}</h2>

          {currentSection.id === 's2_goals' && (
            <div>
              <p className="mb-4 text-muted-foreground">Define up to {MAX_GOALS} personal or professional goals you want to work on.</p>
              <div className="space-y-4">
                {goals.map((goal, index) => (
                    <Input
                        key={index}
                        value={goal}
                        onChange={(e) => handleGoalChange(index, e.target.value)}
                        placeholder={`Goal ${index + 1}`}
                        className="text-lg"
                    />
                ))}
              </div>
              {goals.length < MAX_GOALS && (
                 <Button onClick={addGoal} variant="link" className="mt-2">Add another goal</Button>
              )}
            </div>
          )}

          {currentSection.questions && currentSection.questions.map((q: any) => (
            <div key={q.id} className="mb-8">
              <label className="block text-lg font-semibold mb-2">{q.title}</label>
              <p className="text-sm text-muted-foreground mb-3">{q.helpText}</p>
              <Textarea
                rows={5}
                placeholder="Your answer..."
                className="text-base"
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
              />
            </div>
          ))}

            {currentSection.isGoalSection && (
              <div>
                <p className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
                    Your Goal: <span className="font-bold">{currentSection.goal}</span>
                </p>
                {currentSection.questions.map((q: any) => (
                    <div key={q.id} className="mb-8">
                        <label className="block text-lg font-semibold mb-2">{q.title}</label>
                        <p className="text-sm text-muted-foreground mb-3">{q.helpText}</p>
                        <Textarea
                            rows={3}
                            placeholder="Your answer for this goal..."
                            className="text-base"
                            value={answers[`${currentSection.id}_${q.id}`] || ''}
                            onChange={(e) => handleAnswerChange(`${currentSection.id}_${q.id}`, e.target.value)}
                        />
                    </div>
                ))}
              </div>
            )}

        </CardContent>

        <div className="p-6 bg-muted/50 flex justify-between items-center rounded-b-lg">
            <Button variant="outline" onClick={handlePrev} disabled={currentSectionIndex === 0}>
                <ChevronLeft className="mr-2 h-4 w-4"/> Previous
            </Button>
            <p className="text-sm text-muted-foreground">Section {currentSectionIndex + 1} of {totalSections}</p>
            {currentSectionIndex === totalSections - 1 ? (
                <Button variant="success" onClick={handleFinish}>
                    <Check className="mr-2 h-4 w-4"/> Finish & View Report
                </Button>
            ) : (
                <Button onClick={handleNext}>
                    Next <ChevronRight className="ml-2 h-4 w-4"/>
                </Button>
            )}
        </div>
      </Card>
    </div>
  );
}
