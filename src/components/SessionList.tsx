import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Session {
    id: string;
    title: string;
    description: string;
    session_date: string;
    duration_minutes: number;
    location: string;
    is_online: boolean;
    meeting_link: string;
}

interface SessionListProps {
    groupId: string;
}

export const SessionList = ({ groupId }: SessionListProps) => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        loadSessions();
    }, [groupId]);

    const loadSessions = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("study_sessions")
                .select("*")
                .eq("group_id", groupId)
                .order("session_date", { ascending: true });

            if (error) throw error;
            setSessions(data || []);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <p className="text-center text-muted-foreground">Loading sessions...</p>;
    }

    if (sessions.length === 0) {
        return (
            <Card className="shadow-soft">
                <CardContent className="py-12 text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                        No sessions scheduled yet. Be the first to create one!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {sessions.map((session) => (
                <Card key={session.id} className="shadow-soft hover:shadow-medium transition-shadow">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <CardTitle className="mb-2">{session.title}</CardTitle>
                                <CardDescription>{session.description}</CardDescription>
                            </div>
                            <Badge className={session.is_online ? "bg-accent" : "bg-gradient-primary"}>
                                {session.is_online ? "Online" : "In-Person"}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(session.session_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>
                  {new Date(session.session_date).toLocaleTimeString()} ({session.duration_minutes} min)
                </span>
                            </div>
                            {session.is_online && session.meeting_link && (
                                <div className="flex items-center gap-2">
                                    <Video className="h-4 w-4 text-accent" />
                                    <a
                                        href={session.meeting_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-accent hover:underline"
                                    >
                                        Join Meeting
                                    </a>
                                </div>
                            )}
                            {!session.is_online && session.location && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    <span>{session.location}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
