import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Users,
    Calendar as CalendarIcon,
    MessageSquare,
    ArrowLeft,
    Plus,
    User,
    Settings,
    BookOpen,
    LayoutDashboard,
    Search,
    Bell,
    LogOut,
    ChevronRight,
    Calendar, UserPlus, UserCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GroupChat from "@/components/GroupChat";
import { SessionList } from "@/components/SessionList";
import { CreateSessionDialog } from "@/components/CreateSessionDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/Navbar";

// Import shared styles and animations
import { fadeIn, staggerContainer, itemFadeIn } from "@/styles/animations";
import { cardStyles, buttonStyles, typography } from "@/styles/layout";

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
        <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
            {/* Simple Navbar */}
            <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/dashboard" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors">
                            <LayoutDashboard className="h-5 w-5 mr-2" />
                            <span className="font-medium">Dashboard</span>
                        </Link>
                        
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-gray-700 hover:text-gray-900"
                                    onClick={() => setShowProfile(!showProfile)}
                                >
                                    <User className="h-4 w-4 mr-2" />
                                    Profile
                                    <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
                                </Button>
                                
                                {/* Profile Dropdown */}
                                {showProfile && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200/50 py-2 z-[9999]">
                                        {/* User Info Section */}
                                        <div className="px-4 py-3 border-b border-gray-200/50">
                                            <div className="flex items-center space-x-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                                    {user?.user_metadata?.full_name ? user.user_metadata.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : user?.email?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {user?.user_metadata?.full_name || 'No name set'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {user?.email || 'No email'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Menu Items */}
                                        <button
                                            onClick={() => {
                                                setShowProfile(false);
                                                navigate('/profile/edit');
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                        >
                                            <Settings className="h-4 w-4 mr-2" />
                                            Edit Profile Details
                                        </button>
                                        <div className="border-t border-gray-200/50 my-1"></div>
                                        <button
                                            onClick={() => {
                                                setShowProfile(false);
                                                toast({
                                                    title: "Account Settings",
                                                    description: "Account settings feature coming soon!",
                                                });
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                        >
                                            <Settings className="h-4 w-4 mr-2" />
                                            Account Settings
                                        </button>
                                    </div>
                                )}
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleSignOut}
                                className="text-gray-700 hover:text-red-600 transition-colors"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{group.name}</h2>
                            <p className="mt-1 text-sm text-gray-500">{group.subject || 'Study group'}</p>
                        </div>
                    </div>

                    <Tabs defaultValue="sessions" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-8 bg-gradient-to-r from-gray-50 to-gray-100 p-2 rounded-2xl max-w-2xl mx-auto shadow-lg border border-gray-200/50 min-h-[72px]">
                            <TabsTrigger
                                value="sessions"
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-300 flex items-center justify-center py-4 px-6 rounded-xl text-base font-semibold hover:bg-gray-200/50"
                            >
                                <CalendarIcon className="mr-3 h-5 w-5" />
                                Sessions
                            </TabsTrigger>
                            <TabsTrigger
                                value="chat"
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-300 flex items-center justify-center py-4 px-6 rounded-xl text-base font-semibold hover:bg-gray-200/50"
                            >
                                <MessageSquare className="mr-3 h-5 w-5" />
                                Chat
                            </TabsTrigger>
                            <TabsTrigger
                                value="members"
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-300 flex items-center justify-center py-4 px-6 rounded-xl text-base font-semibold hover:bg-gray-200/50"
                            >
                                <Users className="mr-3 h-5 w-5" />
                                Members
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="sessions" className="mt-0">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Study Sessions</h3>
                                    <p className="text-sm text-gray-500">View and manage your study sessions</p>
                                </div>
                                <Button
                                    onClick={() => setShowCreateSession(true)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Schedule Session
                                </Button>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                <SessionList groupId={id!} />
                            </div>
                        </TabsContent>

                        <TabsContent value="chat" className="mt-0">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <GroupChat groupId={id!} />
                            </div>
                        </TabsContent>

                        <TabsContent value="members" className="mt-0">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">Group Members</h3>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {members.length} {members.length === 1 ? 'member' : 'members'} in this group
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" className="border-gray-300">
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Invite
                                        </Button>
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-200">
                                    {members.map((member) => (
                                        <div
                                            key={member.id}
                                            className="p-4 hover:bg-gray-50 transition-colors duration-150"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="relative">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarFallback className="bg-indigo-100 text-indigo-600">
                                                                {member.profiles?.full_name?.[0] || member.profiles?.email?.[0]?.toUpperCase() || '?'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        {member.is_creator && (
                                                            <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-0.5 rounded-full">
                                                                <UserCheck className="h-3 w-3" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {member.profiles?.full_name || member.profiles?.email || 'Anonymous'}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {member.profiles?.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                {(member.role === 'admin' || member.is_creator) && (
                                                    <Badge 
                                                        variant={member.is_creator ? 'default' : 'outline'}
                                                        className={`${member.is_creator ? 'bg-indigo-100 text-indigo-800' : 'border-gray-200 text-gray-700'}`}
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
                    </Tabs>
                </div>
            </div>

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
