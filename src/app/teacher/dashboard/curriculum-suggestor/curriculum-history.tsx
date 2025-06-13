"use client";

import { useState, useEffect } from 'react';
import { 
  History, 
  BookOpen, 
  Eye, 
  Edit3, 
  Trash2,
  ArrowLeft,
  Clock,
  Calendar,
  Filter,
  Search,
  Loader2,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db as firebaseDbService } from '@/lib/firebase';

const fetchCurriculums = async () => {
  const q = query(collection(firebaseDbService, 'curriculums'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const deleteCurriculum = async (id: string) => {
  await deleteDoc(doc(firebaseDbService, 'curriculums', id));
};

interface CurriculumHistoryProps {
  onBack: () => void;
  onViewCurriculum: (curriculum: any) => void;
  onEditCurriculum: (curriculum: any) => void;
}

export default function CurriculumHistory({ 
  onBack, 
  onViewCurriculum, 
  onEditCurriculum 
}: CurriculumHistoryProps) {
  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadCurriculums();
  }, []);

  const loadCurriculums = async () => {
    try {
      setLoading(true);
      const data = await fetchCurriculums();
      const curriculums = data.map((item: any) => item.data);
      setCurriculums(curriculums);
    } catch (error) {
      console.error('Error loading curriculums:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this curriculum? This action cannot be undone.')) {
      try {
        await deleteCurriculum(id);
        setCurriculums(prev => prev.filter(c => c.id !== id));
      } catch (error) {
        console.error('Error deleting curriculum:', error);
        alert('Failed to delete curriculum. Please try again.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSubjectColor = (subject: string) => {
    const colors = {
      'Computer Science': 'bg-blue-100 text-blue-800',
      'Physics': 'bg-purple-100 text-purple-800',
      'Mathematics': 'bg-green-100 text-green-800',
      'Chemistry': 'bg-orange-100 text-orange-800',
      'Biology': 'bg-pink-100 text-pink-800',
    };
    return colors[subject] || 'bg-gray-100 text-gray-800';
  };

  // Filter and sort logic
  const filteredCurriculums = curriculums
    .filter(curriculum => {
      const matchesSearch = curriculum.lessonStructure.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesSubject = filterSubject === 'all' || 
        curriculum.metadata.subject === filterSubject;
      return matchesSearch && matchesSubject;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime();
        case 'oldest':
          return new Date(a.metadata.createdAt).getTime() - new Date(b.metadata.createdAt).getTime();
        case 'title':
          return a.lessonStructure.title.localeCompare(b.lessonStructure.title);
        case 'subject':
          return a.metadata.subject.localeCompare(b.metadata.subject);
        default:
          return 0;
      }
    });

  const uniqueSubjects = [...new Set(curriculums.map(c => c.metadata.subject))];

  return (
    <div className="flex-grow flex flex-col p-6 space-y-6 w-full bg-white mx-auto">
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 bg-muted/30 p-4 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search lesson plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {uniqueSubjects.map(subject => (
              <SelectItem key={subject} value={subject}>{subject}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="title">Title A-Z</SelectItem>
            <SelectItem value="subject">Subject A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 size={40} className="animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading your curriculum history...</p>
          </div>
        </div>
      ) : filteredCurriculums.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <FileText size={64} className="text-muted-foreground mx-auto" />
          <h3 className="text-xl font-semibold text-muted-foreground">
            {searchTerm || filterSubject !== 'all' ? 'No matching curriculums found' : 'No saved curriculums yet'}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm || filterSubject !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Start creating lesson plans to see them here'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCurriculums.map((curriculum) => (
            <Card key={curriculum.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      {curriculum.lessonStructure.title}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getSubjectColor(curriculum.metadata.subject)}`}
                      >
                        {curriculum.metadata.subject}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {curriculum.metadata.gradeLevel}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock size={12} className="mr-1" />
                        {curriculum.lessonStructure.duration}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewCurriculum(curriculum)}
                      className="px-3"
                    >
                      <Eye size={14} className="mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditCurriculum(curriculum)}
                      className="px-3"
                    >
                      <Edit3 size={14} className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(curriculum.id)}
                      className="px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>Created: {formatDate(curriculum.metadata.createdAt)}</span>
                  </div>
                  {curriculum.metadata.updatedAt !== curriculum.metadata.createdAt && (
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>Updated: {formatDate(curriculum.metadata.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}