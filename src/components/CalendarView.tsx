import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Apple, CalendarPlus, ExternalLink, Clock, MapPin, Video, Loader2, Sparkles, List, Grid, ChevronLeft, ChevronRight } from "lucide-react";
import { addToCalendar, addToGoogleCalendar } from "@/lib/calendar";
import { motion } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<CalendarEvent | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
    
    // Make fetchSessions available globally for refresh
    (window as any).refreshCalendarSessions = fetchSessions;
    
    return () => {
      delete (window as any).refreshCalendarSessions;
    };
  }, []);

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getEventsForDay = (day: number) => {
    if (!day) return [];
    
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = date.toDateString();
    
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === dateStr;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleSessionClick = (event: CalendarEvent) => {
    setSelectedSession(event);
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setSelectedSession(null);
  };

  const handleGoToSession = () => {
    if (selectedSession) {
      window.location.href = `/session/${selectedSession.id}`;
    }
  };

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
          meetingLink: session.is_online ? session.meeting_link : null,
          description: session.description,
          location: session.is_online ? session.meeting_link : session.location,
          isOnline: session.is_online,
          groupName: session.groups?.name || 'Unknown Group'
        }
      }));

      setEvents(calendarEvents);
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

  const renderCalendarGrid = () => {
    const days = generateCalendarDays();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border border-primary/20 rounded-xl shadow-lg p-6"
      >
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth('prev')}
            className="hover:bg-primary/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold text-foreground">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth('next')}
            className="hover:bg-primary/10"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isToday = day === new Date().getDate() && 
                           currentDate.getMonth() === new Date().getMonth() && 
                           currentDate.getFullYear() === new Date().getFullYear();

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02, duration: 0.3 }}
                className={`
                  relative aspect-square border rounded-lg p-1 transition-all duration-200
                  ${day ? 'hover:bg-primary/5 cursor-pointer' : ''}
                  ${isToday ? 'bg-primary/10 border-primary' : 'border-border'}
                `}
              >
                {day && (
                  <>
                    <div className={`text-sm font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}>
                      {day}
                    </div>
                    {dayEvents.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 2).map((event, eventIndex) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (index * 0.02) + (eventIndex * 0.1), duration: 0.3 }}
                            className="text-xs p-1 rounded bg-gradient-to-r from-primary to-secondary text-primary-foreground truncate cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => handleSessionClick(event)}
                            title={event.title}
                          >
                            {event.title.length > 8 ? event.title.substring(0, 8) + '...' : event.title}
                          </motion.div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground text-center">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
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
        className="p-6 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border border-primary/20 hover:border-primary/40 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 rounded-xl cursor-pointer"
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.2 }}
        onClick={() => handleSessionClick(event)}
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
                    ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20" 
                    : "bg-secondary/10 text-secondary border-secondary/30 hover:bg-secondary/20"
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
        <div className="p-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-primary-foreground mb-4">
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
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
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

  const SessionInfoPopup = () => {
    if (!selectedSession) return null;

    return (
      <Dialog open={isPopupOpen} onOpenChange={setIsPopupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {selectedSession.title}
            </DialogTitle>
            <DialogDescription>
              Session details and information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge 
                variant={selectedSession.extendedProps.isOnline ? "outline" : "default"}
                className={`text-xs font-medium ${
                  selectedSession.extendedProps.isOnline 
                    ? "bg-blue-100 text-blue-700 border-blue-200" 
                    : "bg-green-100 text-green-700 border-green-200"
                }`}
              >
                {selectedSession.extendedProps.isOnline ? "Online" : "In-Person"}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{selectedSession.extendedProps.groupName}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(selectedSession.start).toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true 
                })}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                {selectedSession.extendedProps.isOnline ? (
                  <>
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <span>Online Session</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedSession.extendedProps.location || 'In-Person'}</span>
                  </>
                )}
              </div>
            </div>
            
            {selectedSession.extendedProps.description && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  {selectedSession.extendedProps.description}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleGoToSession}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Go to Session Page
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClosePopup}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

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
            <div className="p-3 rounded-xl bg-primary text-primary-foreground">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Study Sessions Calendar</h3>
              <p className="text-sm text-muted-foreground">View and manage your upcoming study sessions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-7 px-2 text-xs"
              >
                <List className="h-3 w-3 mr-1" />
                List
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="h-7 px-2 text-xs"
              >
                <Grid className="h-3 w-3 mr-1" />
                Calendar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Events Display */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {events.length > 0 ? (
          <>
            {viewMode === 'calendar' ? (
              renderCalendarGrid()
            ) : (
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
            )}
          </>
        ) : (
          <motion.div 
            className="flex flex-col justify-center items-center py-16 bg-card border border-primary/20 rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
              <div className="p-3 rounded-xl bg-primary text-primary-foreground">
                  <CalendarIcon className="h-6 w-6" />
              </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No upcoming sessions</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              You don't have any study sessions scheduled. Join a study group or create a new session to get started!
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <CalendarPlus className="mr-2 h-4 w-4" />
                Create Session
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
      
      <SessionInfoPopup />
    </motion.div>
  );
};
export default CalendarView
