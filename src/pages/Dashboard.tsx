import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Plus, LogOut, User, ChevronDown, LayoutDashboard, Settings, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { GroupCard } from "@/components/GroupCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CalendarView from "@/components/CalendarView";
import { itemFadeIn } from "@/styles/animations";
import { DashboardStats } from "@/components/DashboardStats";
import { ActivityFeed } from "@/components/ActivityFeed";
import { SearchBar } from "@/components/SearchBar";
import { CreateSessionDialog } from "@/components/CreateSessionDialog";
import { GroupSelectionDialog } from "@/components/GroupSelectionDialog";

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
    const [showCreateSession, setShowCreateSession] = useState(false);
    const [showGroupSelection, setShowGroupSelection] = useState(false);
    const [selectedGroupForSession, setSelectedGroupForSession] = useState<StudyGroup | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredGroups, setFilteredGroups] = useState<StudyGroup[]>([]);
    const [allSearchableGroups, setAllSearchableGroups] = useState<StudyGroup[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        // Set body background directly
        document.body.style.backgroundColor = '#ccfbf1';
        document.body.style.backgroundAttachment = 'fixed';
        
        checkUser();
        loadGroups();
        loadUpcomingSessionsCount();
        loadActivities();
        
        // Set up periodic refresh for sessions count (every 5 minutes)
        const interval = setInterval(() => {
            loadUpcomingSessionsCount();
            loadActivities();
        }, 5 * 60 * 1000); // 5 minutes

        return () => {
            clearInterval(interval);
            // Reset body background when component unmounts
            document.body.style.background = '';
        };
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

    // Load activities from user's groups
    const loadActivities = async () => {
        try {
            setLoadingActivities(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get all groups the user is a member of
            const { data: userGroups } = await supabase
                .from('group_members')
                .select('group_id')
                .eq('user_id', user.id);

            if (!userGroups || userGroups.length === 0) {
                setActivities([]);
                return;
            }

            const groupIds = userGroups.map(g => g.group_id);

            // Get recent sessions from user's groups
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            const { data: sessions, error: sessionsError } = await supabase
                .from('study_sessions')
                .select(`
                    *,
                    groups (name)
                `)
                .in('group_id', groupIds)
                .gte('datetime', weekAgo.toISOString())
                .order('datetime', { ascending: false })
                .limit(10);

            if (sessionsError) {
                console.error('Error loading sessions:', sessionsError);
                setActivities([]);
                return;
            }

            // Transform sessions into activity items
            const sessionActivities = (sessions || []).map(session => ({
                id: `session-${session.id}`,
                type: 'session',
                title: 'Study Session Scheduled',
                description: `${session.title} in ${session.groups?.name || 'Unknown Group'}`,
                timestamp: session.datetime,
                user: { name: 'You' },
                group: session.groups?.name,
                metadata: {
                    sessionId: session.id,
                    groupId: session.group_id
                }
            }));

            // Get recent group members (simplified - since group_members doesn't have created_at, we'll just get recent members)
            const { data: recentMembers } = await supabase
                .from('group_members')
                .select(`
                    *,
                    user:user_id (
                        username,
                        email
                    ),
                    groups:group_id (
                        name
                    )
                `)
                .in('group_id', groupIds)
                .limit(10);

            const memberActivities = (recentMembers || [])
                .filter(member => member.user_id !== user.id) // Exclude current user
                .map(member => ({
                    id: `member-${user.id}`,
                    type: 'member_joined',
                    title: 'New Member Joined',
                    description: `${member.user?.username || member.user?.email || 'Someone'} joined ${member.groups?.name || 'Unknown Group'}`,
                    timestamp: new Date().toISOString(), // Use current time since we don't have created_at
                    user: { 
                        name: member.user?.username || member.user?.email?.split('@')[0] || 'Someone',
                        avatar: member.user?.username?.[0] || member.user?.email?.[0] || 'U'
                    },
                    group: member.groups?.name,
                    metadata: {
                        groupId: member.group_id
                    }
                }));

            // Combine and sort activities by timestamp
            const allActivities = [...sessionActivities, ...memberActivities]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 8); // Limit to 8 most recent activities

            setActivities(allActivities);
        } catch (error) {
            console.error('Error loading activities:', error);
            setActivities([]);
        } finally {
            setLoadingActivities(false);
        }
    };

    // Export a refresh function that can be called by child components
    const refreshSessionsCount = () => {
        loadUpcomingSessionsCount();
        loadActivities();
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
        // Show the success message
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
            setFilteredGroups(publicGroups);
            
            // Combine both user's groups and public groups for search
            const allGroups = [...userGroups, ...publicGroups];
            setAllSearchableGroups(allGroups);

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

    // Handle group selection for session scheduling
    const handleScheduleSession = () => {
        if (myGroups.length === 0) {
            toast({
                title: "No Groups Available",
                description: "Join or create a group first to schedule sessions.",
                variant: "destructive",
            });
            return;
        }
        setShowGroupSelection(true);
    };

    const handleGroupSelect = (group: StudyGroup) => {
        setSelectedGroupForSession(group);
        setShowCreateSession(true);
    };

    const handleGroupNavigation = (group: StudyGroup) => {
        // Navigate to the group page
        navigate(`/group/${group.id}`);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        
        // Filter groups based on search query across all searchable groups
        if (query.trim() === '') {
            // If search is empty, show all public groups (for discover tab)
            setFilteredGroups(groups);
        } else {
            // Filter all groups (user's groups + public groups) by name or description
            const filtered = allSearchableGroups.filter(group => 
                group.name.toLowerCase().includes(query.toLowerCase()) ||
                (group.description && group.description.toLowerCase().includes(query.toLowerCase()))
            );
            setFilteredGroups(filtered);
        }
    };

    return (
        <div className="min-h-screen" style={{
            backgroundColor: 'red !important'
        }}>
            {/* Simple Header */}
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
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                            {/* User Info Section */}
                            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                        {user?.user_metadata?.full_name ? user.user_metadata.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : user?.email?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {user?.user_metadata?.full_name || 'No name set'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
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
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                            >
                                <User className="h-4 w-4 mr-3" />
                                Edit Profile
                            </button>
                            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                            <button
                                onClick={handleSignOut}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                            >
                                <LogOut className="h-4 w-4 mr-3" />
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Hero Section */}
            <section className="relative pt-0 pb-16 px-4 overflow-hidden -mt-16">
                                
                                
                <div className="container mx-auto max-w-7xl relative pt-20">
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12"
                    >
                        <div className="inline-flex items-center space-x-2 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
                            <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                            <span>Welcome back to your study hub</span>
                        </div>
                        
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                            <span className="bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">
                                Your Learning Dashboard
                            </span>
                        </h1>
                        
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                            Track your progress, collaborate with study groups, and achieve your academic goals all in one place.
                        </p>
                        
                        {/* Quick Stats Bar */}
                        <div className="flex flex-wrap justify-center items-center gap-8 mb-8">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    <strong>{myGroups.length}</strong> Active Groups
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    <strong>{upcomingSessionsCount}</strong> Upcoming Sessions
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    <strong>7</strong> Day Streak
                                </span>
                            </div>
                        </div>
                    </motion.div>
                    
                    {/* Search and Actions */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex flex-col lg:flex-row gap-4">
                                <div className="flex-1">
                                    <SearchBar 
                                        onSearch={handleSearch}
                                        searchResults={filteredGroups}
                                        userGroups={myGroups}
                                        onGroupClick={handleGroupNavigation}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button 
                                        onClick={() => setShowCreateDialog(true)}
                                        className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 transition-all duration-300 shadow-lg hover:shadow-xl border-0 text-white px-6"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Group
                                    </Button>
                                    <Button 
                                        onClick={handleScheduleSession}
                                        variant="outline"
                                        className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Schedule Session
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Main Content */}
            <main className="py-6">
                <div className="container mx-auto max-w-7xl px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content Area - 2 columns */}
                        <div className="lg:col-span-2 space-y-6">
                        {/* Enhanced Stats Section */}
                        <DashboardStats 
                            userGroups={myGroups.length}
                            upcomingSessions={upcomingSessionsCount}
                            availableGroups={groups.length}
                            studyStreak={7}
                            totalStudyTime={245}
                            completedSessions={12}
                            weeklyProgress={78}
                        />

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
                                <div className="text-sm text-foreground/60">
                                    {loading ? (
                                        <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                                    ) : (
                                        `${myGroups.length} groups, ${groups.length} available`
                                    )}
                                </div>
                            </div>

                            <TabsContent value="groups" className="mt-8">
                                {loading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {[1, 2, 3].map((i) => (
                                            <Card key={i} className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-md border border-primary/20">
                                                <div className="h-32 bg-muted rounded-t-lg animate-pulse"></div>
                                                <CardContent className="p-8">
                                                    <div className="h-6 bg-muted rounded w-3/4 mb-2 animate-pulse"></div>
                                                    <div className="h-4 bg-muted rounded w-1/2 mb-4 animate-pulse"></div>
                                                    <div className="h-10 bg-muted rounded w-full animate-pulse"></div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : myGroups.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                                        <div className="p-3 rounded-xl bg-teal-700 text-white w-fit mx-auto mb-4">
                                            <Users className="h-8 w-8" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
                                        <p className="text-muted-foreground mb-6">Get started by joining or creating a study group.</p>
                                        <Button
                                            onClick={() => setShowCreateDialog(true)}
                                            className="bg-teal-700 hover:bg-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl border-0 text-white"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Group
                                        </Button>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="calendar" className="mt-0">
                                <Card className="bg-gradient-to-br from-background via-background to-muted/10 backdrop-blur-md border border-teal-600/20 hover:border-teal-600/40 transition-all duration-300 hover:shadow-xl">
                                    <CardContent className="p-8">
                                        <CalendarView />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="discover" className="mt-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {filteredGroups.filter(g => !myGroups.some(mg => mg.id === g.id)).map((group) => (
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
                        
                        {/* Sidebar - 1 column */}
                        <div className="lg:col-span-1">
                            <ActivityFeed 
                                activities={activities}
                                loading={loadingActivities}
                            />
                        </div>
                    </div>
                </div>
            </main>

            <CreateGroupDialog 
                open={showCreateDialog} 
                onOpenChange={setShowCreateDialog} 
                onSuccess={handleCreateGroup} 
            />
            <GroupSelectionDialog
                open={showGroupSelection}
                onOpenChange={setShowGroupSelection}
                groups={myGroups}
                onSelectGroup={handleGroupSelect}
            />
            <CreateSessionDialog
                open={showCreateSession}
                onOpenChange={setShowCreateSession}
                groupId={selectedGroupForSession?.id || ""}
                onSuccess={() => {
                    setShowCreateSession(false);
                    setSelectedGroupForSession(null);
                    refreshSessionsCount();
                }}
            />
        </div>
    );
};

export default Dashboard;
