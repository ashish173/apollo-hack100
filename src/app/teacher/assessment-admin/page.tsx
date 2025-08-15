'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/use-toast';

const TEMPLATE_ID = 'main_template';

interface Question {
  id: string;
  title: string;
  helpText: string;
}

export default function AssessmentAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [section1Questions, setSection1Questions] = useState<Question[]>([]);
  const [section2FixedQuestions, setSection2FixedQuestions] = useState<Question[]>([]);
  const [goalQuestions, setGoalQuestions] = useState<Question[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const templateRef = doc(db, 'personalityAssessmentTemplates', TEMPLATE_ID);
      getDoc(templateRef)
        .then(docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setSection1Questions(data.section1Questions || []);
            setGoalQuestions(data.goalQuestions || []);
            setSection2FixedQuestions(data.section2FixedQuestions || []);
          } else {
             setError('No template found. Saving will create a new one.');
          }
        })
        .catch(err => {
          console.error(err);
          setError('Failed to load assessment template.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [user]);

  const handleSaveChanges = async () => {
    if(!user) {
        toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    try {
      const templateRef = doc(db, 'personalityAssessmentTemplates', TEMPLATE_ID);
      await setDoc(templateRef, {
        teacherId: user.uid, // Set ownership
        section1Questions,
        goalQuestions,
        section2FixedQuestions,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      toast({
        title: "Success!",
        description: "The assessment template has been saved.",
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to save the template. Check permissions.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuestionChange = (section: 's1' | 's2' | 'goal', index: number, field: 'title' | 'helpText', value: string) => {
    const updater = (setter: React.Dispatch<React.SetStateAction<Question[]>>) => {
      setter(prev => {
        const newQuestions = [...prev];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        return newQuestions;
      });
    };
    if (section === 's1') updater(setSection1Questions);
    else if (section === 's2') updater(setSection2FixedQuestions);
    else if (section === 'goal') updater(setGoalQuestions);
  };

  const addQuestion = (section: 's1' | 's2') => {
    const newQuestion: Question = { id: `new_${Date.now()}`, title: '', helpText: '' };
    const updater = (setter: React.Dispatch<React.SetStateAction<Question[]>>) => {
        setter(prev => [...prev, newQuestion]);
    }
    if (section === 's1') updater(setSection1Questions);
    else if (section === 's2') updater(setSection2FixedQuestions);
  }

  const deleteQuestion = (section: 's1' | 's2', index: number) => {
     const updater = (setter: React.Dispatch<React.SetStateAction<Question[]>>) => {
        setter(prev => prev.filter((_, i) => i !== index));
    }
    if (section === 's1') updater(setSection1Questions);
    else if (section === 's2') updater(setSection2FixedQuestions);
  }

  if (authLoading || isLoading) {
    return <div className="flex h-screen items-center justify-center"><LoadingSpinner size="xl" label="Loading Template..."/></div>;
  }

  if (!user) {
    return <p>You must be logged in to view this page.</p>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Personality Assessment Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Here you can define the questions for the personality assessment. Changes will apply to new assessments.
          </p>
           {error && <p className="text-yellow-600 mt-4">{error}</p>}
        </CardContent>
      </Card>

      {/* Section 1 Questions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Section 1: Fixed Questions</CardTitle>
        </CardHeader>
        <CardContent>
          {section1Questions.map((q, index) => (
            <div key={q.id} className="mb-4 p-4 border rounded-lg relative">
              <Input
                placeholder="Question Title"
                value={q.title}
                onChange={(e) => handleQuestionChange('s1', index, 'title', e.target.value)}
                className="mb-2 font-bold"
              />
              <Textarea
                placeholder="Help Text"
                value={q.helpText}
                onChange={(e) => handleQuestionChange('s1', index, 'helpText', e.target.value)}
              />
               <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => deleteQuestion('s1', index)}>
                <Trash2 className="h-4 w-4 text-red-500"/>
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={() => addQuestion('s1')}><Plus className="mr-2 h-4 w-4" /> Add Question</Button>
        </CardContent>
      </Card>

      {/* Section 2 Goal Questions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Section 2: Goal-Based Questions</CardTitle>
          <p className="text-sm text-muted-foreground">These 5 questions will be repeated for every goal the user sets.</p>
        </CardHeader>
        <CardContent>
          {goalQuestions.map((q, index) => (
            <div key={q.id} className="mb-4 p-4 border rounded-lg">
              <Input
                placeholder="Question Title"
                value={q.title}
                 onChange={(e) => handleQuestionChange('goal', index, 'title', e.target.value)}
                className="mb-2 font-bold"
              />
              <Textarea
                placeholder="Help Text"
                value={q.helpText}
                 onChange={(e) => handleQuestionChange('goal', index, 'helpText', e.target.value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Section 2 Fixed Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Section 2: Additional Fixed Questions</CardTitle>
        </CardHeader>
        <CardContent>
          {section2FixedQuestions.map((q, index) => (
            <div key={q.id} className="mb-4 p-4 border rounded-lg relative">
              <Input
                placeholder="Question Title"
                value={q.title}
                onChange={(e) => handleQuestionChange('s2', index, 'title', e.target.value)}
                className="mb-2 font-bold"
              />
              <Textarea
                placeholder="Help Text"
                value={q.helpText}
                onChange={(e) => handleQuestionChange('s2', index, 'helpText', e.target.value)}
              />
               <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => deleteQuestion('s2', index)}>
                <Trash2 className="h-4 w-4 text-red-500"/>
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={() => addQuestion('s2')}><Plus className="mr-2 h-4 w-4" /> Add Question</Button>
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-end">
        <Button size="lg" onClick={handleSaveChanges} disabled={isSaving}>
          {isSaving ? <LoadingSpinner /> : 'Save All Changes'}
        </Button>
      </div>
    </div>
  );
}
