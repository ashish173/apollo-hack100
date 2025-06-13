"use client";

import { useState, useCallback } from 'react';
import { 
  BookOpen, 
  Save, 
  Download, 
  Share,
  ArrowLeft,
  Plus,
  Trash2,
  Clock,
  Users,
  Target,
  Play,
  MessageCircle,
  FileText,
  Edit,
  Check,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CurriculumEditorProps {
  initialData?: any;
  onSave?: (data: any) => void;
  onExport?: () => void;
  onBack?: () => void;
}

export default function CurriculumEditor({ 
  initialData,
  onSave, 
  onExport, 
  onBack 
}: CurriculumEditorProps) {
  const [curriculumData, setCurriculumData] = useState(initialData);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  const handleSave = () => {
    if (onSave) {
      onSave(curriculumData);
    }
    setHasChanges(false);
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    }
  };

  const updateField = useCallback((path: string[], value: any) => {
    setCurriculumData(prev => {
      const newData = JSON.parse(JSON.stringify(prev)); // Deep clone
      let current = newData;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      
      setHasChanges(true);
      return newData;
    });
  }, []);

  const addArrayItem = useCallback((path: string[], defaultItem: any) => {
    setCurriculumData(prev => {
      const newData = JSON.parse(JSON.stringify(prev)); // Deep clone
      let current = newData;
      
      for (const key of path) {
        current = current[key];
      }
      current.push(defaultItem);
      
      setHasChanges(true);
      return newData;
    });
  }, []);

  const removeArrayItem = useCallback((path: string[], index: number) => {
    setCurriculumData(prev => {
      const newData = JSON.parse(JSON.stringify(prev)); // Deep clone
      let current = newData;
      
      for (const key of path) {
        current = current[key];
      }
      current.splice(index, 1);
      
      setHasChanges(true);
      return newData;
    });
  }, []);

  const startEditing = (fieldId: string, currentValue: string) => {
    setEditingField(fieldId);
    setTempValue(currentValue || '');
  };

  const saveEdit = (path: string[]) => {
    updateField(path, tempValue);
    setEditingField(null);
    setTempValue('');
  };

  const cancelEdit = () => {
    setEditingField(null);
    setTempValue('');
  };

  const EditableField = ({ 
    fieldId, 
    value, 
    path, 
    placeholder, 
    multiline = false, 
    className = "" 
  }: {
    fieldId: string;
    value: string;
    path: string[];
    placeholder: string;
    multiline?: boolean;
    className?: string;
  }) => {
    const isEditing = editingField === fieldId;

    if (isEditing) {
      return (
        <div className="flex items-start gap-2">
          {multiline ? (
            <Textarea
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder={placeholder}
              className={`bg-blue-50 border-blue-200 min-h-[80px] flex-grow ${className}`}
              autoFocus
            />
          ) : (
            <Input
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder={placeholder}
              className={`bg-blue-50 border-blue-200 flex-grow ${className}`}
              autoFocus
            />
          )}
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => saveEdit(path)}
              className="text-green-600 hover:text-green-700 h-8 w-8 p-0"
            >
              <Check size={14} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={cancelEdit}
              className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
            >
              <X size={14} />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="group flex items-start gap-2 cursor-pointer" onClick={() => startEditing(fieldId, value)}>
        <div className={`flex-grow p-2 rounded border-2 border-transparent hover:border-blue-200 hover:bg-blue-50/50 ${className}`}>
          {value || <span className="text-gray-400 italic">{placeholder}</span>}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
        >
          <Edit size={14} />
        </Button>
      </div>
    );
  };

  const EditableList = ({ 
    items, 
    pathPrefix, 
    placeholder,
    fieldIdPrefix 
  }: { 
    items: string[];
    pathPrefix: string[];
    placeholder: string;
    fieldIdPrefix: string;
  }) => {
    const handleItemChange = (index: number, value: string) => {
      const newItems = [...(items || [])];
      newItems[index] = value;
      updateField([...pathPrefix], newItems);
    };

    const handleAddItem = () => {
      addArrayItem(pathPrefix, "");
    };

    const handleRemoveItem = (index: number) => {
      removeArrayItem(pathPrefix, index);
    };

    return (
      <div className="space-y-2">
        {(items || []).map((item: string, index: number) => (
          <div key={`${fieldIdPrefix}-${index}`} className="flex items-start gap-2">
            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-3" />
            <div className="flex-grow">
              <EditableField
                fieldId={`${fieldIdPrefix}-${index}`}
                value={item}
                path={[...pathPrefix, index.toString()]}
                placeholder={placeholder}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveItem(index)}
              className="text-red-500 hover:text-red-700 h-8 w-8 p-0 mt-1"
              type="button"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddItem}
          className="mt-2"
          type="button"
        >
          <Plus size={14} className="mr-1" />
          Add Item
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="w-full p-6 space-y-6">
        {/* Header with controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              onClick={onBack}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Viewer
            </Button>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="secondary" className="text-xs">
                  Unsaved Changes
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700"
              disabled={!hasChanges}
            >
              <Save size={16} className="mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Lesson Overview */}
        <Card className="border-blue-200 bg-blue-50/30 w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl w-full">
                <EditableField
                  fieldId="lesson-title"
                  value={curriculumData?.lessonStructure?.title || ''}
                  path={['lessonStructure', 'title']}
                  placeholder="Enter lesson title..."
                  className="text-xl font-bold"
                />
              </CardTitle>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <EditableField
                  fieldId="lesson-duration"
                  value={curriculumData.lessonStructure.duration}
                  path={['lessonStructure', 'duration']}
                  placeholder="Duration..."
                />
              </div>
              <div className="flex items-center gap-1">
                <Users size={14} />
                <span>Medium Class</span>
              </div>
              <div className="flex items-center gap-1">
                <Target size={14} />
                <span>Computer Science</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabbed Content */}
        <div className="w-full">
          <Tabs defaultValue="structure" className="w-full">
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

            <TabsContent value="structure" className="space-y-6 w-full">
              {/* Learning Objectives */}
              <Card className="border-blue-200 bg-blue-50/30 w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="text-primary" size={20} />
                    Learning Objectives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EditableList
                    items={curriculumData.lessonStructure.objectives}
                    pathPrefix={['lessonStructure', 'objectives']}
                    placeholder="Enter learning objective..."
                    fieldIdPrefix="objective"
                  />
                </CardContent>
              </Card>

              {/* Lesson Phases */}
              {curriculumData.lessonStructure.phases.map((phase, phaseIndex) => (
                <Card key={phaseIndex} className="border-blue-200 bg-blue-50/30">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg flex-grow">
                        <EditableField
                          fieldId={`phase-name-${phaseIndex}`}
                          value={phase.name}
                          path={['lessonStructure', 'phases', phaseIndex.toString(), 'name']}
                          placeholder="Phase name..."
                        />
                      </CardTitle>
                      <Badge variant="secondary" className="ml-2">
                        <EditableField
                          fieldId={`phase-duration-${phaseIndex}`}
                          value={phase.duration}
                          path={['lessonStructure', 'phases', phaseIndex.toString(), 'duration']}
                          placeholder="Duration..."
                          className="text-xs"
                        />
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <EditableList
                      items={phase.activities}
                      pathPrefix={['lessonStructure', 'phases', phaseIndex.toString(), 'activities']}
                      placeholder="Enter activity..."
                      fieldIdPrefix={`phase-${phaseIndex}-activity`}
                    />
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="experiment" className="space-y-6 w-full">
              <Card className="border-blue-200 bg-blue-50/30 w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="text-primary">🧪</div>
                    <EditableField
                      fieldId="experiment-title"
                      value={curriculumData.experiment.title}
                      path={['experiment', 'title']}
                      placeholder="Experiment title..."
                      className="text-lg font-semibold"
                    />
                  </CardTitle>
                  <Badge variant="outline" className="w-fit">
                    <EditableField
                      fieldId="experiment-duration"
                      value={curriculumData.experiment.duration}
                      path={['experiment', 'duration']}
                      placeholder="Duration..."
                      className="text-xs"
                    />
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Materials Needed:</h4>
                    <EditableList
                      items={curriculumData.experiment.materials}
                      pathPrefix={['experiment', 'materials']}
                      placeholder="Enter material..."
                      fieldIdPrefix="material"
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Procedure:</h4>
                    <EditableList
                      items={curriculumData.experiment.procedure}
                      pathPrefix={['experiment', 'procedure']}
                      placeholder="Enter procedure step..."
                      fieldIdPrefix="procedure"
                    />
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Expected Outcome:</h4>
                    <EditableField
                      fieldId="experiment-outcome"
                      value={curriculumData.experiment.expectedOutcome}
                      path={['experiment', 'expectedOutcome']}
                      placeholder="Describe the expected learning outcome..."
                      multiline={true}
                      className="text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="opening" className="space-y-6 w-full">
              <div className="grid gap-4 w-full">
                <Card className="border-blue-200 bg-blue-50/30 w-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      💡 Curiosity Question & Answer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Question for Students:</h4>
                      <EditableField
                        fieldId="curiosity-question"
                        value={curriculumData.openingRemarks.curiosityQuestion}
                        path={['openingRemarks', 'curiosityQuestion']}
                        placeholder="Enter curiosity question..."
                        multiline={true}
                        className="italic bg-primary/10 p-4 rounded-lg border-l-4 border-primary"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Answer Guide for Teacher:</h4>
                      <EditableField
                        fieldId="curiosity-answer"
                        value={curriculumData.openingRemarks.curiosityAnswer}
                        path={['openingRemarks', 'curiosityAnswer']}
                        placeholder="Enter answer explanation..."
                        multiline={true}
                        className="text-sm bg-secondary/30 p-4 rounded-lg"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      ✨ Fun Fact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EditableField
                      fieldId="fun-fact"
                      value={curriculumData.openingRemarks.funFact}
                      path={['openingRemarks', 'funFact']}
                      placeholder="Enter interesting fun fact..."
                      multiline={true}
                      className="bg-accent/10 p-4 rounded-lg border-l-4 border-accent"
                    />
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      📖 Related Story
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EditableField
                      fieldId="related-story"
                      value={curriculumData.openingRemarks.relatedStory}
                      path={['openingRemarks', 'relatedStory']}
                      placeholder="Enter related story..."
                      multiline={true}
                      className="bg-secondary/50 p-4 rounded-lg"
                    />
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      🏢 Industry Connection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EditableField
                      fieldId="industry-connection"
                      value={curriculumData.openingRemarks.industryConnection}
                      path={['openingRemarks', 'industryConnection']}
                      placeholder="Enter industry connection..."
                      multiline={true}
                      className="bg-primary/10 p-4 rounded-lg"
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="resources" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {/* Reading Materials */}
                <Card className="border-blue-200 bg-blue-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      📚 Reading Materials
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {curriculumData.postLectureResources.readingMaterials.map((material, index) => (
                      <div key={index} className="p-3 border rounded-lg space-y-2">
                        <EditableField
                          fieldId={`reading-material-title-${index}`}
                          value={material.title}
                          path={['postLectureResources', 'readingMaterials', index.toString(), 'title']}
                          placeholder="Resource title..."
                          className="font-medium text-sm"
                        />
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">{material.type}</Badge>
                          <Badge variant="secondary" className="text-xs">{material.difficulty}</Badge>
                        </div>
                        <EditableField
                          fieldId={`reading-material-url-${index}`}
                          value={material.url || ''}
                          path={['postLectureResources', 'readingMaterials', index.toString(), 'url']}
                          placeholder="URL (optional)..."
                          className="text-xs"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Video Resources */}
                <Card className="border-blue-200 bg-blue-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      🎥 Video Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {curriculumData.postLectureResources.videoResources.map((video, index) => (
                      <div key={index} className="p-3 border rounded-lg space-y-2">
                        <EditableField
                          fieldId={`video-title-${index}`}
                          value={video.title}
                          path={['postLectureResources', 'videoResources', index.toString(), 'title']}
                          placeholder="Video title..."
                          className="font-medium text-sm"
                        />
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">{video.platform}</Badge>
                          <Badge variant="secondary" className="text-xs">{video.duration}</Badge>
                        </div>
                        <EditableField
                          fieldId={`video-description-${index}`}
                          value={video.description}
                          path={['postLectureResources', 'videoResources', index.toString(), 'description']}
                          placeholder="Video description..."
                          multiline={true}
                          className="text-xs"
                        />
                        <EditableField
                          fieldId={`video-url-${index}`}
                          value={video.url}
                          path={['postLectureResources', 'videoResources', index.toString(), 'url']}
                          placeholder="Video URL..."
                          className="text-xs"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Practice Exercises */}
                <Card className="border-blue-200 bg-blue-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      📝 Practice Exercises
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {curriculumData.postLectureResources.practiceExercises.map((exercise, index) => (
                      <div key={index} className="p-3 border rounded-lg space-y-2">
                        <EditableField
                          fieldId={`exercise-title-${index}`}
                          value={exercise.title}
                          path={['postLectureResources', 'practiceExercises', index.toString(), 'title']}
                          placeholder="Exercise title..."
                          className="font-medium text-sm"
                        />
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">{exercise.type}</Badge>
                          <Badge variant="secondary" className="text-xs">{exercise.estimatedTime}</Badge>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-medium">Description:</label>
                            <EditableField
                              fieldId={`exercise-description-${index}`}
                              value={exercise.description}
                              path={['postLectureResources', 'practiceExercises', index.toString(), 'description']}
                              placeholder="Exercise description..."
                              multiline={true}
                              className="text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium">Learning Objective:</label>
                            <EditableField
                              fieldId={`exercise-objective-${index}`}
                              value={exercise.learningObjective}
                              path={['postLectureResources', 'practiceExercises', index.toString(), 'learningObjective']}
                              placeholder="Learning objective..."
                              multiline={true}
                              className="text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium">Expected Outcome:</label>
                            <EditableField
                              fieldId={`exercise-outcome-${index}`}
                              value={exercise.expectedOutcome}
                              path={['postLectureResources', 'practiceExercises', index.toString(), 'expectedOutcome']}
                              placeholder="Expected outcome..."
                              multiline={true}
                              className="text-xs"
                            />
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
      </div>
    </div>
  );
}