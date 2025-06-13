"use client";

import { useState } from 'react';
import { 
  Edit3, 
  Users,
  Target,
  FileText,
  MessageCircle,
  Play,
  Save,
  BookmarkPlus,
  Loader2,
  Download,
  Share
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db as firebaseDbService } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';

interface CurriculumViewerProps {
  suggestion: any;
  onBack: () => void;
  onEdit: () => void;
}

export default function CurriculumViewer({ suggestion, onBack, onEdit }: CurriculumViewerProps) {
  const [activeTab, setActiveTab] = useState('structure');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const { toast } = useToast();
  const { user } = useAuth(); 

  const handleSavePlan = async () => {
    try {
      setIsSaving(true);
      setSaveStatus('saving');
      
      // Prepare the data for Firebase
      const curriculumData = {
        ...suggestion,
        metadata: {
          title: suggestion.lessonStructure.title,
          subject: 'Computer Science', // You can make this dynamic
          gradeLevel: 'Medium Class', // You can make this dynamic
          duration: suggestion.lessonStructure.duration,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0'
        }
      };
      const queryData = {
        userId: user?.uid,
        data: curriculumData,
        createdAt: serverTimestamp(),
      };
      

      await addDoc(collection(firebaseDbService, 'curriculums'), queryData);

      toast({
        title: "Query Saved!",
        description: "Your project idea query has been saved. AI generation coming soon!",
      });
      
      setSaveStatus('saved');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
      
    } catch (error) {
      console.error('Error saving curriculum:', error);
      setSaveStatus('error');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const getSaveButtonText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved Successfully!';
      case 'error':
        return 'Save Failed';
      default:
        return 'Save This Plan';
    }
  };

  const getSaveButtonVariant = () => {
    switch (saveStatus) {
      case 'saved':
        return 'default' as const;
      case 'error':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <div className="flex-grow flex flex-col p-6 space-y-6 w-full bg-white mx-auto">
      {/* Header */}
      <div className="flex flex-col justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            {suggestion.lessonStructure.title}
          </h1>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Target size={14} />
              {suggestion.lessonStructure.duration}
            </div>
            <div className="flex items-center gap-1">
              <Users size={14} />
              Example Lesson
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <Button 
            variant={getSaveButtonVariant()}
            onClick={handleSavePlan}
            disabled={isSaving || saveStatus === 'saved'}
            className={saveStatus === 'saved' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}
          >
            {isSaving ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : saveStatus === 'saved' ? (
              <BookmarkPlus size={16} className="mr-2" />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            {getSaveButtonText()}
          </Button>
          <Button variant="outline" onClick={onEdit} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Edit3 size={16} className="mr-2" />
            Edit This Plan
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Download size={16} className="mr-2" />
            Export
            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Coming Soon</span>
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Share size={16} className="mr-2" />
            Share
            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Coming Soon</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="structure" className="flex items-center gap-2">
            <Target size={16} />
            Structure
          </TabsTrigger>
          <TabsTrigger value="opening" className="flex items-center gap-2">
            <MessageCircle size={16} />
            Opening
          </TabsTrigger>
          <TabsTrigger value="experiment" className="flex items-center gap-2">
            <Play size={16} />
            Experiment
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <FileText size={16} />
            Resources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="structure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Learning Objectives</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {suggestion.lessonStructure.objectives.map((objective, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {suggestion.lessonStructure.phases.map((phase, index) => (
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
        </TabsContent>

        <TabsContent value="experiment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{suggestion.experiment.title}</CardTitle>
              <Badge variant="outline" className="w-fit">{suggestion.experiment.duration}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Materials:</h4>
                <ul className="space-y-1">
                  {suggestion.experiment.materials.map((material, index) => (
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
                  {suggestion.experiment.procedure.map((step, index) => (
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
                <h4 className="font-semibold mb-2">Expected Outcome:</h4>
                <p className="text-sm">{suggestion.experiment.expectedOutcome}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opening" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Curiosity Question & Answer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Question for Students:</h4>
                <p className="italic bg-primary/10 p-4 rounded-lg border-l-4 border-primary">
                  "{suggestion.openingRemarks.curiosityQuestion}"
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Answer Guide for Teacher:</h4>
                <p className="text-sm bg-secondary/30 p-4 rounded-lg">
                  {suggestion.openingRemarks.curiosityAnswer}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fun Fact</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="bg-accent/10 p-4 rounded-lg border-l-4 border-accent">
                {suggestion.openingRemarks.funFact}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Related Story</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="bg-secondary/50 p-4 rounded-lg">
                {suggestion.openingRemarks.relatedStory}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Industry Connection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="bg-primary/10 p-4 rounded-lg">
                {suggestion.openingRemarks.industryConnection}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Reading Materials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestion.postLectureResources.readingMaterials.map((material, index) => (
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
                <CardTitle>Video Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestion.postLectureResources.videoResources.map((video, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-2">
                    <h4 className="font-medium text-sm">{video.title}</h4>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">{video.platform}</Badge>
                      <Badge variant="secondary" className="text-xs">{video.duration}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{video.description}</p>
                    <a 
                      href={video.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline block"
                    >
                      Watch Video →
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Practice Exercises</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestion.postLectureResources.practiceExercises.map((exercise, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-2">
                    <h4 className="font-medium text-sm">{exercise.title}</h4>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">{exercise.type}</Badge>
                      <Badge variant="secondary" className="text-xs">{exercise.estimatedTime}</Badge>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div>
                        <span className="font-medium">Description: </span>
                        <span className="text-muted-foreground">{exercise.description}</span>
                      </div>
                      <div>
                        <span className="font-medium">Learning Objective: </span>
                        <span className="text-muted-foreground">{exercise.learningObjective}</span>
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
