
"use client";

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db as firebaseDbService } from '@/lib/firebase';
import { generateProjectIdeas } from "@/ai/flows/generate-project-ideas";

export default function StudentMentorPage() {
  const { user, loading: authLoading } = useAuth(); 

  const [projectKeywords, setProjectKeywords] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [duration, setDuration] = useState('3 weeks');
  const [isSavingQuery, setIsSavingQuery] = useState(false);

  const [projectIdeas, setProjectIdeas] = useState<string[]>([]);

  if (authLoading || !user) { 
    return (
     <div className="flex-grow flex items-center justify-center p-6">
       <p>Loading...</p>
     </div>
   );
 }

 const handleGenProjectIdeas = async () => {
  if (!projectKeywords.trim()) {
    console.error("Project keywords are empty.");
    return;
  }

  if (!user || !user.uid || !user.email) {
    console.error("User is not authenticated or does not have a valid UID or email.");
    return;
  }

  if (!firebaseDbService) {
    console.error("Firebase database service is not initialized.");
    return;
  }

  setProjectIdeas([]);
  // Make GenAI API call

  try {
    const result = await generateProjectIdeas({ topic: projectKeywords, difficulty: difficulty, duration: duration });
    setProjectIdeas(result.ideas);
  } catch (error: any) {
    console.log("error in gen ai query");
  } finally {
    // 
  }

  // Make it async
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

    // Placeholder for future AI generation functionality
    console.log("Project Idea Query Saved:", queryData);

  } catch (error) {
    console.error("Error saving project idea query:", error);
    
  } finally {
    setIsSavingQuery(false);
  }
};


    return (
      <div className="flex-grow flex flex-col items-center justify-center p-12">
      <div className="w-full max-w-xl space-y-10">
        <div className="text-center">
          <Lightbulb size={56} className="mx-auto mb-5 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight text-primary">Project Idea Generator</h1>
          <p className="mt-3 text-lg text-muted-foreground">
          Real-world problem focused project ideas to capture the young minds.
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="project-keywords" className="text-md font-medium sr-only">Project Keywords</Label>
            <Input 
              id="project-keywords" 
              type="search"
              placeholder="e.g., Python, Web App, Machine Learning, Art History" 
              value={projectKeywords}
              onChange={(e) => setProjectKeywords(e.target.value)}
              className="bg-card text-lg h-14 px-6 rounded-lg shadow-sm w-full focus:ring-2 focus:ring-primary"
              disabled={isSavingQuery}
            />
              <p className="text-xs text-muted-foreground px-1">Enter topics to generate real-world problem focused project ideas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="difficulty-level" className="text-md font-medium">Difficulty Level</Label>
              <Select onValueChange={setDifficulty} defaultValue={difficulty} disabled={isSavingQuery}>
                <SelectTrigger id="difficulty-level" className="text-base h-11 bg-card">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="difficult">Difficult</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration-level" className="text-md font-medium">Est. Duration</Label>
              <Select onValueChange={setDuration} defaultValue={duration} disabled={isSavingQuery}>
                <SelectTrigger id="duration-level" className="text-base h-11 bg-card">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 week">1 Week</SelectItem>
                  <SelectItem value="3 weeks">3 Weeks</SelectItem>
                  <SelectItem value="5+ weeks">5+ Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            onClick={handleGenProjectIdeas} 
            className="w-full py-3 text-lg h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md shadow-md transition-transform transform hover:scale-105"
            aria-label="Generate Project Ideas"
            disabled={isSavingQuery || authLoading}
          >
            {isSavingQuery ? (
              <p>Loading...</p>
            ) : (
              <>
                <Lightbulb className="mr-2 h-5 w-5" />
                Gen Project Ideas
              </>
            )}
          </Button>
        </div>
      </div>
      {projectIdeas.map((idea, index) => (
                        <div>{idea}</div>
                      ))}

    </div>
    );
}
