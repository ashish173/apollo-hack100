"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import type { UserRole } from '@/types';
import { 
  GraduationCap, 
  Users, 
  Sparkles, 
  BookOpen, 
  Trophy,
  ArrowRight,
  Chrome
} from 'lucide-react';

// Apollo Design System Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Separator } from '@/components/ui/separator';

// Enhanced Apollo Logo Component
const ApolloLogo = ({ size = "default" }: { size?: "sm" | "default" | "lg" }) => {
  const sizes = {
    sm: { container: "w-8 h-8", icon: "w-20 h-20" },
    default: { container: "w-12 h-12", icon: "w-24 h-24" },
    lg: { container: "w-16 h-16", icon: "w-32 h-32" }
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`${sizes[size].container} bg-gradient-to-br from-blueberry-500 to-blueberry-600 rounded-xl flex items-center justify-center shadow-lg`}>
        <svg 
          width={sizes[size].icon.split(' ')[0].replace('w-', '')} 
          height={sizes[size].icon.split(' ')[1].replace('h-', '')} 
          viewBox="0 0 100 100" 
          xmlns="http://www.w3.org/2000/svg" 
          className="text-white"
        >
          <rect x="15" y="15" width="40" height="40" rx="8" ry="8" fill="currentColor" />
          <rect x="35" y="35" width="40" height="40" rx="8" ry="8" fill="currentColor" opacity="0.7" />
        </svg>
      </div>
      {size !== "sm" && (
        <div>
          <h1 className={size === "lg" ? "heading-1" : "heading-2"}>
            <span className="bg-gradient-to-r from-blueberry-600 to-blueberry-700 bg-clip-text text-transparent">
              Apollo
            </span>
          </h1>
          <p className="overline text-blueberry-600 dark:text-blueberry-400">
            Education Platform
          </p>
        </div>
      )}
    </div>
  );
};

// Enhanced Top Navigation
const TopNavigation = () => (
  <Card variant="ghost" className="fixed top-0 left-0 right-0 z-50 border-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md shadow-sm">
    <CardContent className="p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="group">
          <div className="flex items-center gap-3 group-hover:scale-105 transition-transform duration-200">
            <ApolloLogo size="sm" />
            <div>
              <span className="heading-3 bg-gradient-to-r from-blueberry-600 to-blueberry-700 bg-clip-text text-transparent">
                Apollo
              </span>
            </div>
          </div>
        </Link>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/about">About</Link>
          </Button>
          <Button variant="default" size="sm" className="shadow-button">
            Get Started
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Role Selection Cards
const RoleCard = ({ 
  role, 
  selectedRole, 
  onSelect 
}: { 
  role: UserRole; 
  selectedRole: UserRole; 
  onSelect: (role: UserRole) => void;
}) => {
  const isSelected = selectedRole === role;
  const isTeacher = role === 'teacher';
  
  const roleConfig = {
    teacher: {
      icon: <Users className="w-8 h-8" />,
      title: 'Teacher',
      description: 'Manage courses, mentor students, and track progress',
      features: ['Course Management', 'Student Mentoring', 'Progress Analytics', 'Curriculum Planning'],
      color: 'blueberry',
      badge: 'Educator'
    },
    student: {
      icon: <GraduationCap className="w-8 h-8" />,
      title: 'Student',
      description: 'Access courses, complete assignments, and track achievements',
      features: ['Course Access', 'Assignment Submission', 'Achievement Tracking', 'Peer Collaboration'],
      color: 'success',
      badge: 'Learner'
    }
  };

  const config = roleConfig[role];

  return (
    <Card 
      variant={isSelected ? "feature" : "default"}
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
        isSelected ? 'ring-2 ring-blueberry-500 dark:ring-blueberry-400' : ''
      }`}
      onClick={() => onSelect(role)}
    >
      <CardHeader className="text-center pb-4">
        <div className={`mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center ${
          isTeacher 
            ? 'bg-gradient-to-br from-blueberry-500 to-blueberry-600' 
            : 'bg-gradient-to-br from-success-500 to-success-600'
        } shadow-lg`}>
          <div className="text-white">
            {config.icon}
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2 mb-2">
          <RadioGroupItem value={role} id={`role-${role}`} className="sr-only" />
          <CardTitle size="default">{config.title}</CardTitle>
          <Badge 
            variant={isTeacher ? "default" : "success"} 
            size="sm"
          >
            {config.badge}
          </Badge>
        </div>
        
        <p className="body-text text-neutral-600 dark:text-neutral-400">
          {config.description}
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          {config.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${
                isTeacher ? 'bg-blueberry-500' : 'bg-success-500'
              }`} />
              <span className="body-text text-neutral-700 dark:text-neutral-300 text-sm">
                {feature}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Error Alert Component
const ErrorAlert = ({ error, variant = "error" }: { error: string; variant?: "error" | "warning" }) => (
  <Card variant={variant === "error" ? "default" : "default"} className={`border-2 ${
    variant === "error" 
      ? 'border-error-300 bg-error-50 dark:border-error-700 dark:bg-error-950' 
      : 'border-warning-300 bg-warning-50 dark:border-warning-700 dark:bg-warning-950'
  }`}>
    <CardContent className="p-4">
      <p className={`body-text text-center ${
        variant === "error" 
          ? 'text-error-700 dark:text-error-300' 
          : 'text-warning-700 dark:text-warning-300'
      }`}>
        {error}
      </p>
    </CardContent>
  </Card>
);

// Loading Component
const LoginLoading = () => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-blueberry-50 dark:from-neutral-900 dark:to-blueberry-950">
    <Card variant="feature" size="lg" className="text-center shadow-2xl">
      <CardHeader>
        <ApolloLogo size="lg" />
        <CardTitle gradient size="lg" className="mt-4">
          Welcome to Apollo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <LoadingSpinner 
          size="lg" 
          variant="primary" 
          showLabel={true}
          label="Signing you in"
          description="Please wait while we authenticate your account..."
        />
      </CardContent>
    </Card>
  </div>
);

// Features Showcase
const FeaturesShowcase = () => (
  <Card variant="gradient" className="mt-8">
    <CardHeader className="text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-blueberry-600 dark:text-blueberry-400" />
        <CardTitle size="default">Why Choose Apollo?</CardTitle>
      </div>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: <BookOpen className="w-6 h-6" />,
            title: 'Smart Learning',
            description: 'AI-powered curriculum suggestions and personalized learning paths'
          },
          {
            icon: <Users className="w-6 h-6" />,
            title: 'Collaborative',
            description: 'Connect teachers and students in meaningful educational experiences'
          },
          {
            icon: <Trophy className="w-6 h-6" />,
            title: 'Achievement Focused',
            description: 'Track progress and celebrate milestones with comprehensive analytics'
          }
        ].map((feature, index) => (
          <div key={index} className="text-center space-y-2">
            <div className="w-12 h-12 bg-blueberry-100 dark:bg-blueberry-950 rounded-xl flex items-center justify-center mx-auto text-blueberry-600 dark:text-blueberry-400">
              {feature.icon}
            </div>
            <h4 className="subtitle text-neutral-900 dark:text-neutral-100">
              {feature.title}
            </h4>
            <p className="body-text text-neutral-600 dark:text-neutral-400 text-sm">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Main Login Page Component
export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('teacher');
  const {
    user,
    signInWithGoogle,
    loading: authLoading,
    authError,
    roleMismatchError,
    clearAuthError,
    clearRoleMismatchError,
  } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (roleMismatchError) {
      return;
    }

    if (!authLoading && user) {
      router.replace('/');
    }
  }, [user, authLoading, router, roleMismatchError]);

  const handleSignIn = async () => {
    if (clearAuthError) clearAuthError();
    if (clearRoleMismatchError) clearRoleMismatchError();
    if (selectedRole) {
      await signInWithGoogle(selectedRole);
    }
  };

  if (authLoading || (!authLoading && user && !roleMismatchError)) {
    return <LoginLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blueberry-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-blueberry-950">
      <TopNavigation />
      
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Login Card */}
          <Card variant="elevated" size="lg" className="max-w-3xl mx-auto shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle size="lg" className="mb-2">Choose Your Role</CardTitle>
              <p className="body-text text-neutral-600 dark:text-neutral-400">
                Select how you'll be using Apollo to get started with the right experience
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <RadioGroup
                value={selectedRole}
                onValueChange={(value: UserRole) => setSelectedRole(value)}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <RoleCard 
                  role="teacher" 
                  selectedRole={selectedRole} 
                  onSelect={setSelectedRole} 
                />
                <RoleCard 
                  role="student" 
                  selectedRole={selectedRole} 
                  onSelect={setSelectedRole} 
                />
              </RadioGroup>

              {/* Error Messages */}
              {authError && (
                <ErrorAlert error={authError} variant="error" />
              )}

              {roleMismatchError && (
                <ErrorAlert error={roleMismatchError} variant="warning" />
              )}

              <Separator />

              {/* Sign In Button */}
              <div className="space-y-4">
                <Button 
                  onClick={handleSignIn} 
                  disabled={authLoading}
                  variant="primary"
                  size="lg"
                  className="w-full shadow-button hover:shadow-button-hover"
                  loading={authLoading}
                  loadingText="Signing you in..."
                >
                  <Chrome className="w-5 h-5 mr-3" />
                  Continue with Google
                  <ArrowRight className="w-5 h-5 ml-3" />
                </Button>
                
                <p className="body-text text-neutral-500 dark:text-neutral-400 text-center text-sm">
                  By continuing, you agree to Apollo's Terms of Service and Privacy Policy
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Features Showcase */}
          <FeaturesShowcase />
        </div>
      </div>
    </div>
  );
}
