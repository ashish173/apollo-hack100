
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Lightbulb, Zap, BookOpen, Rocket, UserPlus, Info, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db as firebaseDbService } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AssignProjectDialog from '@/components/teacher/assign-project-dialog';
import { generateProjectIdeas } from '@/ai/flows/generate-project-ideas';
import IdeaDetail from './idea-detail';


export interface ProjectIdea {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  duration: string;
  icon?: React.ElementType;
}

export default function StudentMentorPage() {
  const { user, loading: authLoading } = useAuth(); 
  const [projectKeywords, setProjectKeywords] = useState('');
  const [difficulty, setDifficulty] = useState<string>('Easy');
  const [duration, setDuration] = useState<string>('3 Weeks');
  const [isSavingQuery, setIsSavingQuery] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<ProjectIdea[]>([]);
  const [loadingProjectIdeas, setLoadingProjectIdeas] = useState<boolean>(false);
  const { toast } = useToast();

  const [selectedProjectToAssign, setSelectedProjectToAssign] = useState<ProjectIdea | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<ProjectIdea | null>(null);

  const FIREBASE_FUNCTION_URL = 'https://us-central1-role-auth-7bc43.cloudfunctions.net/generateProjectIdeasFn';

  const handleOpenAssignDialog = (project: ProjectIdea) => {
    setSelectedProjectToAssign(project);
    setIsAssignDialogOpen(true);
  };

  const handleViewDetails = (project: ProjectIdea) => {
    setIsAssignDialogOpen(false);
    setSelectedProjectForDetail(project);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setSelectedProjectForDetail(null);
    setViewMode('list');
  };

  if (authLoading || !user) { 
    return (
     <div className="flex-grow flex items-center justify-center p-6">
       <LoadingSpinner size={64} />
     </div>
   );
 }

  const handleGenProjectIdeas = async () => {
    if (!projectKeywords.trim()) {
      toast({
        title: "Missing Keywords",
        description: "Please enter some project keywords.",
        variant: "destructive",
      });
      return;
    }

    if (!user || !user.uid || !user.email) {
      toast({
        title: "Authentication Error",
        description: "Could not identify the user. Please try signing out and in again.",
        variant: "destructive",
      });
      return;
    }

    if (!firebaseDbService) {
      toast({
        title: "Database Error",
        description: "Firestore service is not available. Cannot save query.",
        variant: "destructive",
      });
      return;
    }


    try {
      setLoadingProjectIdeas(true);
      // const result = await generateProjectIdeas({ topic: projectKeywords, difficulty: difficulty, duration: duration });
      // console.log(result);

      const requestBody = {
        topic: projectKeywords,
        difficulty: difficulty,
        duration: duration
      };

      const response = await fetch(FIREBASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      const rawResponseText = data.response;

      setGeneratedIdeas(rawResponseText.ideas || []); 
    } catch (error: any) {
      console.log("error in gen ai query");
    } finally {
      setLoadingProjectIdeas(false); 
    }



    setIsSavingQuery(true);
    try {
      const queryData = {
        userId: user.uid,
        userEmail: user.email,
        keywords: projectKeywords.trim(),
        difficulty: difficulty,
        duration: duration,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(firebaseDbService, "projectIdeaQueries"), queryData);
      
      toast({
        title: "Query Saved!",
        description: "Your project idea query has been saved. AI generation coming soon!",
      });

    } catch (error) {
      console.error("Error saving project idea query:", error);
      toast({
        title: "Save Failed",
        description: "Could not save your project idea query. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingQuery(false);
    }
  };

  if (viewMode === 'detail' && selectedProjectForDetail) {
    return (
      <IdeaDetail
        idea={selectedProjectForDetail}
        goBack={handleBackToList}
        handleAssign={() => handleOpenAssignDialog(selectedProjectForDetail)}
      />
    )
  }

  return (
    <div className="flex-grow flex flex-col p-6 space-y-8 mx-auto">
      <div className="text-center">
        <Lightbulb size={56} className="mx-auto mb-5 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight text-primary">Project Idea Generator</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Spark creativity! Enter keywords and set parameters to discover project ideas for your students.
        </p>
      </div>

      <div className="flex flex-col">
        <div className="w-full p-6 bg-card/50 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-primary mb-4">Define Your Search</h2>
          <div className="space-y-2">
            <Label htmlFor="project-keywords" className="text-md font-medium sr-only">Project Keywords</Label>
            <Input 
              id="project-keywords" 
              type="search"
              placeholder="e.g., Python, Web App, Art History" 
              value={projectKeywords}
              onChange={(e) => setProjectKeywords(e.target.value)}
              className="bg-background text-lg h-14 px-6 rounded-lg shadow-sm w-full focus:ring-2 focus:ring-primary"
              disabled={isSavingQuery}
            />
             <p className="text-xs text-muted-foreground px-1">Enter topics or technologies to base project ideas on.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="difficulty-level" className="text-md font-medium">Difficulty Level</Label>
              <Select 
                onValueChange={(value: 'Easy' | 'Medium' | 'Difficult') => setDifficulty(value)} 
                defaultValue={difficulty}
                disabled={isSavingQuery}
              >
                <SelectTrigger id="difficulty-level" className="text-base h-11 bg-background">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Difficult">Difficult</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration-level" className="text-md font-medium">Est. Duration</Label>
              <Select 
                onValueChange={(value: '1 Week' | '3 Weeks' | '5+ Weeks') => setDuration(value)} 
                defaultValue={duration}
                disabled={isSavingQuery}
              >
                <SelectTrigger id="duration-level" className="text-base h-11 bg-background">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 Week">1 Week</SelectItem>
                  <SelectItem value="3 Weeks">3 Weeks</SelectItem>
                  <SelectItem value="5+ Weeks">5+ Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            onClick={handleGenProjectIdeas} 
            className="w-full py-3 text-lg h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md shadow-md transition-transform transform hover:scale-105 mt-6"
            aria-label="Generate Project Ideas"
            disabled={isSavingQuery || authLoading || loadingProjectIdeas}
          >
            {loadingProjectIdeas ? (
              <LoadingSpinner size={24} iconClassName="text-primary-foreground" />
            ) : (
              <>
                <Lightbulb className="mr-2 h-5 w-5" />
                Gen Project Ideas
              </>
            )}
          </Button>
        </div>

        <div className="w-full ml-0 mt-6">
          <h2 className="text-3xl font-bold text-primary mb-6 text-center lg:text-left">Generated Project Ideas</h2>
          {generatedIdeas.length === 0 && !isSavingQuery && (
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  No project ideas generated yet. Use the form to find some!
                </p>
              </CardContent>
            </Card>
          )}
          {isSavingQuery && generatedIdeas.length === 0 && ( 
             <div className="flex justify-center items-center h-64">
                <LoadingSpinner size={48} />
             </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {generatedIdeas.map((idea) => {
              const IconComponent = idea.icon || Lightbulb; 
              return (
                <Card key={idea.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-xl text-primary">{idea.title}</CardTitle>
                      <IconComponent size={24} className="text-accent flex-shrink-0" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Difficulty: {idea.difficulty}</Badge>
                      <Badge variant="outline">Duration: {idea.duration}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">{idea.description}</p>
                  </CardContent>
                  <CardFooter className="flex flex-row gap-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full sm:flex-auto shadow-sm"
                      onClick={() => handleViewDetails(idea)}
                    >
                      <Info className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
      {selectedProjectToAssign && user && (
        <AssignProjectDialog
          project={selectedProjectToAssign}
          isOpen={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          teacherId={user.uid}
        />
      )}
    </div>
  );
}
