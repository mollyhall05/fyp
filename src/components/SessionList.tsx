import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Video, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Import shared styles and animations
import { fadeIn, staggerContainer, itemFadeIn } from "@/styles/animations";
import { cardStyles, buttonStyles, typography } from "@/styles/layout";
import { CreateSessionDialog } from "./CreateSessionDialog";

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface Session {
    id: string;
    title: string;
    description?: string;
    datetime: string;
    group_id: string;
    duration_minutes: number;
    location?: string;
    is_online: boolean;
    meeting_link?: string;
}

interface SessionListProps {
    groupId: string;
}

export const SessionList = ({ groupId }: SessionListProps) => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const { toast } = useToast();
    
    const handleSessionCreated = () => {
        loadSessions();
        toast({
            title: "Success!",
            description: "New study session created successfully.",
        });
    };

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
                .order("datetime", { ascending: true });

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
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AnimatePresence mode="wait">
                {sessions.length === 0 ? (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                        className="text-center py-16 bg-muted/20 rounded-xl"
                    >
                        <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-foreground">No sessions yet</h3>
                        <p className="text-muted-foreground mb-6">Be the first to schedule a study session!</p>
                        <Button 
                            onClick={() => setShowCreateDialog(true)}
                            variant="outline"
                            className={buttonStyles.outline}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Create Session
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div 
                        className="space-y-4"
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                    >
                        {sessions.map((session, index) => (
                            <motion.div
                                key={session.id}
                                variants={itemFadeIn}
                                initial="hidden"
                                animate="visible"
                                transition={{ delay: index * 0.05 }}
                            >
                                <motion.div
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Card 
                                        className={`${cardStyles.base} ${cardStyles.hover} cursor-pointer`}
                                        onClick={() => navigate(`/session/${session.id}`)}
                                    >
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className={typography.h4}>
                                                        {session.title}
                                                    </CardTitle>
                                                    <div className="flex items-center mt-1 text-sm text-muted-foreground">
                                                        <Calendar className="h-4 w-4 mr-1.5" />
                                                        {formatDate(session.datetime)}
                                                    </div>
                                                </div>
                                                <Badge 
                                                    variant={session.is_online ? "default" : "secondary"}
                                                    className="ml-2"
                                                >
                                                    {session.is_online ? "Online" : "In-person"}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                                {session.description || "No description provided"}
                                            </p>
                                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{session.duration_minutes} min</span>
                                                </div>
                                                {session.location && (
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="h-4 w-4" />
                                                        <span>{session.location}</span>
                                                    </div>
                                                )}
                                                {session.is_online && session.meeting_link && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Video className="h-4 w-4" />
                                                        <span>Online Meeting</span>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Session Dialog */}
            <CreateSessionDialog 
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                groupId={groupId}
                onSuccess={handleSessionCreated}
            />
        </div>
    );
};
