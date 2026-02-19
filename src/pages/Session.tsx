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
    CheckCircle2
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
                    duration_minutes: sessionData.duration_minutes,
                    location: sessionData.location,
                    is_online: sessionData.is_online,
                    meeting_link: sessionData.meeting_link,
                    group_id: sessionData.group_id,
                    group_name: (sessionData.groups as any)?.name || 'Unknown Group'
                };

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
        
        setIsJoining(true);
        try {
            // For now, just show a success message
            // TODO: Implement actual join logic
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast({
                title: 'Success!',
                description: 'You have joined the session',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to join session',
                variant: 'destructive',
            });
        } finally {
            setIsJoining(false);
        }
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

                            {/* Location */}
                            <div className="flex items-start space-x-3 mb-6">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    {session.is_online ? (
                                        <Video className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <MapPin className="h-5 w-5 text-green-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">
                                        {session.is_online ? 'Online Meeting' : 'Location'}
                                    </p>
                                    {session.is_online ? (
                                        session.meeting_link ? (
                                            <a 
                                                href={session.meeting_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline inline-flex items-center"
                                            >
                                                Join Meeting
                                                <Link2 className="h-4 w-4 ml-1" />
                                            </a>
                                        ) : (
                                            <p className="text-muted-foreground">Meeting link will be provided</p>
                                        )
                                    ) : (
                                        <p className="text-muted-foreground">
                                            {session.location || 'Location to be determined'}
                                        </p>
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
                                            Joining...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="h-5 w-5 mr-2" />
                                            Join Session
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
