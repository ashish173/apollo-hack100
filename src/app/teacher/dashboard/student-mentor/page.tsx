// teacher/dashboard/student-mentor/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { 
  Lightbulb, 
  Zap, 
  BookOpen, 
  Rocket, 
  UserPlus, 
  Info, 
  ArrowLeft,
  Sparkles,
  Brain,
  Target,
  Clock
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db as firebaseDbService } from '@/lib/firebase';

// Apollo Design System Components
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { useToast } from '@/hooks/use-toast';
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

// Enhanced Header Component
const StudentMentorHeader = () => (
  <Card variant="gradient" className="mb-8">
    <CardHeader className="text-center pb-6">
      <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blueberry-500 to-blueberry-600 rounded-2xl flex items-center justify-center shadow-lg">
        <Brain className="w-8 h-8 text-white" />
      </div>
      <CardTitle size="lg" gradient className="mb-2">
        AI Project Idea Generator
      </CardTitle>
      <p className="body-text text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
        Harness the power of AI to discover personalized project ideas that inspire and challenge your students
      </p>
    </CardHeader>
  </Card>
);

// Enhanced Search Form Component
const ProjectSearchForm = ({ 
  projectKeywords, 
  setProjectKeywords,
  difficulty,
  setDifficulty,
  duration,
  setDuration,
  onGenerate,
  isLoading
}: {
  projectKeywords: string;
  setProjectKeywords: (value: string) => void;
  difficulty: string;
  setDifficulty: (value: string) => void;
  duration: string;
  setDuration: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}) => (
  <Card variant="elevated" className="mb-8">
    <CardHeader>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 bg-blueberry-100 dark:bg-blueberry-950 rounded-lg flex items-center justify-center">
          <Target className="w-4 h-4 text-blueberry-600 dark:text-blueberry-400" />
        </div>
        <CardTitle size="default">Define Your Search Parameters</CardTitle>
      </div>
      <p className="body-text text-neutral-600 dark:text-neutral-400">
        Customize the AI generation to match your curriculum needs and student skill levels
      </p>
    </CardHeader>
    
    <CardContent className="space-y-6">
      {/* Keywords Input */}
      <div className="space-y-2">
        <Label htmlFor="project-keywords" required>
          Project Keywords & Topics
        </Label>
        <Input 
          id="project-keywords" 
          type="search"
          placeholder="e.g., Python, Web Development, Machine Learning, Art History"
          value={projectKeywords}
          onChange={(e) => setProjectKeywords(e.target.value)}
          disabled={isLoading}
          leftIcon={<Lightbulb className="w-4 h-4" />}
          description="Enter topics, technologies, or subject areas to base project ideas on"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Difficulty Selection */}
        <div className="space-y-2">
          <Label htmlFor="difficulty-level">
            Difficulty Level
          </Label>
          <Select 
            onValueChange={(value: 'Easy' | 'Medium' | 'Difficult') => setDifficulty(value)} 
            defaultValue={difficulty}
            disabled={isLoading}
          >
            <SelectTrigger id="difficulty-level">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Easy">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                  Easy - Beginner Friendly
                </div>
              </SelectItem>
              <SelectItem value="Medium">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                  Medium - Intermediate Level
                </div>
              </SelectItem>
              <SelectItem value="Difficult">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-error-500 rounded-full"></div>
                  Difficult - Advanced Challenge
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Duration Selection */}
        <div className="space-y-2">
          <Label htmlFor="duration-level">
            Estimated Duration
          </Label>
          <Select 
            onValueChange={(value: '1 Week' | '3 Weeks' | '5+ Weeks') => setDuration(value)} 
            defaultValue={duration}
            disabled={isLoading}
          >
            <SelectTrigger id="duration-level" leftIcon={<Clock className="w-4 h-4" />}>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1 Week">1 Week - Quick Sprint</SelectItem>
              <SelectItem value="3 Weeks">3 Weeks - Standard Project</SelectItem>
              <SelectItem value="5+ Weeks">5+ Weeks - Comprehensive Study</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Generate Button */}
      <Button 
        onClick={onGenerate} 
        variant="default"
        size="lg"
        className="w-full shadow-button hover:shadow-button-hover"
        disabled={isLoading || !projectKeywords.trim()}
        loading={isLoading}
        loadingText="Generating Ideas..."
      >
        <Sparkles className="w-5 h-5 mr-2" />
        Generate AI Project Ideas
        <Rocket className="w-5 h-5 ml-2" />
      </Button>
    </CardContent>
  </Card>
);

// Enhanced Project Card Component
const ProjectIdeaCard = ({ 
  idea, 
  onViewDetails 
}: { 
  idea: ProjectIdea; 
  onViewDetails: (idea: ProjectIdea) => void;
}) => {
  const IconComponent = idea.icon || Lightbulb;
  
  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'difficult': return 'destructive';
      default: return 'secondary';
    }
  };

  const getDurationVariant = (duration: string) => {
    if (duration.includes('1 Week')) return 'success';
    if (duration.includes('3 Weeks')) return 'default';
    return 'secondary';
  };

  return (
    <Card 
      variant="interactive"
      className="group h-full flex flex-col hover:shadow-2xl transition-all duration-300"
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <CardTitle className="heading-3 text-neutral-900 dark:text-neutral-100 line-clamp-2 group-hover:text-blueberry-600 dark:group-hover:text-blueberry-400 transition-colors flex-1">
            {idea.title}
          </CardTitle>
          <div className="w-12 h-12 bg-gradient-to-br from-blueberry-100 to-blueberry-200 dark:from-blueberry-950 dark:to-blueberry-900 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-blueberry-500 group-hover:to-blueberry-600 transition-all duration-300">
            <IconComponent className="w-6 h-6 text-blueberry-600 dark:text-blueberry-400 group-hover:text-white transition-colors" />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant={getDifficultyVariant(idea.difficulty)} size="sm">
            {idea.difficulty}
          </Badge>
          <Badge variant={getDurationVariant(idea.duration)} size="sm">
            <Clock className="w-3 h-3 mr-1" />
            {idea.duration}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 flex-1 flex flex-col">
        <p className="body-text text-neutral-600 dark:text-neutral-400 line-clamp-3 mb-6 flex-1">
          {idea.description}
        </p>
        
        <div className="space-y-3">
          <Button 
            variant="outline" 
            size="default"
            className="w-full group-hover:border-blueberry-400 group-hover:text-blueberry-600 transition-colors"
            onClick={() => onViewDetails(idea)}
          >
            <Info className="w-4 h-4 mr-2" />
            View Details & Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Empty State Component
const EmptyState = ({ hasSearched }: { hasSearched: boolean }) => (
  <Card variant="ghost" className="text-center py-12">
    <CardContent>
      <div className="mx-auto mb-6 w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center">
        <Lightbulb className="w-10 h-10 text-neutral-400" />
      </div>
      <CardTitle size="default" className="mb-2">
        {hasSearched ? 'No ideas generated yet' : 'Ready to spark creativity?'}
      </CardTitle>
      <p className="body-text text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
        {hasSearched 
          ? 'Try adjusting your search parameters or keywords to generate new project ideas.'
          : 'Enter your project keywords and preferences above to generate personalized AI-powered project ideas for your students.'
        }
      </p>
      {!hasSearched && (
        <div className="flex items-center justify-center gap-2 text-neutral-500 dark:text-neutral-400">
          <Sparkles className="w-4 h-4" />
          <span className="overline">AI-Powered • Personalized • Educational</span>
        </div>
      )}
    </CardContent>
  </Card>
);

export default function StudentMentorPage() {
  const { user, loading: authLoading } = useAuth(); 
  const [projectKeywords, setProjectKeywords] = useState('');
  const [difficulty, setDifficulty] = useState<string>('Easy');
  const [duration, setDuration] = useState<string>('3 Weeks');
  const [isSavingQuery, setIsSavingQuery] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<ProjectIdea[]>([]);
  const [loadingProjectIdeas, setLoadingProjectIdeas] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState(false);
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
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner 
          size="xl" 
          variant="default" 
          showLabel={true}
          label="Loading Mentor Tools"
          description="Preparing your AI-powered project generation workspace..."
        />
      </div>
    );
  }

  const handleGenProjectIdeas = async () => {
    if (!projectKeywords.trim()) {
      toast({
        title: "Missing Keywords",
        description: "Please enter some project keywords to generate ideas.",
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
      setHasSearched(true);

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
      
      if (rawResponseText.ideas && rawResponseText.ideas.length > 0) {
        toast({
          title: "Ideas Generated Successfully!",
          description: `Generated ${rawResponseText.ideas.length} personalized project ideas for your students.`,
        });
      }
    } catch (error: any) {
      console.error("Error in AI generation:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate project ideas. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingProjectIdeas(false); 
    }

    // Save query to Firestore
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
    } catch (error) {
      console.error("Error saving project idea query:", error);
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
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <StudentMentorHeader />

      <ProjectSearchForm
        projectKeywords={projectKeywords}
        setProjectKeywords={setProjectKeywords}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        duration={duration}
        setDuration={setDuration}
        onGenerate={handleGenProjectIdeas}
        isLoading={loadingProjectIdeas || isSavingQuery}
      />

      {/* Results Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="heading-2 text-neutral-900 dark:text-neutral-100">
              Generated Project Ideas
            </h2>
            <p className="body-text text-neutral-600 dark:text-neutral-400">
              AI-powered suggestions tailored to your specifications
            </p>
          </div>
          {generatedIdeas.length > 0 && (
            <Badge variant="soft-primary" size="lg">
              {generatedIdeas.length} Ideas Generated
            </Badge>
          )}
        </div>

        {loadingProjectIdeas ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner 
              size="xl" 
              variant="default" 
              showLabel={true}
              label="Generating Ideas"
              description="Our AI is crafting personalized project ideas for your students..."
            />
          </div>
        ) : generatedIdeas.length === 0 ? (
          <EmptyState hasSearched={hasSearched} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedIdeas.map((idea) => (
              <ProjectIdeaCard
                key={idea.id}
                idea={idea}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
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
