import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Apple, CalendarPlus, ExternalLink, Clock, MapPin, Video, Loader2, Sparkles } from "lucide-react";
import { addToCalendar, addToGoogleCalendar } from "@/lib/calendar";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    meetingLink: any;
    description?: string;
    location?: string;
    isOnline: boolean;
    groupName: string;
  };
}

interface SessionData {
  id: string;
  title: string;
  datetime: string;
  duration_minutes: number;
  description?: string;
  location?: string;
  meeting_link?: string;
  is_online: boolean;
  groups?: {
    name: string;
  };
}

type CalendarProvider = 'default' | 'google' | 'apple';

const CalendarView = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get all groups the user is a member of
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (!memberships?.length) {
        setLoading(false);
        return;
      }

      const groupIds = memberships.map(m => m.group_id);

      // Get all sessions for these groups
      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select(`
          *,
          groups (name)
        `)
        .in('group_id', groupIds)
        .gte('datetime', new Date().toISOString())
        .order('datetime', { ascending: true });

      if (error) throw error;

      // Transform sessions into calendar events
      const calendarEvents = sessions.map(session => ({
        id: session.id,
        title: session.title,
        start: session.datetime,
        end: new Date(new Date(session.datetime).getTime() + (session.duration_minutes * 60000)).toISOString(),
        extendedProps: {
          description: session.description,
          location: session.is_online ? session.meeting_link : session.location,
          isOnline: session.is_online,
          groupName: session.groups?.name || 'Unknown Group'
        }
      }));

      // setEvents(calendarEvents);
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load study sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderEventCard = (event: CalendarEvent) => {
    const handleAddToCalendar = async (provider: CalendarProvider = 'default') => {
      try {
        let result;
        if (provider === 'google') {
          result = addToGoogleCalendar({
              title: event.title,
              description: event.extendedProps.description,
              start: event.start,
              end: event.end,
              location: event.extendedProps.location,
              isOnline: event.extendedProps.isOnline,
              meetingLink: event.extendedProps.meetingLink
          });
        } else {
          result = await addToCalendar({
            title: event.title,
            description: event.extendedProps.description,
            start: new Date(event.start),
            end: new Date(event.end),
            location: event.extendedProps.location,
            isOnline: event.extendedProps.isOnline,
            meetingLink: event.extendedProps.meetingLink
          });
        }
        
        toast({
          title: "Success",
          description: `Event added to ${result.provider === 'native' ? 'your calendar' : result.provider === 'google' ? 'Google Calendar' : 'your calendar app'}`,
        });
      } catch (error: any) {
        console.error('Error adding to calendar:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to add to calendar",
          variant: "destructive",
        });
      }
    };

    return (
      <motion.div 
        className="p-6 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border border-purple-600/20 hover:border-purple-600/40 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 rounded-xl cursor-pointer"
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.2 }}
        onClick={() => window.location.href = `/session/${event.id}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {event.title}
              </h4>
              <Badge 
                variant={event.extendedProps.isOnline ? "outline" : "default"}
                className={`text-xs font-medium ${
                  event.extendedProps.isOnline 
                    ? "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200" 
                    : "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                } transition-colors`}
              >
                {event.extendedProps.isOnline ? "Online" : "In-Person"}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Sparkles className="h-4 w-4" />
              <span>{event.extendedProps.groupName}</span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{new Date(event.start).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true 
                })}</span>
              </div>
              
              <div className="flex items-center gap-1">
                {event.extendedProps.isOnline ? (
                  <>
                    <Video className="h-4 w-4" />
                    <span>Online</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    <span>{event.extendedProps.location || 'In-Person'}</span>
                  </>
                )}
              </div>
            </div>
            
            {event.extendedProps.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {event.extendedProps.description}
              </p>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg hover:bg-primary/10 transition-colors" 
                  onClick={(e) => e.stopPropagation()}
                >
                  <CalendarPlus className="h-4 w-4" />
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                handleAddToCalendar('default');
              }}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span>Add to Calendar</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                handleAddToCalendar('google');
              }}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                </svg>
                <span>Add to Google</span>
              </DropdownMenuItem>
              {navigator.userAgent.includes('Mac OS X') && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCalendar('apple');
                }}>
                  <Apple className="mr-2 h-4 w-4" />
                  <span>Add to Apple Calendar</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    );
  };

  if (error) {
    return (
      <motion.div 
        className="flex flex-col justify-center items-center py-16 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border border-purple-600/20 rounded-2xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white mb-4">
          <CalendarIcon className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load sessions</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
          {error}
        </p>
        <Button 
          onClick={() => {
            setRetryCount(0);
            setError(null);
            fetchSessions();
          }}
          className="bg-teal-700 hover:bg-teal-600 text-white"
        >
          Try Again
        </Button>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <motion.div 
        className="flex flex-col justify-center items-center h-96 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md rounded-2xl border border-purple-600/20"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-4"
        >
          <Loader2 className="h-12 w-12 text-primary" />
        </motion.div>
        <motion.p 
          className="text-lg font-medium text-foreground mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Loading your study sessions...
        </motion.p>
        <motion.p 
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Syncing with your calendar
        </motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Calendar Header */}
      <div className="mb-6 p-6 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border border-purple-600/20 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-teal-700 text-white">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Study Sessions Calendar</h3>
              <p className="text-sm text-muted-foreground">View and manage your upcoming study sessions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
              {events.length} Upcoming {events.length === 1 ? 'Session' : 'Sessions'}
            </Badge>
            {events.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/dashboard'}
                className="text-xs"
              >
                Create New Session
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Events List */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {events.length > 0 ? (
          events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
            >
              {renderEventCard(event)}
            </motion.div>
          ))
        ) : (
          <motion.div 
            className="flex flex-col justify-center items-center py-16 bg-card border border-primary/20 rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 text-white mb-4">
              <CalendarIcon className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No upcoming sessions</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              You don't have any study sessions scheduled. Join a study group or create a new session to get started!
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <CalendarPlus className="mr-2 h-4 w-4" />
                Create Session
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/dashboard#discover'}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Discover Groups
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};
export default CalendarView
