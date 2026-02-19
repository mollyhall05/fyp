// Extend the Navigator interface to include the Web Cal API
declare global {
  interface Navigator {
    calendar?: {
      presentEventEditor: (options: {
        title: string;
        startDate: string;
        endDate: string;
        location?: string;
        notes?: string;
      }) => Promise<void>;
    };
  }
}

interface CalendarEvent {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  isOnline: boolean;
  meetingLink?: string;
}

export const addToCalendar = async (event: CalendarEvent) => {
  // Try Web Cal API first (works on iOS/macOS)
  if (navigator.calendar) {
    try {
      await navigator.calendar.presentEventEditor({
        title: event.title,
        startDate: event.start.toISOString(),
        endDate: event.end.toISOString(),
        location: event.location || (event.isOnline && event.meetingLink) || undefined,
        notes: event.description,
      });
      return { success: true, provider: 'native' };
    } catch (error) {
      console.warn('Native calendar API failed, falling back to download', error);
    }
  }

  // Fallback to .ics download for other platforms
  return downloadIcsFile(event);
};

const downloadIcsFile = (event: CalendarEvent) => {
  // Format date in ICS format: YYYYMMDDTHHmmssZ
  const formatDate = (date: Date) => {
    return date.toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')
      .replace('Z', 'Z')
      .replace(/-/g, '')
      .replace(/:/g, '');
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//StudySync//StudySync Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTAMP:${formatDate(new Date())}`,
    `UID:${Date.now()}@studysync`,
    `DTSTART:${formatDate(event.start)}`,
    `DTEND:${formatDate(event.end)}`,
    `SUMMARY:${escapeContent(event.title)}`,
    ...(event.description ? [`DESCRIPTION:${escapeContent(event.description)}`] : []),
    ...(event.location ? [`LOCATION:${escapeContent(event.location)}`] : 
       (event.isOnline && event.meetingLink) ? [`LOCATION:${escapeContent(event.meetingLink)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  // Create and trigger download
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `study-session-${event.start.toISOString().split('T')[0]}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, provider: 'ics' };
};

// Helper to escape special characters in ICS content
const escapeContent = (content: string) => {
  return content
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\\/g, '\\\\');
};

// Google Calendar helper
export const addToGoogleCalendar = (event: CalendarEvent) => {
  const startDate = event.start.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const endDate = event.end.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  
  const url = new URL('https://www.google.com/calendar/render');
  url.searchParams.append('action', 'TEMPLATE');
  url.searchParams.append('text', event.title);
  url.searchParams.append('dates', `${startDate}/${endDate}`);
  if (event.description) {
    url.searchParams.append('details', event.description);
  }
  if (event.location || (event.isOnline && event.meetingLink)) {
    url.searchParams.append('location', event.location || event.meetingLink || '');
  }
  
  window.open(url.toString(), '_blank');
  return { success: true, provider: 'google' };
};
