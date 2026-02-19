import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Users,
    MapPin,
    Link2,
    ChevronLeft,
    Edit,
    Clock as ClockIcon,
    BookOpen,
    MessageSquare,
    FileText,
    Video,
    ExternalLink,
    Plus,
    MessageCircle,
    UserPlus,
    CalendarPlus,
    Bookmark,
    Share2,
    MoreHorizontal,
    AlertCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  format, 
  formatDistanceToNow, 
  isToday, 
  isTomorrow, 
  isThisWeek, 
  isAfter, 
  addDays 
} from 'date-fns';

// Import shared styles and animations
import { fadeIn, staggerContainer, itemFadeIn, cardVariants, buttonVariants } from "@/styles/animations";
import { cardStyles, buttonStyles, typography, sectionSpacing, formStyles } from "@/styles/layout";

// Types
interface Attendee {
  id: string;
  full_name: string;
  avatar_url: string | null;
  is_organizer: boolean;
}

interface Material {
  id: string;
  title: string;
  url: string;
  type: 'document' | 'link' | 'video' | 'other';
  created_at: string;
}

interface Discussion {
  id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface Session {
  id: string;
  title: string;
  description: string | null;
  datetime: string;
  duration_minutes: number;
  location: string | null;
  is_online: boolean;
  meeting_link: string | null;
  group_id: string;
  group_name?: string;
  user_joined: boolean;
  attendees: Array<{
    id: string;
    full_name: string;
    avatar_url: string | null;
    is_organizer: boolean;
  }>;
  materials: Array<{
    id: string;
    title: string;
    url: string;
    type: 'document' | 'link' | 'video' | 'other';
    created_at: string;
  }>;
  discussions: Array<{
    id: string;
    content: string;
    created_at: string;
    user: {
      id: string;
      full_name: string;
      avatar_url: string | null;
    };
  }>;
}

// Define status type for better type safety
type SessionStatus = {
  text: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive' | null | undefined;
  icon: React.ElementType<{ className?: string }>; // Add className prop to icon type
};

const Session: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [newMessage, setNewMessage] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { toast } = useToast();
  
  // Format date and time for display
  const formattedDate = session?.datetime ? new Date(session.datetime).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : '';

  const formattedTime = session?.datetime ? new Date(session.datetime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }) : '';

  // Add a proper return statement with some basic JSX
  if (loading) {
    return <div>Loading session details...</div>;
  }
  
  if (!session) {
    return <div>Session not found</div>;
  }
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{session.title}</h1>
      {/* Add more JSX for the session details here */}
    </div>
  );

  const handleJoinSession = async () => {
    if (!session) return;
    
    setIsJoining(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to join the session',
          variant: 'destructive',
        });
        return;
      }

      // Add user to session attendees in study_sessions table
      const { error } = await supabase
        .from('study_sessions')
        .update({
          // Use type assertion to inform TypeScript about the attendees field
          attendees: [
            ...(session.attendees || []),
            {
              id: user.id,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              avatar_url: user.user_metadata?.avatar_url || null,
              is_organizer: false
            }
          ]
        } as any) // Type assertion to handle the attendees field
        .eq('id', session.id);

      if (error) throw error;

      // Update local state
      setSession(prev => ({
        ...prev!,
        user_joined: true,
        attendees: [
          ...(prev?.attendees || []),
          {
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            avatar_url: user.user_metadata?.avatar_url || null,
            is_organizer: false
          }
        ]
      }));

      toast({
        title: 'Success!',
        description: 'You have successfully joined the session',
      });
    } catch (error) {
      console.error('Error joining session:', error);
      toast({
        title: 'Error',
        description: 'Failed to join the session. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
    }
  };
  const navigate = useNavigate();
  
  // Function to create mock session data
  const createMockSession = (): Session => ({
    id: sessionId || 'mock-session',
    title: 'Study Session',
    description: 'This is a mock session for development purposes.',
    datetime: new Date().toISOString(),
    duration_minutes: 60,
    location: 'Online',
    is_online: true,
    meeting_link: 'https://meet.google.com/example',
    group_id: 'mock-group',
    group_name: 'Study Group',
    user_joined: false,
    attendees: [
      {
        id: 'user1',
        full_name: 'John Doe',
        avatar_url: null,
        is_organizer: true
      }
    ],
    materials: [],
    discussions: []
  });

  // Mock data for development - remove in production
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !session && !loading) {
      setSession(createMockSession());
      setLoading(false);
    }
  }, [sessionId, loading]);

  // Fetch session data from the database
  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;
      
      setLoading(true);
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Fetch the session with related data
        const { data: sessionData, error: sessionError } = await supabase
          .from('study_sessions')
          .select(`
            *,
            groups (name),
            group_members!inner (
              user_id,
              is_organizer,
              profiles (id, full_name, avatar_url)
            ),
            session_materials (*),
            session_discussions (
              id,
              content,
              created_at,
              user:profiles (id, full_name, avatar_url)
            )
          `)
          .eq('id', sessionId)
          .single();

        if (sessionError) throw sessionError;
        if (!sessionData) throw new Error('Session not found');

        // Transform the data to match our Session interface
        const transformedSession: Session = {
            attendees: undefined, discussions: undefined, materials: undefined, user_joined: false,
            id: sessionData.id,
          title: sessionData.title,
          description: sessionData.description,
          datetime: sessionData.datetime,
          duration_minutes: sessionData.duration_minutes,
          location: sessionData.location,
          is_online: sessionData.is_online,
          meeting_link: sessionData.meeting_link,
          group_id: sessionData.group_id,
          group_name: (sessionData.groups as any)?.name || 'Unknown Group'
        };

        setSession(transformedSession);
      } catch (error) {
        console.error('Error fetching session:', error);
        toast({
          title: 'Error',
          description: 'Failed to load session data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, toast]);

  // Handle joining/leaving a session
  const handleJoinLeaveSession = async () => {
    if (!sessionId || !session) return;
    
    setIsJoining(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (session.user_joined) {
        // Leave session
        const { error } = await supabase
          .from('group_members')
          .delete()
          .eq('group_id', session.group_id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Join session
        const { error } = await supabase
          .from('group_members')
          .upsert({
            group_id: session.group_id,
            user_id: user.id,
            is_organizer: false
          });

        if (error) throw error;
      }

      // Update local state to reflect the change
      setSession(prev => prev ? {
        ...prev,
        user_joined: !prev.user_joined,
        attendees: prev.user_joined
          ? prev.attendees.filter(a => a.id !== user.id)
          : [
              ...prev.attendees,
              {
                id: user.id,
                full_name: user.user_metadata?.full_name || 'You',
                avatar_url: user.user_metadata?.avatar_url || null,
                is_organizer: false
              }
            ]
      } : null);

      // TODO: Implement actual join session logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: 'Success!',
        description: 'You have joined the study session',
      });
      setSession(prev => prev ? { ...prev, user_joined: true } : null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to join the session',
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    // TODO: Implement actual message sending
    const newMsg = {
      id: `msg-${Date.now()}`,
      content: newMessage,
      created_at: new Date().toISOString(),
      user: {
        id: 'current-user',
        full_name: 'You',
        avatar_url: null
      }
    };
    
    setSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        discussions: [newMsg, ...prev.discussions]
      };
    });
    
    setNewMessage('');
  };

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        // const { data, error } = await supabase
        //   .from("study_sessions")
        //   .select(`
        //     *,
        //     groups (name),
        //     attendees:session_attendees(user_id, users (id, full_name, avatar_url)),
        //     materials:session_materials(id, title, url, type, created_at),
        //     discussions:session_messages(
        //       id,
        //       content,
        //       created_at,
        //       user:users (id, full_name, avatar_url)
        //     )
        //   `)
        //   .eq("id", sessionId)
        //   .single();

        // if (error) throw error;

        // Mock data for now
        await new Promise(resolve => setTimeout(resolve, 500));
        setSession(createMockSession());
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || 'Failed to load session details',
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId, toast]);

  // Loading state - check this first
  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8"
      >
        <div className="container mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-white/80 rounded-lg w-1/3 shadow-sm"></div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div className="h-80 bg-white/90 rounded-xl shadow-sm"></div>
                <div className="space-y-4 p-6 bg-white/90 rounded-xl shadow-sm">
                  <div className="h-6 bg-muted/30 rounded w-1/4"></div>
                  <div className="h-4 bg-muted/30 rounded w-3/4"></div>
                  <div className="h-4 bg-muted/30 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-white/90 rounded-xl shadow-sm"></div>
                <div className="h-64 bg-white/90 rounded-xl shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // If no session, show 'not found' message
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Session not found</h2>
          <p className="mt-2 text-gray-600">The requested session could not be found or you don't have permission to view it.</p>
          <Button 
            className="mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 transition-all transform hover:-translate-y-0.5"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Return to previous page
          </Button>
        </div>
      </div>
    );
  }

  // Calculate session status
  const now = new Date();
  const sessionStart = session ? new Date(session.datetime) : null;
  const endTime = sessionStart ? new Date(sessionStart.getTime() + (session.duration_minutes * 60 * 1000)) : null;
  
  const isPastSession = sessionStart ? now > endTime! : false;
  const isHappeningNow = sessionStart ? now >= sessionStart && now <= endTime! : false;
  
  // Calculate time until session starts
  const timeLeft = sessionStart && !isPastSession && !isHappeningNow
    ? `starts ${formatDistanceToNow(sessionStart, { addSuffix: true })}`
    : '';

  // Determine status based on session time
  const status = isPastSession
    ? { 
        text: 'Completed', 
        variant: 'secondary' as const,
        icon: CheckCircle2 
      }
    : isHappeningNow
      ? { 
          text: 'In Progress', 
          variant: 'default' as const,
          icon: Clock 
        }
      : { 
          text: 'Upcoming', 
          variant: 'outline' as const,
          icon: Calendar 
        };

  const StatusIcon = status.icon;

  // Main component return
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div variants={fadeIn} className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="group -ml-2 transition-colors hover:bg-accent/50"
        >
          <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to {session.group_name ? session.group_name : 'Group'}
        </Button>
        
        {/* Session Status Banner */}
        <div className={`mt-4 p-4 rounded-lg ${
          isPastSession 
            ? 'bg-muted/50 border border-muted-foreground/10' 
            : isHappeningNow 
              ? 'bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20' 
              : 'bg-secondary/10 border border-secondary/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              isPastSession 
                ? 'bg-muted-foreground/10 text-muted-foreground' 
                : isHappeningNow 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-secondary/10 text-secondary'
            }`}>
              <StatusIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">
                {isPastSession 
                  ? 'This session has ended' 
                  : isHappeningNow 
                    ? 'Session in progress' 
                    : `Session ${timeLeft}`}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isPastSession 
                  ? `Ended on ${format(new Date(session.datetime), 'MMMM d, yyyy')}` 
                  : isHappeningNow 
                    ? `Ends ${formatDistanceToNow(endTime, { addSuffix: true })}`
                    : `Starts on ${format(new Date(session.datetime), 'EEEE, MMMM d, yyyy')}`}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            variants={fadeIn}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20 p-6 transition-all hover:shadow-md"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    {session.title}
                  </h1>
                  <Badge 
                    variant={status.variant} 
                    className={`${isHappeningNow ? 'animate-pulse' : ''} border-opacity-50`}
                  >
                    <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                    {status.text}
                  </Badge>
                </div>
                
                {session.group_name && (
                  <Link 
                    to={`/group/${session.group_id}`}
                    className="inline-flex items-center text-sm text-primary hover:underline group transition-colors"
                  >
                    <Users className="h-4 w-4 mr-1.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-muted-foreground group-hover:text-primary transition-colors">
                      {session.group_name}
                    </span>
                  </Link>
                )}
                
                {!isPastSession && (
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Clock className="h-4 w-4 mr-1.5" />
                    {formattedDate} • {formattedTime} • {session.duration_minutes} min
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" className="rounded-full">
                        <Bookmark className="h-4 w-4" />
                        <span className="sr-only">Save</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Save for later</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" className="rounded-full">
                        <Share2 className="h-4 w-4" />
                        <span className="sr-only">Share</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Share session</TooltipContent>
                  </Tooltip>
                  
                  {!isPastSession && (
                    <Button 
                      onClick={handleJoinSession}
                      disabled={isJoining || session.user_joined}
                      className="gap-2 whitespace-nowrap transition-all duration-300"
                      size={session.user_joined ? 'default' : 'default'}
                      variant={session.user_joined ? 'outline' : 'default'}
                    >
                      {isJoining ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Joining...
                        </>
                      ) : session.user_joined ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Joined
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Join Session
                        </>
                      )}
                    </Button>
                  )}
                </TooltipProvider>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-1 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center text-muted-foreground mb-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">When</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-lg font-semibold">{formattedDate}</p>
                  <span className="text-muted-foreground text-sm">•</span>
                  <p className="text-muted-foreground">{formattedTime}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Duration: {session.duration_minutes} minutes</p>
              </div>
              
              <div className="space-y-1 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center text-muted-foreground mb-2">
                  {session.is_online ? (
                    <Link2 className="h-4 w-4 mr-2" />
                  ) : (
                    <MapPin className="h-4 w-4 mr-2" />
                  )}
                  <span className="text-sm font-medium">{session.is_online ? 'Online Meeting' : 'Location'}</span>
                </div>
                {session.is_online && session.meeting_link ? (
                  <div>
                    <a 
                      href={session.meeting_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary hover:underline group transition-colors"
                    >
                      <span className="group-hover:underline">Join Meeting</span>
                      <ExternalLink className="h-3.5 w-3.5 ml-1.5 opacity-80 group-hover:opacity-100 transition-opacity" />
                    </a>
                    <p className="text-xs text-muted-foreground mt-1">Click to join the video call</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">{session.location || 'Location not specified'}</p>
                    {session.location && (
                      <a 
                        href={`https://maps.google.com/?q=${encodeURIComponent(session.location)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center mt-1"
                      >
                        View on map <ExternalLink className="h-3 w-3 ml-0.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-1 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Attendees</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{session.attendees.length} going</span>
                </div>
                <div className="flex items-center">
                  <div className="flex -space-x-2">
                    {session.attendees.slice(0, 5).map((attendee) => (
                      <Tooltip key={attendee.id}>
                        <TooltipTrigger asChild>
                          <Avatar className="h-8 w-8 border-2 border-background hover:z-10 hover:scale-110 transition-transform">
                            <AvatarImage src={attendee.avatar_url || ''} alt={attendee.full_name} />
                            <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-secondary/20">
                              {attendee.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>{attendee.full_name}{attendee.is_organizer ? ' (Organizer)' : ''}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {session.attendees.length > 5 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium hover:bg-muted/80 transition-colors">
                            +{session.attendees.length - 5}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>{session.attendees.length - 5} more attendees</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  
                  {!isPastSession && session.attendees.length < 10 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-2 h-8 w-8 rounded-full">
                          <UserPlus className="h-4 w-4" />
                          <span className="sr-only">Invite</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Invite others</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
              
              <div className="space-y-1 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center text-muted-foreground mb-2">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Discussion</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  {session.discussions.length > 0 
                    ? `${session.discussions.length} message${session.discussions.length === 1 ? '' : 's'}` 
                    : 'No messages yet'}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setActiveTab('discussion')}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {session.discussions.length > 0 ? 'View Discussion' : 'Start Discussion'}
                </Button>
              </div>
            </div>

            {session.description && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">About This Session</h3>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <p className="whitespace-pre-line">{session.description}</p>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="secondary" className="px-3 py-1 text-xs">
                    {session.duration_minutes} min
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1 text-xs">
                    {session.is_online ? 'Online' : 'In-Person'}
                  </Badge>
                  {session.is_online && session.meeting_link && (
                    <Badge variant="secondary" className="px-3 py-1 text-xs">
                      Video Call
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          <motion.div variants={fadeIn} className="mt-6">
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="w-full"
              defaultValue="details"
            >
              <TabsList className="inline-flex h-14 items-center justify-between rounded-2xl bg-white/80 backdrop-blur-sm p-1.5 w-full border border-white/20 shadow-sm">
                <TabsTrigger 
                  value="details"
                  className="flex-1 flex items-center justify-center space-x-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-muted/50 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-indigo-100"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Details</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="materials"
                  className="flex-1 flex items-center justify-center space-x-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-muted/50 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-indigo-100"
                >
                  <FileText className="h-4 w-4" />
                  <span>Materials {session.materials?.length > 0 && `(${session.materials.length})`}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="discussion"
                  className="flex-1 flex items-center justify-center space-x-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-muted/50 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-indigo-100"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Discussion {session.discussions?.length > 0 && `(${session.discussions.length})`}</span>
                </TabsTrigger>
              </TabsList>
              
            
            <TabsContent value="details" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Session Agenda</CardTitle>
                  <CardDescription>What we'll cover in this session</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-primary mt-1.5" />
                        <div className="flex-1 w-px bg-border my-1" />
                      </div>
                      <div>
                        <h4 className="font-medium">Introduction</h4>
                        <p className="text-sm text-muted-foreground">5 min</p>
                        <p className="mt-1 text-sm">Overview of advanced React patterns and what to expect</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-primary mt-1.5" />
                        <div className="flex-1 w-px bg-border my-1" />
                      </div>
                      <div>
                        <h4 className="font-medium">Compound Components</h4>
                        <p className="text-sm text-muted-foreground">30 min</p>
                        <p className="mt-1 text-sm">Building flexible components with compound patterns</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-primary mt-1.5" />
                        <div className="flex-1 w-px bg-border my-1" />
                      </div>
                      <div>
                        <h4 className="font-medium">Render Props</h4>
                        <p className="text-sm text-muted-foreground">30 min</p>
                        <p className="mt-1 text-sm">Sharing code between components using render props</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-primary mt-1.5" />
                      </div>
                      <div>
                        <h4 className="font-medium">Q&A and Wrap-up</h4>
                        <p className="text-sm text-muted-foreground">15 min</p>
                        <p className="mt-1 text-sm">Questions, discussion, and next steps</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="materials" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Study Materials</CardTitle>
                  <CardDescription>Resources for this session</CardDescription>
                </CardHeader>
                <CardContent>
                  {session.materials.length > 0 ? (
                    <div className="space-y-3">
                      {session.materials.map(material => (
                        <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-primary/10 text-primary">
                              {material.type === 'video' ? (
                                <Video className="h-5 w-5" />
                              ) : material.type === 'link' ? (
                                <Link2 className="h-5 w-5" />
                              ) : (
                                <FileText className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium">{material.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                Added {formatDistanceToNow(new Date(material.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={material.url} target="_blank" rel="noopener noreferrer">
                              View
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-medium">No materials yet</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Check back later or contact the organizer</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="discussion" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Discussion</CardTitle>
                  <CardDescription>Ask questions and discuss with other participants</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSendMessage} className="space-y-4">
                    <Textarea
                      placeholder="Ask a question or share something with the group..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" disabled={!newMessage.trim()}>
                        Post Message
                      </Button>
                    </div>
                  </form>
                  
                  <div className="mt-6 space-y-6">
                    {session.discussions.map(message => (
                      <div key={message.id} className="flex gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={message.user.avatar_url || ''} />
                          <AvatarFallback className="text-xs">
                            {message.user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{message.user.full_name}</h4>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="mt-1 text-sm">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {session.discussions.length === 0 && (
                      <div className="text-center py-8">
                        <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground" />
                        <h3 className="mt-2 text-sm font-medium">No messages yet</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Be the first to start the discussion</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendees</CardTitle>
              <CardDescription>{session?.attendees?.length || 0} people attending</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {session.attendees.map(attendee => (
                  <div key={attendee.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={attendee.avatar_url || ''} />
                        <AvatarFallback className="text-xs">
                          {attendee.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {attendee.full_name}
                          {attendee.is_organizer && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                              Organizer
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {attendee.is_organizer ? 'Hosting this session' : 'Attending'}
                        </p>
                      </div>
                    </div>
                    {!attendee.is_organizer && (
                      <Button variant="outline" size="sm">
                        Message
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              {!session.user_joined && !isPastSession && (
                <Button className="w-full mt-4" onClick={handleJoinSession} disabled={isJoining}>
                  {isJoining ? 'Joining...' : 'Join This Session'}
                </Button>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="text-center">
                    <div className="text-sm font-medium">NOV</div>
                    <div className="text-2xl font-bold">28</div>
                  </div>
                  <div>
                    <h4 className="font-medium">React Hooks Deep Dive</h4>
                    <p className="text-sm text-muted-foreground">2:00 PM - 3:30 PM</p>
                    <p className="text-xs text-muted-foreground mt-1">React Enthusiasts</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="text-center opacity-60">
                    <div className="text-sm font-medium">DEC</div>
                    <div className="text-2xl font-bold">05</div>
                  </div>
                  <div className="opacity-60">
                    <h4 className="font-medium">State Management with Redux</h4>
                    <p className="text-sm text-muted-foreground">4:00 PM - 5:30 PM</p>
                    <p className="text-xs text-muted-foreground mt-1">React Enthusiasts</p>
                  </div>
                </div>
              </div>
              
              <Button variant="outline" className="w-full mt-4">
                View All Sessions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default Session;
