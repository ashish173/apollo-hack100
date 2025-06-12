"use client";

import { useState } from 'react';
import { 
  BookOpen, 
  Edit3, 
  Eye, 
  Sparkles,
  Users,
  Target,
  History
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CurriculumHomePageProps {
  onGenerateNew: () => void;
  onViewExample: (subject: string) => void;
  onEditExample: (subject: string) => void;
  onViewHistory: () => void;
}

export default function CurriculumHomePage({ 
  onGenerateNew, 
  onViewExample, 
  onEditExample,
  onViewHistory
}: CurriculumHomePageProps) {
  return (
    <div className="flex-grow flex flex-col p-6 space-y-8 w-full max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-6">
          <BookOpen size={64} className="text-primary" />
          <Sparkles size={32} className="text-accent" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          AI-Powered Curriculum Designer
        </h1>
        <p className="text-xl text-muted-foreground mx-auto">
          Transform your teaching with engaging lesson plans designed specifically for Indian higher education. 
          Create interactive experiences that make students excited about learning.
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Generate New Curriculum */}
        <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Sparkles className="text-primary" size={24} />
              </div>
              <div>
                <CardTitle className="text-xl">Generate New Lesson Plan</CardTitle>
                <CardDescription>
                  Create a custom curriculum suggestion using AI
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your lesson topic, subject, and class details to get personalized suggestions for:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Target size={12} className="text-primary" />
                <span>Engaging structure</span>
              </div>
              <div className="flex items-center gap-2">
                <Target size={12} className="text-primary" />
                <span>Opening experiments</span>
              </div>
              <div className="flex items-center gap-2">
                <Target size={12} className="text-primary" />
                <span>Curiosity questions</span>
              </div>
              <div className="flex items-center gap-2">
                <Target size={12} className="text-primary" />
                <span>Learning resources</span>
              </div>
            </div>
            <div className="space-y-2">
              <Button 
                onClick={onGenerateNew} 
                className="w-full bg-primary hover:bg-primary/90"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Start Creating
              </Button>
              <Button 
                onClick={onViewHistory}
                variant="outline" 
                className="w-full"
              >
                <History className="mr-2 h-4 w-4" />
                View History
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* View Examples */}
        <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/10 rounded-lg">
                <Eye className="text-accent" size={24} />
              </div>
              <div>
                <CardTitle className="text-xl">Explore Example Lessons</CardTitle>
                <CardDescription>
                  See pre-built curriculum suggestions in action
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Browse through example lesson plans to see the quality and depth of AI-generated suggestions:
            </p>
            
            <div className="space-y-3">
              {/* Physics Example */}
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-sm">Physics: Momentum & Impact</h4>
                    <p className="text-xs text-muted-foreground">45 min • Egg drop experiment</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">Physics</Badge>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onViewExample('physics')}
                    className="flex-1"
                  >
                    <Eye size={12} className="mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onEditExample('physics')}
                    className="flex-1"
                  >
                    <Edit3 size={12} className="mr-1" />
                    Edit
                  </Button>
                </div>
              </div>

              {/* Computer Science Example */}
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-sm">CS: Algorithm Introduction</h4>
                    <p className="text-xs text-muted-foreground">60 min • Human sorting game</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">Computer Science</Badge>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onViewExample('computer science')}
                    className="flex-1"
                  >
                    <Eye size={12} className="mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onEditExample('computer science')}
                    className="flex-1"
                  >
                    <Edit3 size={12} className="mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <Card className="text-center p-6">
          <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
            <Target className="text-primary" size={32} />
          </div>
          <h3 className="font-semibold text-lg mb-2">Indian Context</h3>
          <p className="text-sm text-muted-foreground">
            Designed specifically for State Public Universities with Indian examples, companies, and cultural context.
          </p>
        </Card>

        <Card className="text-center p-6">
          <div className="p-3 bg-accent/10 rounded-full w-fit mx-auto mb-4">
            <Users className="text-accent" size={32} />
          </div>
          <h3 className="font-semibold text-lg mb-2">Engagement Focus</h3>
          <p className="text-sm text-muted-foreground">
            Transform boring lectures into interactive experiences with hands-on experiments and curiosity-driven content.
          </p>
        </Card>

        <Card className="text-center p-6">
          <div className="p-3 bg-secondary/50 rounded-full w-fit mx-auto mb-4">
            <Edit3 className="text-secondary-foreground" size={32} />
          </div>
          <h3 className="font-semibold text-lg mb-2">Fully Editable</h3>
          <p className="text-sm text-muted-foreground">
            Customize every aspect of your lesson plan with our WYSIWYG editor. Save, export, and reuse your content.
          </p>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="bg-muted/50 rounded-lg p-6 mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">4</div>
            <div className="text-sm text-muted-foreground">Core Components</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">100%</div>
            <div className="text-sm text-muted-foreground">Customizable</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">10+</div>
            <div className="text-sm text-muted-foreground">Subject Areas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">∞</div>
            <div className="text-sm text-muted-foreground">Possibilities</div>
          </div>
        </div>
      </div>
    </div>
  );
}