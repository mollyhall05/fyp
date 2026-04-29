import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Users,
    Calendar as CalendarIcon,
    MessageSquare,
    Plus,
    User,
    Settings,
    LayoutDashboard,
    LogOut,
    ChevronDown,
    UserPlus, UserCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GroupChat from "@/components/GroupChat";
import { SessionList } from "@/components/SessionList";
import { CreateSessionDialog } from "@/components/CreateSessionDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const Group = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [group, setGroup] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [isMember, setIsMember] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showCreateSession, setShowCreateSession] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Load user data on component mount
    useEffect(() => {
        // Set body background to match dashboard
        document.body.style.backgroundColor = '#ccfbf1';
        document.body.style.backgroundAttachment = 'fixed';
        
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);

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

    // Loading state
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

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate("/auth");
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#ccfbf1' }}>
            {/* Simple Header - Same as Dashboard */}
            <div className="fixed top-6 left-0 right-0 z-50 flex justify-between items-start px-6">
                {/* Home Button */}
                <Button
                    variant="ghost"
                    onClick={() => navigate('/dashboard')}
                    className="bg-transparent hover:bg-transparent text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-all duration-300 px-6 py-3 text-lg font-medium no-focus-border"
                >
                    <LayoutDashboard className="h-6 w-6 mr-3" />
                    Home
                </Button>
                
                {/* Profile Button */}
                <div className="relative">
                    <Button
                        variant="ghost"
                        onClick={() => setShowProfile(!showProfile)}
                        className="bg-transparent hover:bg-transparent text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-all duration-300 px-6 py-3 text-lg font-medium no-focus-border"
                    >
                        <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400 font-semibold text-base mr-3">
                            {user?.user_metadata?.full_name ? user.user_metadata.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : user?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        Profile
                        <ChevronDown className={`h-5 w-5 ml-2 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
                    </Button>
                    
                    {/* Profile Dropdown */}
                    {showProfile && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                        >
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {user?.user_metadata?.full_name || user?.email}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {user?.email}
                                </p>
                            </div>
                            <div className="p-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setShowProfile(false);
                                        navigate('/profile/edit');
                                    }}
                                    className="w-full justify-start text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <Settings className="h-4 w-4 mr-2" />
                                    Edit Profile Details
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={handleSignOut}
                                    className="w-full justify-start text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Sign out
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <main className="py-6">
                <div className="max-w-6xl mx-auto px-6">
                    {/* Group Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                        {group.name}
                                    </h1>
                                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                                        {group.subject || 'Study group'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant="secondary" className="text-lg px-3 py-1">
                                        {group.member_count || members.length} members
                                    </Badge>
                                    {group.is_public && (
                                        <Badge variant="outline" className="text-lg px-3 py-1">
                                            Public
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            
                            {/* Group Actions */}
                            <div className="flex gap-3">
                                <Button className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 transition-all duration-300 shadow-lg hover:shadow-xl border-0 text-white px-6">
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Invite Members
                                </Button>
                                <Button variant="outline" className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Settings
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Group Content Tabs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Tabs defaultValue="sessions" className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
                                <TabsList className="grid w-full grid-cols-3 bg-transparent border-b border-gray-200 dark:border-gray-700 rounded-none h-auto p-0">
                                    <TabsTrigger 
                                        value="sessions" 
                                        className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-3 rounded-none text-muted-foreground data-[state=active]:text-foreground"
                                    >
                                        <CalendarIcon className="h-4 w-4 mr-2" />
                                        Sessions
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="chat" 
                                        className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-3 rounded-none text-muted-foreground data-[state=active]:text-foreground"
                                    >
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Chat
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="members" 
                                        className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-3 rounded-none text-muted-foreground data-[state=active]:text-foreground"
                                    >
                                        <Users className="h-4 w-4 mr-2" />
                                        Members
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                        <div className="mt-6">
                                    <TabsContent value="sessions" className="mt-0">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                            <div>
                                                <h3 className="text-xl font-medium text-foreground">Study Sessions</h3>
                                                <p className="text-base text-muted-foreground">View and manage your study sessions</p>
                                            </div>
                                            <Button
                                                onClick={() => setShowCreateSession(true)}
                                                className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 transition-all duration-300 shadow-lg hover:shadow-xl border-0 text-white px-6"
                                            >
                                                <Plus className="mr-2 h-5 w-5" />
                                                Schedule Session
                                            </Button>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                            <SessionList groupId={id!} />
                                        </div>
                                    </TabsContent>

                        <TabsContent value="chat" className="mt-0">
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                <GroupChat groupId={id!} />
                            </div>
                        </TabsContent>

                        <TabsContent value="members" className="mt-0">
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-xl font-medium text-foreground">Group Members</h3>
                                            <p className="mt-1 text-base text-muted-foreground">
                                                {members.length} {members.length === 1 ? 'member' : 'members'} in this group
                                            </p>
                                        </div>
                                        <Button variant="outline" size="default" className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 py-2 px-4">
                                            <UserPlus className="mr-2 h-5 w-5" />
                                            Invite
                                        </Button>
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {members.map((member) => (
                                        <div
                                            key={member.id}
                                            className="p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="relative">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-600 text-white font-semibold">
                                                                {member.profiles?.username?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 
                                                                 member.profiles?.email?.[0]?.toUpperCase() || '?'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        {member.is_creator && (
                                                            <div className="absolute -bottom-1 -right-1 bg-teal-600 text-white p-0.5 rounded-full">
                                                                <UserCheck className="h-3 w-3" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-medium text-foreground">
                                                            {member.profiles?.username || member.profiles?.email?.split('@')[0] || 'Anonymous'}
                                                        </p>
                                                        {!member.profiles?.username && member.profiles?.email && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {member.profiles?.email}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {(member.role === 'admin' || member.is_creator) && (
                                                    <Badge 
                                                        variant={member.is_creator ? 'default' : 'outline'}
                                                        className={`${member.is_creator ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-300 text-foreground'}`}
                                                    >
                                                        {member.is_creator ? 'Creator' : 'Admin'}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>
                            </div>
                        </Tabs>
                    </motion.div>
                </div>
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
