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

// Use the types from the API library
type LessonSuggestion = any;

export default function CurriculumSuggestor({ onEdit }: { onEdit: (suggestion: any) => void }) {
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
      const rawResponseText = data.response;


      try {
      const parsedData = JSON.parse(rawResponseText.curriculumSuggestions);
      setGeneratedSuggestion(parsedData);

      } catch (jsonError: any) {
        console.error("Failed to parse project plan JSON:", jsonError);
        setGeneratedSuggestion(null);
      }

      // const result = await generateCurriculumSuggestions(input);
      // console.log(JSON.parse(result.curriculumSuggestions));
      // setGeneratedSuggestion(JSON.parse(result.curriculumSuggestions));
      // setGeneratedSuggestion(mockCurriculumSuggestionCS);

    } catch (error) {
      console.error('Error generating curriculum suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setGeneratedSuggestion(null);
    setActiveTab('structure');
  };

  if (generatedSuggestion) {
    return (
      <div className="flex-grow flex flex-col p-6 space-y-6 mx-auto bg-white">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={resetForm}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Form
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onEdit(generatedSuggestion)}>
              <Edit3 size={16} className="mr-2" />
              Edit This Plan
            </Button>
            <Button variant="outline" size="sm">
              <Download size={16} className="mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Share size={16} className="mr-2" />
              Share
            </Button>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Lesson Plan: {generatedSuggestion.lessonStructure.title}
          </h1>
          <div className="flex justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              {generatedSuggestion.lessonStructure.duration}
            </div>
            <div className="flex items-center gap-1">
              <Users size={14} />
              {classSize} students
            </div>
            <div className="flex items-center gap-1">
              <BookOpen size={14} />
              {subject}
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="structure" className="flex items-center gap-2">
              <Target size={16} />
              Structure
            </TabsTrigger>
            <TabsTrigger value="experiment" className="flex items-center gap-2">
              <Play size={16} />
              Experiment
            </TabsTrigger>
            <TabsTrigger value="opening" className="flex items-center gap-2">
              <MessageCircle size={16} />
              Opening
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <FileText size={16} />
              Resources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="structure" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="text-primary" size={20} />
                  Learning Objectives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {generatedSuggestion.lessonStructure.objectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <ChevronRight size={16} className="text-primary mt-0.5 flex-shrink-0" />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {generatedSuggestion.lessonStructure.phases.map((phase, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{phase.name}</CardTitle>
                      <Badge variant="secondary">{phase.duration}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {phase.activities.map((activity, actIndex) => (
                        <li key={actIndex} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span>{activity}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="experiment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="text-primary" size={20} />
                  {generatedSuggestion.experiment.title}
                </CardTitle>
                <CardDescription>
                  <Badge variant="outline">{generatedSuggestion.experiment.duration}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Materials Needed:</h4>
                  <ul className="space-y-1">
                    {generatedSuggestion.experiment.materials.map((material, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                        {material}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Procedure:</h4>
                  <ol className="space-y-2">
                    {generatedSuggestion.experiment.procedure.map((step, index) => (
                      <li key={index} className="flex gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Lightbulb size={16} />
                    Expected Outcome:
                  </h4>
                  <p className="text-sm">{generatedSuggestion.experiment.expectedOutcome}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opening" className="space-y-6">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageCircle className="text-primary" size={18} />
                    Curiosity Question & Answer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Question for Students:</h4>
                    <p className="text-base italic bg-primary/10 p-4 rounded-lg border-l-4 border-primary">
                      "{generatedSuggestion.openingRemarks.curiosityQuestion}"
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Answer Guide for Teacher:</h4>
                    <p className="text-sm bg-secondary/30 p-4 rounded-lg">
                      {generatedSuggestion.openingRemarks.curiosityAnswer}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="text-accent" size={18} />
                    Fun Fact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base bg-accent/10 p-4 rounded-lg border-l-4 border-accent">
                    {generatedSuggestion.openingRemarks.funFact}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="text-secondary-foreground" size={18} />
                    Related Story
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base bg-secondary/50 p-4 rounded-lg">
                    {generatedSuggestion.openingRemarks.relatedStory}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="text-primary" size={18} />
                    Industry Connection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base bg-primary/10 p-4 rounded-lg">
                    {generatedSuggestion.openingRemarks.industryConnection}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="text-primary" size={18} />
                    Reading Materials
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {generatedSuggestion.postLectureResources.readingMaterials.map((material, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-2">
                      <h4 className="font-medium text-sm">{material.title}</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">{material.type}</Badge>
                        <Badge variant="secondary" className="text-xs">{material.difficulty}</Badge>
                      </div>
                      {material.url && (
                        <a 
                          href={material.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline block"
                        >
                          Read Article →
                        </a>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="text-accent" size={18} />
                    Video Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {generatedSuggestion.postLectureResources.videoResources.map((video, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-2">
                      <h4 className="font-medium text-sm">{video.title}</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">{video.platform}</Badge>
                        <Badge variant="secondary" className="text-xs">{video.duration}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{video.description}</p>
                      {video.url && (
                        <a 
                          href={video.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline block"
                        >
                          Watch Video →
                        </a>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="text-secondary-foreground" size={18} />
                    Practice Exercises
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {generatedSuggestion.postLectureResources.practiceExercises.map((exercise, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-2">
                      <h4 className="font-medium text-sm">{exercise.title}</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">{exercise.type}</Badge>
                        <Badge variant="secondary" className="text-xs">{exercise.estimatedTime}</Badge>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-medium">Description: </span>
                          <span className="text-muted-foreground">{exercise.description}</span>
                        </div>
                        <div>
                          <span className="font-medium">Learning Objective: </span>
                          <span className="text-muted-foreground">{exercise.learningObjective}</span>
                        </div>
                        <div>
                          <span className="font-medium">Expected Outcome: </span>
                          <span className="text-muted-foreground">{exercise.expectedOutcome}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
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
