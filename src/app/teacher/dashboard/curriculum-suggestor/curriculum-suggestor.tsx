"use client";

import { useState } from 'react';
import { 
  BookOpen, 
  Lightbulb, 
  MessageCircle, 
  Play, 
  FileText, 
  Video, 
  ArrowLeft,
  Clock,
  Users,
  Target,
  Sparkles,
  ChevronRight,
  Download,
  Share,
  Edit3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockCurriculumSuggestionCS } from './test-curriculum-data';
import { generateCurriculumSuggestions } from '@/ai/flows/generate-curriculum-suggestions';
import CurriculumViewer from './curriculum-viewer';

// Use the types from the API library
type LessonSuggestion = any;

export default function CurriculumSuggestor({ onEdit, onBack }: { onEdit: (suggestion: any) => void, onBack: () => void }) {
  const [lessonTopic, setLessonTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [classDuration, setClassDuration] = useState('60');
  const [classSize, setClassSize] = useState('');
  const [availableResources, setAvailableResources] = useState('');
  const [learningObjectives, setLearningObjectives] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSuggestion, setGeneratedSuggestion] = useState<LessonSuggestion | null>(null);
  const [activeTab, setActiveTab] = useState('structure');

  const FIREBASE_FUNCTION_URL = 'https://us-central1-role-auth-7bc43.cloudfunctions.net/generateCurriculumSuggestionsFn';

  const handleGenerateSuggestions = async () => {
    if (!lessonTopic.trim() || !subject.trim()) {
      return;
    }

    setIsGenerating(true);
    
    try {
      const input: any = {
        lessonTopic: lessonTopic.trim(),
        subject,
        classLevel,
        classDuration,
        classSize,
        availableResources: availableResources.trim() || undefined,
        learningObjectives: learningObjectives.trim() || undefined,
      };

      const requestBody = input;
      const response = await fetch(FIREBASE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      const data = await response.json();
      const rawResponseText = data?.response?.curriculumSuggestions;

      try {
        const parsedData = JSON.parse(rawResponseText);
        
      // sometimes the parsedData is not an object, instead it's an array of objects.
      if (Array.isArray(parsedData)) {
        setGeneratedSuggestion(parsedData[0]);
      } else {
        setGeneratedSuggestion(parsedData);
      }

      } catch (jsonError: any) {
        console.error("Failed to parse project plan JSON:", jsonError);
        setGeneratedSuggestion(null);
      }
    } catch (error) {
      console.error('Error generating curriculum suggestions:', error);
    } finally {
      setIsGenerating(false);
    }

    // const result = await generateCurriculumSuggestions(input);
    // console.log(JSON.parse(result.curriculumSuggestions));
    // setGeneratedSuggestion(JSON.parse(result.curriculumSuggestions));
    // setGeneratedSuggestion(mockCurriculumSuggestionCS);
  };

  if (generatedSuggestion) {
    return (
      <CurriculumViewer 
        suggestion={generatedSuggestion}
        onBack={onBack}
        onEdit={() => onEdit(generatedSuggestion)}
      />
    );
  }

  return (
    <div className="flex-grow flex flex-col p-6 space-y-8 mx-auto bg-white">
      <div className="text-center">
        <BookOpen size={56} className="mx-auto mb-5 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight text-primary">Curriculum Suggestor</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Transform your lessons into engaging experiences. Get personalized suggestions for structure, experiments, and resources.
        </p>
      </div>

      <Card className="w-full p-6 bg-card/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-primary">Lesson Details</CardTitle>
          <CardDescription>
            Provide information about your upcoming lesson to get personalized recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="lesson-topic" className="text-md font-medium">Lesson Topic *</Label>
              <Input 
                id="lesson-topic" 
                placeholder="e.g., Introduction to Machine Learning" 
                value={lessonTopic}
                onChange={(e) => setLessonTopic(e.target.value)}
                className="bg-background text-base h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-md font-medium">Subject *</Label>
              <Select onValueChange={setSubject}>
                <SelectTrigger className="text-base h-11 bg-background">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="computer-science">Computer Science</SelectItem>
                  <SelectItem value="mathematics">Mathematics</SelectItem>
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="chemistry">Chemistry</SelectItem>
                  <SelectItem value="biology">Biology</SelectItem>
                  <SelectItem value="business">Business Studies</SelectItem>
                  <SelectItem value="economics">Economics</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="class-level" className="text-md font-medium">Class Level</Label>
              <Select onValueChange={setClassLevel}>
                <SelectTrigger className="text-base h-11 bg-background">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="undergraduate-1">1st Year UG</SelectItem>
                  <SelectItem value="undergraduate-2">2nd Year UG</SelectItem>
                  <SelectItem value="undergraduate-3">3rd Year UG</SelectItem>
                  <SelectItem value="undergraduate-4">4th Year UG</SelectItem>
                  <SelectItem value="postgraduate">Postgraduate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-duration" className="text-md font-medium">Class Duration (mins)</Label>
              <Select onValueChange={setClassDuration} defaultValue="60">
                <SelectTrigger className="text-base h-11 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                  <SelectItem value="120">120 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-size" className="text-md font-medium">Class Size</Label>
              <Select onValueChange={setClassSize}>
                <SelectTrigger className="text-base h-11 bg-background">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (1-20)</SelectItem>
                  <SelectItem value="medium">Medium (21-50)</SelectItem>
                  <SelectItem value="large">Large (51-100)</SelectItem>
                  <SelectItem value="very-large">Very Large (100+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="available-resources" className="text-md font-medium">Available Resources</Label>
            <Input 
              id="available-resources" 
              placeholder="e.g., Projector, Whiteboard, Computer Lab, Basic Lab Equipment" 
              value={availableResources}
              onChange={(e) => setAvailableResources(e.target.value)}
              className="bg-background text-base h-11"
            />
            <p className="text-xs text-muted-foreground px-1">List the resources available in your classroom</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="learning-objectives" className="text-md font-medium">Learning Objectives (Optional)</Label>
            <Textarea 
              id="learning-objectives" 
              placeholder="What should students learn or achieve by the end of this lesson?"
              value={learningObjectives}
              onChange={(e) => setLearningObjectives(e.target.value)}
              className="bg-background text-base min-h-[80px]"
            />
          </div>

          <Button 
            onClick={handleGenerateSuggestions} 
            className="w-full py-3 text-lg h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md shadow-md transition-transform transform hover:scale-105"
            disabled={isGenerating || !lessonTopic.trim() || !subject.trim()}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
                Generating Suggestions...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Lesson Plan
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
