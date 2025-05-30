
"use client";

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function StudentMentorPage() {
  const { user, loading } = useAuth(); 
  const [projectKeywords, setProjectKeywords] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [duration, setDuration] = useState('3 weeks');

  if (loading || !user) { 
    return (
     <div className="flex-grow flex items-center justify-center p-6">
       <p>Loading...</p>
     </div>
   );
 }

  const handleGenProjectIdeas = () => {
    // Placeholder for future functionality
    console.log("Generate Project Ideas Clicked", { projectKeywords, difficulty, duration });
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
            />
              <p className="text-xs text-muted-foreground px-1">Enter topics to generate real-world problem focused project ideas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="difficulty-level" className="text-md font-medium">Difficulty Level</Label>
              <Select onValueChange={setDifficulty} defaultValue={difficulty}>
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
              <Select onValueChange={setDuration} defaultValue={duration}>
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
          >
            <Lightbulb className="mr-2 h-5 w-5" />
            Gen Project Ideas
          </Button>
        </div>
      </div>
    </div>
    );
}
