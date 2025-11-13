import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, MessageSquare, ArrowLeft, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GroupChat from "@/components/GroupChat";
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
        try {
            setLoading(true);
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError || !user) {
                navigate("/auth");
                return;
            }

            const { data } = await supabase
                .from("group_members")
                .select("*")
                .eq("group_id", id)
                .eq("user_id", user.id)
                .maybeSingle();
            
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
        } catch (error: any) {
            console.error('Error checking access:', error);
            toast({
                title: "Error",
                description: "Failed to verify group access",
                variant: "destructive",
            });
            navigate("/dashboard");
        } finally {
            setLoading(false);
        }
    };

    const loadGroup = async () => {
        try {
            const { data } = await supabase
                .from("groups")
                .select(`
                    *,
                    member_count:group_members(count)
                `)
                .eq("id", id)
                .single();

            setGroup({
                ...data,
                member_count: data.member_count?.[0]?.count || 0
            });
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

            // Get the current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // First, get the group to find the creator
            const { data: groupData } = await supabase
                .from('groups')
                .select('*')
                .eq('id', id)
                .single();

            if (!groupData) return;

            // Get all group members including their profile data
            const { data: membersData } = await supabase
                .from('group_members')
                .select(`
                    user_id,
                    group_id,
                    is_admin,
                    user:user_id (
                        id,
                        email,
                        username
                    )
                `)
                .eq('group_id', id);

            // Process members data
            const allMembers = (membersData || []).map((member: any) => {
                const isCreator = member.user_id === groupData.created_by;
                return {
                    // Create a unique ID using both group_id and user_id since there's no single ID column
                    id: `${member.group_id}_${member.user_id}`,
                    user_id: member.user_id,
                    group_id: member.group_id,
                    is_admin: member.is_admin,
                    profiles: {
                        id: member.user_id,
                        email: member.user?.email || '',
                        username: member.user?.username || member.user?.email?.split('@')[0] || 'Anonymous',
                        is_creator: isCreator,
                    }
                };
            });

            // Check if the creator is in members, if not add them
            const creatorInMembers = allMembers.some(m => m.profiles.is_creator);
            
            if (!creatorInMembers && groupData.created_by) {
                const { data: creatorProfile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', groupData.created_by)
                    .single();

                if (creatorProfile) {
                    allMembers.push({
                        id: `${groupData.created_by}_creator`,
                        user_id: groupData.created_by,
                        group_id: id,
                        is_admin: true,
                        profiles: {
                            id: creatorProfile.id,
                            email: creatorProfile.email,
                            username: creatorProfile.username ||
                                'Group Creator',
                            is_creator: true,
                        }
                    });
                }
            }

            // Ensure the current user is first in the list if they're a member
            const currentUserIndex = allMembers.findIndex(m => m.user_id === user?.id);
            if (currentUserIndex > 0) {
                const [currentUser] = allMembers.splice(currentUserIndex, 1);
                allMembers.unshift(currentUser);
            }

            // Update the 'members' state with the processed list
            setMembers(allMembers);
        } catch (error: any) {
            console.error('Error loading members:', error);
            toast({
                title: 'Error',
                description: 'Failed to load group members',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center space-y-4">
                    <div className="h-12 w-12 rounded-full bg-muted"></div>
                    <p className="text-muted-foreground">Loading group...</p>
                </div>
            </div>
        );
    }

    if (!group || !isMember) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>You don't have access to this group or it doesn't exist.</p>
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
                    <TabsList className="grid w-full grid-cols-3 mb-8 bg-blue-50 p-1 rounded-lg">
                        <TabsTrigger
                            value="sessions"
                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-colors duration-200"
                        >
                            <Calendar className="mr-2 h-4 w-4" />
                            Sessions
                        </TabsTrigger>
                        <TabsTrigger
                            value="chat"
                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-colors duration-200"
                        >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Chat
                        </TabsTrigger>
                        <TabsTrigger
                            value="members"
                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-colors duration-200"
                        >
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
                                                    {member.profiles?.full_name?.[0] || member.profiles?.email?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        {member.profiles?.full_name || member.profiles?.email || 'Anonymous'}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {member.profiles?.email}
                                                        {member.is_creator && ' • Creator'}
                                                    </p>
                                                </div>
                                            </div>
                                            {(member.role === 'admin' || member.is_creator) && (
                                                <span className="text-xs bg-gradient-primary text-white px-2 py-1 rounded">
                                                    {member.is_creator ? 'Creator' : 'Admin'}
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
