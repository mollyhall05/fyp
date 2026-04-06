import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  Plus, 
  LogOut, 
  User, 
  ChevronDown, 
  Calendar as CalendarIcon, 
  Search,
  Bell,
  Home,
  BookOpen,
  LayoutDashboard,
  Settings,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { GroupCard } from "@/components/GroupCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarView } from "@/components/CalendarView";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";

// Import shared styles and animations
import { fadeIn, staggerContainer, itemFadeIn } from "@/styles/animations";
import { cardStyles, buttonStyles, typography, sectionSpacing } from "@/styles/layout";

interface StudyGroup {
    id: string;
    name: string;
    description: string | null;
    created_by: string;
    member_count?: number;
}

// @ts-ignore
const Dashboard = () => {
    const [user, setUser] = useState<any>(null);
    const [groups, setGroups] = useState<StudyGroup[]>([]);
    const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
    const [upcomingSessionsCount, setUpcomingSessionsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        checkUser();
        loadGroups();
        loadUpcomingSessionsCount();
        
        // Set up periodic refresh for sessions count (every 5 minutes)
        const interval = setInterval(() => {
            loadUpcomingSessionsCount();
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, []);

    // Load upcoming sessions count for the user
    const loadUpcomingSessionsCount = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get all groups the user is a member of
            const { data: userGroups } = await supabase
                .from('group_members')
                .select('group_id')
                .eq('user_id', user.id);

            if (!userGroups || userGroups.length === 0) {
                setUpcomingSessionsCount(0);
                return;
            }

            const groupIds = userGroups.map(g => g.group_id);

            // Get upcoming sessions from user's groups
            const now = new Date().toISOString();
            const { data: sessions, error } = await supabase
                .from('study_sessions')
                .select('id')
                .in('group_id', groupIds)
                .gte('datetime', now) // Only future sessions
                .order('datetime', { ascending: true });

            if (error) {
                console.error('Error loading upcoming sessions count:', error);
                setUpcomingSessionsCount(0);
                return;
            }

            setUpcomingSessionsCount(sessions?.length || 0);
        } catch (error) {
            console.error('Error loading upcoming sessions count:', error);
            setUpcomingSessionsCount(0);
        }
    };

    // Export a refresh function that can be called by child components
    const refreshSessionsCount = () => {
        loadUpcomingSessionsCount();
    };

    // Make it available globally for child components to call
    useEffect(() => {
        // Store the refresh function on window for child components to access
        (window as any).refreshDashboardSessionsCount = refreshSessionsCount;
        
        return () => {
            delete (window as any).refreshDashboardSessionsCount;
        };
    }, [loadUpcomingSessionsCount]);

    // Check if the user is authenticated and set the user state
    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            navigate("/auth");
            return;
        }
        setUser(session.user);
    };

    // Function to refresh the groups list
    const handleGroupUpdated = () => {
        loadGroups();
        loadUpcomingSessionsCount();
    };

    // Handle successful group creation
    const handleCreateGroup = () => {
        // Refresh the groups list to show the newly created group
        loadGroups();
        loadUpcomingSessionsCount();
        // Show success message
        toast({
            title: "Group created successfully!",
            description: "Your new study group has been created.",
        });
    };

    // Load groups for the user based on their membership status
    const loadGroups = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return;
            }

            // Get groups the user is a member of
            const { data: userGroupsData, error: userGroupsError } = await supabase
                .from('group_members')
                .select(`
                    groups:group_id (
                        id,
                        name,
                        description,
                        created_by,
                        is_public
                    )
                `)
                .eq('user_id', user.id);

            if (userGroupsError) {
                console.error('Error loading user groups:', userGroupsError);
                return;
            }

            // Get all public groups
            const { data: publicGroupsData, error: publicGroupsError } = await supabase
                .from('groups')
                .select('*')
                .eq('is_public', true);

            if (publicGroupsError) {
                console.error('Error loading public groups:', publicGroupsError);
                // Continue execution with the groups we could load
            }

            // Process user's groups
            const userGroups = userGroupsData?.map(item => ({
                ...item.groups,
                member_count: 1 // This will be updated by the GroupCard component
            })) || [];

            // Get IDs of groups the user is already a member of
            const userGroupIds = new Set(userGroups.map(g => g.id));

            // Filter out groups the user is already a member of from public groups
            const publicGroups = publicGroupsData
                ?.filter(group => !userGroupIds.has(group.id))
                .map(group => ({
                    ...group,
                    member_count: 1 // This will be updated by the GroupCard component
                })) || [];

            setMyGroups(userGroups);
            setGroups(publicGroups);

        } catch (error) {
            console.error('Error in loadGroups:', error);
            toast({
                title: "Error",
                description: "Failed to load groups",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    const handleGroupCreated = async () => {
        try {
            await loadGroups();
            setShowCreateDialog(false);
            toast({
                title: "Success!",
                description: "Group created successfully!",
            });
        } catch (error) {
            console.error('Error in handleGroupCreated:', error);
            toast({
                title: "Error",
                description: "Failed to refresh groups after creation",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
            {/* Simple Navbar */}
            <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm relative z-[9998]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center text-gray-700">
                            <LayoutDashboard className="h-5 w-5 mr-2" />
                            <span className="font-medium">StudySync</span>
                        </div>
                        
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
                                    <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
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

            {/* Hero Section */}
            <section className="relative pt-28 pb-12 px-4">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-accent/10 to-primary/5 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
                </div>
                
                <div className="container mx-auto max-w-6xl">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                    >
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">
                                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-500 bg-clip-text text-transparent">
                                    Dashboard
                                </span>
                            </h1>
                            <p className="text-lg text-muted-foreground">
                                Welcome back! Here's what's happening with your study groups.
                            </p>
                        </div>
                        <Button 
                            onClick={() => setShowCreateDialog(true)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl border-0 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Group
                        </Button>
                    </motion.div>
                </div>
            </section>

            {/* Main Content */}
            <main className="py-8">
                <div className="container mx-auto max-w-6xl px-4">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-md border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Your Groups</p>
                                            <p className="text-2xl font-semibold">
                                                {loading ? '--' : myGroups.length}
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg">
                                            <Users className="h-6 w-6" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-md border border-secondary/20 hover:border-secondary/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Upcoming Sessions</p>
                                            <p className="text-2xl font-semibold">
                                                {loading ? '--' : upcomingSessionsCount}
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-teal-600 to-teal-500 text-white shadow-lg">
                                            <CalendarIcon className="h-6 w-6" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-md border border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Available Groups</p>
                                            <p className="text-2xl font-semibold">
                                                {loading ? '--' : groups.length}
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-purple-500 text-white shadow-lg">
                                            <Users className="h-6 w-6" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Tabs defaultValue="groups" className="space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-primary/20">
                                <TabsList className="bg-transparent p-0 h-auto space-x-6">
                                    <TabsTrigger 
                                        value="groups" 
                                        className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-3 rounded-none text-muted-foreground data-[state=active]:text-foreground"
                                    >
                                        My Groups
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="calendar" 
                                        className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-3 rounded-none text-muted-foreground data-[state=active]:text-foreground"
                                    >
                                        Upcoming Sessions
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="discover" 
                                        className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-3 rounded-none text-muted-foreground data-[state=active]:text-foreground"
                                    >
                                        Discover Groups
                                    </TabsTrigger>
                                </TabsList>
                                <div className="text-sm text-muted-foreground">
                                    {loading ? (
                                        <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                                    ) : (
                                        `${myGroups.length} groups, ${groups.length} available`
                                    )}
                                </div>
                            </div>

                            <TabsContent value="groups" className="mt-8">
                                {loading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {[1, 2, 3].map((i) => (
                                            <Card key={i} className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-md border border-primary/20">
                                                <div className="h-32 bg-muted rounded-t-lg animate-pulse"></div>
                                                <CardContent className="p-6">
                                                    <div className="h-6 bg-muted rounded w-3/4 mb-2 animate-pulse"></div>
                                                    <div className="h-4 bg-muted rounded w-1/2 mb-4 animate-pulse"></div>
                                                    <div className="h-10 bg-muted rounded w-full animate-pulse"></div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : myGroups.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {myGroups.map((group) => (
                                            <motion.div
                                                key={group.id}
                                                initial="hidden"
                                                animate="visible"
                                                variants={itemFadeIn}
                                                whileHover={{ y: -5 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <GroupCard 
                                                    group={group} 
                                                    onUpdate={handleGroupUpdated}
                                                    isMember={true}
                                                />
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-md rounded-2xl border border-primary/20">
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white w-fit mx-auto mb-4">
                                            <Users className="h-8 w-8" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
                                        <p className="text-muted-foreground mb-6">Get started by joining or creating a study group.</p>
                                        <Button
                                            onClick={() => setShowCreateDialog(true)}
                                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl border-0 text-white"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Group
                                        </Button>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="calendar" className="mt-0">
                                <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-md border border-primary/20">
                                    <CardContent className="p-6">
                                        <CalendarView />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="discover" className="mt-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {groups.filter(g => !myGroups.some(mg => mg.id === g.id)).map((group) => (
                                        <motion.div
                                            key={group.id}
                                            initial="hidden"
                                            animate="visible"
                                            variants={itemFadeIn}
                                            whileHover={{ y: -5 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <GroupCard 
                                                group={group} 
                                                onUpdate={handleGroupUpdated}
                                                isMember={false}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>

            <CreateGroupDialog 
                open={showCreateDialog} 
                onOpenChange={setShowCreateDialog} 
                onSuccess={handleCreateGroup} 
            />
        </div>
    );
};

export default Dashboard;
