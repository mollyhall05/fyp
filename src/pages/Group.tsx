import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, MessageSquare, ArrowLeft, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GroupChat } from "@/components/GroupChat";
import { SessionList } from "@/components/SessionList";
import { CreateSessionDialog } from "@/components/CreateSessionDialog";

const Group = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [group, setGroup] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [isMember, setIsMember] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showCreateSession, setShowCreateSession] = useState(false);

    useEffect(() => {
        checkAccess();
        loadGroup();
        loadMembers();
    }, [id]);

    const checkAccess = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate("/auth");
            return;
        }

        const { data } = await supabase
            .from("group_members")
            .select("*")
            .eq("group_id", id)
            .eq("user_id", user.id)
            .single();

        if (!data) {
            toast({
                title: "Access Denied",
                description: "You must be a member to view this group",
                variant: "destructive",
            });
            navigate("/dashboard");
            return;
        }

        setIsMember(true);
    };

    const loadGroup = async () => {
        try {
            const { data, error } = await supabase
                .from("study_groups")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;
            setGroup(data);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const loadMembers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("group_members")
                .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            avatar_url
          )
        `)
                .eq("group_id", id);

            if (error) throw error;
            setMembers(data || []);
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

    if (!group || !isMember) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted">
            {/* Header */}
            <header className="border-b bg-card/80 backdrop-blur-lg">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate("/dashboard")}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{group.name}</h1>
                            <p className="text-sm text-muted-foreground">{group.subject}</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <Tabs defaultValue="sessions" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                        <TabsTrigger value="sessions">
                            <Calendar className="mr-2 h-4 w-4" />
                            Sessions
                        </TabsTrigger>
                        <TabsTrigger value="chat">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Chat
                        </TabsTrigger>
                        <TabsTrigger value="members">
                            <Users className="mr-2 h-4 w-4" />
                            Members
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="sessions">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Study Sessions</h2>
                            <Button
                                onClick={() => setShowCreateSession(true)}
                                className="bg-gradient-primary"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Schedule Session
                            </Button>
                        </div>
                        <SessionList groupId={id!} />
                    </TabsContent>

                    <TabsContent value="chat">
                        <GroupChat groupId={id!} />
                    </TabsContent>

                    <TabsContent value="members">
                        <Card className="shadow-soft">
                            <CardHeader>
                                <CardTitle>Group Members</CardTitle>
                                <CardDescription>
                                    {members.length} {members.length === 1 ? "member" : "members"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {members.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
                                                    {member.profiles?.full_name?.[0] || "?"}
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        {member.profiles?.full_name || "Anonymous"}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {member.profiles?.email}
                                                    </p>
                                                </div>
                                            </div>
                                            {member.role === "admin" && (
                                                <span className="text-xs bg-gradient-primary text-white px-2 py-1 rounded">
                          Admin
                        </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            <CreateSessionDialog
                open={showCreateSession}
                onOpenChange={setShowCreateSession}
                groupId={id!}
                onSuccess={() => setShowCreateSession(false)}
            />
        </div>
    );
};

export default Group;
