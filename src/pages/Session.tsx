import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
    Users,
    MapPin,
    Link2,
    ChevronLeft,
    Calendar,
    Clock,
    Video,
    UserPlus,
    CheckCircle2,
    ExternalLink,
    Copy,
    Smartphone
} from "lucide-react";

interface Session {
    id: string;
    title: string;
    description: string | null;
    datetime: string;
    duration_minutes: number;
    location: string | null;
    is_online: boolean;
    meeting_link: string | null;
    zoom_meeting_id?: string | null;
    zoom_join_url?: string | null;
    zoom_password?: string | null;
    zoom_host_url?: string | null;
    group_id: string;
    group_name?: string;
}

const Session = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        const fetchSession = async () => {
            if (!sessionId) return;
            
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('User not authenticated');

                // Fetch session with group info
                const { data: sessionData, error: sessionError } = await supabase
                    .from('study_sessions')
                    .select(`
                        *,
                        groups (name)
                    `)
                    .eq('id', sessionId)
                    .single();

                if (sessionError) throw sessionError;
                if (!sessionData) throw new Error('Session not found');

                const transformedSession: Session = {
                    id: sessionData.id,
                    title: sessionData.title,
                    description: sessionData.description,
                    datetime: sessionData.datetime,
                    duration_minutes: sessionData.duration_minutes || 60, // Default to 60 if not set
                    location: sessionData.location,
                    is_online: sessionData.is_online,
                    meeting_link: sessionData.meeting_link,
                    // Handle cases where Zoom fields might not exist yet (migration not applied)
                    zoom_meeting_id: (sessionData as any).zoom_meeting_id || null,
                    zoom_join_url: (sessionData as any).zoom_join_url || null,
                    zoom_password: (sessionData as any).zoom_password || null,
                    zoom_host_url: (sessionData as any).zoom_host_url || null,
                    group_id: sessionData.group_id,
                    group_name: (sessionData.groups as any)?.name || 'Unknown Group'
                };

                // Debug logging to check what data we're getting
                console.log('Session data from DB:', sessionData);
                console.log('Transformed session:', transformedSession);

                setSession(transformedSession);
            } catch (error: any) {
                console.error('Error fetching session:', error);
                toast({
                    title: 'Error',
                    description: error.message || 'Failed to load session',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchSession();
    }, [sessionId, toast]);

    const handleJoinSession = async () => {
        if (!session) return;
        
        console.log('Join session clicked. Session data:', session);
        console.log('Is online:', session.is_online);
        console.log('Zoom join URL:', session.zoom_join_url);
        console.log('Meeting link:', session.meeting_link);
        
        setIsJoining(true);
        try {
            // For Zoom meetings, open the Zoom join URL
            if (session.is_online && session.zoom_join_url) {
                console.log('Opening Zoom meeting:', session.zoom_join_url);
                window.open(session.zoom_join_url, '_blank', 'noopener,noreferrer');
                toast({
                    title: 'Opening Zoom...',
                    description: 'Redirecting you to the Zoom meeting',
                });
            } else if (session.is_online && session.meeting_link) {
                console.log('Opening meeting link:', session.meeting_link);
                window.open(session.meeting_link, '_blank', 'noopener,noreferrer');
                toast({
                    title: 'Opening meeting...',
                    description: 'Redirecting you to the meeting link',
                });
            } else {
                console.log('No meeting link found, showing generic join message');
                // For in-person sessions or sessions without links
                await new Promise(resolve => setTimeout(resolve, 1000));
                toast({
                    title: 'Joined!',
                    description: session.is_online 
                        ? 'You have joined this online session'
                        : 'You have marked yourself as attending this in-person session',
                });
            }
        } catch (error) {
            console.error('Error in handleJoinSession:', error);
            toast({
                title: 'Error',
                description: 'Failed to join session',
                variant: 'destructive',
            });
        } finally {
            setIsJoining(false);
        }
    };

    const handleCopyMeetingInfo = () => {
        if (!session) return;
        
        let meetingInfo = '';
        if (session.is_online && session.zoom_meeting_id) {
            meetingInfo = `Zoom Meeting\nMeeting ID: ${session.zoom_meeting_id}`;
            if (session.zoom_password) {
                meetingInfo += `\nPassword: ${session.zoom_password}`;
            }
            meetingInfo += `\nJoin URL: ${session.zoom_join_url}`;
        } else if (session.is_online && session.meeting_link) {
            meetingInfo = `Meeting Link: ${session.meeting_link}`;
        } else {
            meetingInfo = `Location: ${session.location || 'TBD'}`;
        }
        
        navigator.clipboard.writeText(meetingInfo);
        toast({
            title: 'Copied!',
            description: 'Meeting information copied to clipboard',
        });
    };

    const handleCopyJoinUrl = () => {
        if (!session?.zoom_join_url) return;
        
        navigator.clipboard.writeText(session.zoom_join_url);
        toast({
            title: 'Link Copied!',
            description: 'Zoom join link copied to clipboard',
        });
    };

    // Format date and time
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading session...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex items-center justify-center">
                <Card className="max-w-md w-full">
                    <CardContent className="p-8 text-center">
                        <h2 className="text-2xl font-bold mb-4">Session not found</h2>
                        <p className="text-muted-foreground mb-6">The session you're looking for doesn't exist.</p>
                        <Button onClick={() => navigate(-1)}>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );

    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Back Button */}
                    <Button 
                        variant="ghost" 
                        onClick={() => navigate(-1)} 
                        className="mb-6"
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back to {session.group_name}
                    </Button>

                    {/* Debug Info - Remove in production */}
                    {process.env.NODE_ENV === 'development' && (
                        <Card className="mb-6 border-yellow-200 bg-yellow-50">
                            <CardContent className="p-4">
                                <h4 className="font-semibold text-yellow-800 mb-2">Debug Info</h4>
                                <div className="text-xs text-yellow-700 space-y-1">
                                    <p>Is Online: {session?.is_online ? 'Yes' : 'No'}</p>
                                    <p>Meeting Link: {session?.meeting_link || 'None'}</p>
                                    <p>Zoom Meeting ID: {session?.zoom_meeting_id || 'None'}</p>
                                    <p>Zoom Join URL: {session?.zoom_join_url || 'None'}</p>
                                    <p>Zoom Password: {session?.zoom_password || 'None'}</p>
                                </div>
                                <div className="mt-3 pt-3 border-t border-yellow-300">
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => window.open('https://zoom.us/test', '_blank')}
                                        className="text-xs"
                                    >
                                        Test Join (Zoom Test Link)
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Main Session Card */}
                    <Card className="mb-8 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <div>
                                    <CardTitle className="text-2xl sm:text-3xl mb-2">{session.title}</CardTitle>
                                    {session.group_name && (
                                        <Link 
                                            to={`/group/${session.group_id}`}
                                            className="inline-flex items-center text-blue-100 hover:text-white transition-colors"
                                        >
                                            <Users className="h-4 w-4 mr-2" />
                                            {session.group_name}
                                        </Link>
                                    )}
                                </div>
                                <Badge className="bg-white/20 text-white border-white/30">
                                    {session.is_online ? 'Online' : 'In-Person'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Date and Time */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Calendar className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Date</p>
                                        <p className="text-muted-foreground">{formatDate(session.datetime)}</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Clock className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Time</p>
                                        <p className="text-muted-foreground">
                                            {formatTime(session.datetime)} ({session.duration_minutes} minutes)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Location / Meeting Info */}
                            <div className="flex items-start space-x-3 mb-6">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    {session.is_online ? (
                                        <Video className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <MapPin className="h-5 w-5 text-green-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium mb-3">
                                        {session.is_online ? 'Online Meeting' : 'Location'}
                                    </p>
                                    {session.is_online ? (
                                        <div className="space-y-4">
                                            {session.zoom_join_url ? (
                                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="p-2 bg-blue-600 rounded-lg">
                                                                <Video className="h-4 w-4 text-white" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-blue-900">Zoom Meeting</h4>
                                                                <p className="text-sm text-blue-700">Click below to join the session</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={handleCopyJoinUrl}
                                                                className="h-8 px-2"
                                                            >
                                                                <Copy className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                                                            <p className="text-xs text-blue-600 font-medium mb-1">Meeting ID</p>
                                                            <p className="font-mono text-sm font-semibold">{session.zoom_meeting_id}</p>
                                                        </div>
                                                        {session.zoom_password && (
                                                            <div className="bg-white rounded-lg p-3 border border-blue-100">
                                                                <p className="text-xs text-blue-600 font-medium mb-1">Password</p>
                                                                <p className="font-mono text-sm font-semibold">{session.zoom_password}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex flex-col sm:flex-row gap-2">
                                                        <Button 
                                                            asChild
                                                            size="lg" 
                                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                                        >
                                                            <a 
                                                                href={session.zoom_join_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center justify-center"
                                                            >
                                                                <Video className="h-4 w-4 mr-2" />
                                                                Join Zoom Meeting
                                                                <ExternalLink className="h-4 w-4 ml-2" />
                                                            </a>
                                                        </Button>
                                                        
                                                        <Button
                                                            size="lg"
                                                            variant="outline"
                                                            onClick={handleCopyMeetingInfo}
                                                            className="px-4"
                                                        >
                                                            <Copy className="h-4 w-4 mr-2" />
                                                            Copy Info
                                                        </Button>
                                                    </div>
                                                    
                                                    <div className="mt-3 pt-3 border-t border-blue-200">
                                                        <div className="flex items-center justify-between text-xs text-blue-600">
                                                            <div className="flex items-center space-x-1">
                                                                <Smartphone className="h-3 w-3" />
                                                                <span>Works on desktop and mobile</span>
                                                            </div>
                                                            <a 
                                                                href="https://zoom.us/download" 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="hover:underline"
                                                            >
                                                                Download Zoom app
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : session.meeting_link ? (
                                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="p-2 bg-green-600 rounded-lg">
                                                                <Link2 className="h-4 w-4 text-white" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-green-900">Online Meeting</h4>
                                                                <p className="text-sm text-green-700">External meeting platform</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <Button 
                                                        asChild
                                                        size="lg" 
                                                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                                                    >
                                                        <a 
                                                            href={session.meeting_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center justify-center"
                                                        >
                                                            <Link2 className="h-4 w-4 mr-2" />
                                                            Join Meeting
                                                            <ExternalLink className="h-4 w-4 ml-2" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                                    <div className="flex items-center space-x-2 text-gray-600">
                                                        <Video className="h-4 w-4" />
                                                        <span className="text-sm">Meeting link will be provided by the session host</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
                                            <div className="flex items-center space-x-2">
                                                <div className="p-2 bg-orange-600 rounded-lg">
                                                    <MapPin className="h-4 w-4 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-orange-900">In-Person Location</h4>
                                                    <p className="text-orange-700">
                                                        {session.location || 'Location to be determined'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            {session.description && (
                                <div className="mb-6">
                                    <h3 className="font-medium mb-2">Description</h3>
                                    <p className="text-muted-foreground whitespace-pre-line">
                                        {session.description}
                                    </p>
                                </div>
                            )}

                            {/* Action Button */}
                            <div className="flex justify-center">
                                <Button 
                                    onClick={handleJoinSession}
                                    disabled={isJoining}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
                                >
                                    {isJoining ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            {session.is_online && session.zoom_join_url ? 'Opening Zoom...' : 'Joining...'}
                                        </>
                                    ) : (
                                        <>
                                            {session.is_online && session.zoom_join_url ? (
                                                <>
                                                    <Video className="h-5 w-5 mr-2" />
                                                    Join Zoom Session
                                                </>
                                            ) : session.is_online ? (
                                                <>
                                                    <UserPlus className="h-5 w-5 mr-2" />
                                                    Join Online Session
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="h-5 w-5 mr-2" />
                                                    Mark Attendance
                                                </>
                                            )}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Additional Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Session Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Open to all group members</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Free to attend</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default Session;
