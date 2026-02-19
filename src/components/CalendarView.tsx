import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Apple, CalendarPlus, Calendar as CalendarIcon2, ExternalLink } from "lucide-react";
import { addToCalendar, addToGoogleCalendar } from "@/lib/calendar";
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
    description?: string;
    location?: string;
    isOnline: boolean;
    groupName: string;
  };
}

export const CalendarView = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
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

  const renderEventContent = (eventInfo: any) => {
    const event = {
      title: eventInfo.event.title,
      description: eventInfo.event.extendedProps.description,
      start: eventInfo.event.start,
      end: eventInfo.event.end,
      location: eventInfo.event.extendedProps.location,
      isOnline: eventInfo.event.extendedProps.isOnline,
      meetingLink: eventInfo.event.extendedProps.meetingLink
    };

    const handleAddToCalendar = async (provider: 'default' | 'google' | 'apple' = 'default') => {
      try {
        let result;
        if (provider === 'google') {
          result = await addToGoogleCalendar(event);
        } else {
          result = await addToCalendar(event);
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
      <div className="p-2 overflow-hidden">
        <div className="font-medium truncate">{eventInfo.event.title}</div>
        <div className="text-xs text-muted-foreground truncate">
          {eventInfo.event.extendedProps.groupName}
        </div>
        <div className="flex items-center justify-between mt-1">
          <Badge 
            variant={eventInfo.event.extendedProps.isOnline ? "outline" : "default"}
            className="text-xs"
          >
            {eventInfo.event.extendedProps.isOnline ? "Online" : "In-Person"}
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                <CalendarPlus className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                handleAddToCalendar('default');
              }}>
                <CalendarIcon2 className="mr-2 h-4 w-4" />
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
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading calendar...</div>;
  }

  return (
    <div className="h-[700px] mt-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
        eventContent={renderEventContent}
        eventClick={(info) => {
          // Navigate to session details when an event is clicked
          window.location.href = `/session/${info.event.id}`;
        }}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }}
        dayMaxEventRows={3}
        height="100%"
      />
    </div>
  );
};
