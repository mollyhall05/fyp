import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Plus, LogOut, ChevronDown, LayoutDashboard, Calendar } from "lucide-react";
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

    // Helper functions
    const getUserInitials = (user: any) => {
        return user?.user_metadata?.full_name 
            ? user.user_metadata.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
            : user?.email?.[0]?.toUpperCase() || 'U';
    };

    const showToast = (title: string, description: string, variant: "destructive" | "default" = "default") => {
        toast({ title, description, variant });
    };

    // Get current user and their group memberships
    const getUserGroups = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        const { data: userGroups } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', user.id);
            
        return { user, groupIds: userGroups?.map(g => g.group_id) || [] };
    };

    useEffect(() => {
        const initializeDashboard = async () => {
            await checkUser();
            await loadGroups();
            await loadUpcomingSessionsCount();
            await loadActivities();
        };
        
        initializeDashboard().catch(error => {
            console.error('Failed to initialize dashboard:', error);
        });
        
        // Set up periodic refresh for the session count (every 5 minutes)
        const interval = setInterval(async () => {
            await loadUpcomingSessionsCount();
            await loadActivities();
        }, 5 * 60 * 1000); // 5 minutes

        return () => {
            clearInterval(interval);
        };
    }, []);

    // Load upcoming sessions count for the user
    const loadUpcomingSessionsCount = async () => {
        try {
            const result = await getUserGroups();
            if (!result || result.groupIds.length === 0) {
                setUpcomingSessionsCount(0);
                return;
            }

            const now = new Date().toISOString();
            const { data: sessions, error } = await supabase
                .from('study_sessions')
                .select('id')
                .in('group_id', result.groupIds)
                .gte('datetime', now)
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
            const result = await getUserGroups();
            if (!result || result.groupIds.length === 0) {
                setActivities([]);
                return;
            }

            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            const { data: sessions, error: sessionsError } = await supabase
                .from('study_sessions')
                .select(`*, groups (name)`)
                .in('group_id', result.groupIds)
                .gte('datetime', weekAgo.toISOString())
                .order('datetime', { ascending: false })
                .limit(10);

            if (sessionsError) {
                console.error('Error loading sessions:', sessionsError);
                setActivities([]);
                return;
            }

            const sessionActivities = (sessions || []).map((session) => ({
                id: `session-${session.id}`,
                type: 'session',
                title: 'Study Session Scheduled',
                description: `${session.title} in ${session.groups?.name || 'Unknown Group'}`,
                user: { name: 'You' },
                group: session.groups?.name,
                metadata: { sessionId: session.id, groupId: session.group_id }
            }));

            const { data: recentMembers } = await supabase
                .from('group_members')
                .select(`*, user:user_id (username, email), groups:group_id (name)`)
                .in('group_id', result.groupIds)
                .limit(10);

            const memberActivities = (recentMembers || [])
                .filter(member => member.user_id !== result.user.id)
                .map((member) => ({
                    id: `member-${member.user_id}`,
                    type: 'member_joined',
                    title: 'New Member Joined',
                    description: `${member.user?.username || member.user?.email || 'Someone'} joined ${member.groups?.name || 'Unknown Group'}`,
                    user: {
                        name: member.user?.username || member.user?.email?.split('@')[0] || 'Someone',
                        avatar: member.user?.username?.[0] || member.user?.email?.[0] || 'U'
                    },
                    group: member.groups?.name,
                    metadata: { groupId: member.group_id }
                }));

            const allActivities = [...sessionActivities, ...memberActivities].slice(0, 5);
            setActivities(allActivities);
        } catch (error) {
            console.error('Error loading activities:', error);
            setActivities([]);
        } finally {
            setLoadingActivities(false);
        }
    };

    // Handle activity clicks for navigation
    const handleActivityClick = (activity: any) => {
        if (activity.type === 'session' && activity.metadata?.sessionId) {
            navigate(`/session/${activity.metadata.sessionId}`);
        } else if (activity.metadata?.groupId) {
            navigate(`/group/${activity.metadata.groupId}`);
        }
    };

    // Export a refresh function that can be called by child components
    const refreshSessionsCount = async () => {
        await loadUpcomingSessionsCount();
        await loadActivities();
    };

    // Check if the user is authenticated and set the user state
    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            navigate("/auth");
            return;
        }
        setUser(session.user);
    };

    // Function to refresh the group list
    const handleGroupUpdated = async () => {
        await loadGroups();
        await loadUpcomingSessionsCount();
    };

    // Handle successful group creation
    const handleCreateGroup = async () => {
        // Refresh the group list to show the newly created group
        await loadGroups();
        await loadUpcomingSessionsCount();
        // Show the success message
        showToast("Group created successfully!", "Your new study group has been created.");
    };

    const loadGroups = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const [{ data: userGroupsData }, { data: publicGroupsData }] = await Promise.all([
                supabase.from('group_members').select(`groups:group_id (id, name, description, created_by, is_public)`).eq('user_id', user.id),
                supabase.from('groups').select('*').eq('is_public', true)
            ]);

            const userGroups = userGroupsData?.map(item => ({ ...item.groups, member_count: 1 })) || [];
            const userGroupIds = new Set(userGroups.map(g => g.id));
            
            const publicGroups = publicGroupsData
                ?.filter(group => !userGroupIds.has(group.id))
                .map(group => ({ ...group, member_count: 1 })) || [];

            setMyGroups(userGroups);
            setGroups(publicGroups);
            setFilteredGroups(publicGroups);
            setAllSearchableGroups([...userGroups, ...publicGroups]);
        } catch (error) {
            console.error('Error in loadGroups:', error);
            showToast("Error", "Failed to load groups", "destructive");
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    // Handle group selection for session scheduling
    const handleScheduleSession = () => {
        if (myGroups.length === 0) {
            showToast("No Groups Available", "Join or create a group first to schedule sessions.", "destructive");
            return;
        }
        setShowGroupSelection(true);
    };

    const handleGroupSelect = (group: StudyGroup) => {
        setSelectedGroupForSession(group);
        setShowCreateSession(true);
    };

    const handleGroupNavigation = (group: StudyGroup) => {
        navigate(`/group/${group.id}`);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setFilteredGroups(query.trim() === '' ? groups : 
            allSearchableGroups.filter(group => 
                group.name.toLowerCase().includes(query.toLowerCase()) ||
                (group.description?.toLowerCase().includes(query.toLowerCase()))
            )
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-transparent via-primary/20 to-secondary/50 px-1 relative overflow-hidden">
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 dark:opacity-[0.05]"></div>
            </div>
            {/* Simple Header */}
            <div className="flex justify-between items-start px-4 pt-6 pb-4">
                {/* Home Button */}
                <Button
                    variant="ghost"
                    onClick={() => navigate('/dashboard')}
                    className="bg-transparent hover:bg-transparent text-foreground hover:text-primary transition-all duration-300 px-6 py-3 text-lg font-medium no-focus-border relative z-50"
                >
                    <LayoutDashboard className="h-6 w-6 mr-3" />
                    Home
                </Button>
                
                {/* Profile Button */}
                <div className="relative">
                    <Button
                        variant="ghost"
                        onClick={() => setShowProfile(!showProfile)}
                        className="bg-transparent hover:bg-transparent text-foreground hover:text-primary transition-all duration-300 px-6 py-3 text-lg font-medium no-focus-border relative z-50"
                    >
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-base mr-3 shadow-sm">
                            {getUserInitials(user)}
                        </div>
                        Profile
                        <ChevronDown className={`h-5 w-5 ml-2 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
                    </Button>
                    
                    {/* Profile Dropdown */}
                    {showProfile && (
                        <div className="absolute right-0 mt-2 w-64 bg-popover rounded-lg shadow-lg border border-border py-2 z-50">
                            {/* User Info Section */}
                            <div className="px-4 py-3 border-b border-border">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                                        {getUserInitials(user)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-popover-foreground truncate">
                                            {user?.user_metadata?.full_name || 'No name set'}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {user?.email || 'No email'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Menu Items */}
                            <button
                                onClick={handleSignOut}
                                className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center"
                            >
                                <LogOut className="h-4 w-4 mr-3" />
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Hero Section */}
            <section className="relative pt-0 pb-16 px-2 overflow-hidden -mt-16 z-10">
                <div className="container mx-auto max-w-7xl relative pt-40 px-4">
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12"
                    >
                        
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-card-foreground mb-6 font-display">
                            <span className="text-primary">
                                Your Learning Dashboard
                            </span>
                        </h1>
                        
                        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                            Track your progress, collaborate with study groups, and achieve your academic goals all in one place.
                        </p>
                    </motion.div>
                    
                    {/* Search and Actions */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="max-w-4xl mx-auto"
                    >
                        <div className="bg-card/95 backdrop-blur-md rounded-3xl shadow-xl border border-border/50 p-6">
                            <div className="flex flex-col lg:flex-row gap-4">
                                <div className="flex-1">
                                    <SearchBar 
                                        onSearch={handleSearch}
                                        searchResults={filteredGroups}
                                        userGroups={myGroups}
                                        onGroupClick={handleGroupNavigation}
                                    />
                                </div>
                                <div className="flex gap-3 items-center">
                                    <Button 
                                        onClick={() => setShowCreateDialog(true)}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 shadow-lg hover:shadow-xl border-0 px-6 h-12"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Group
                                    </Button>
                                    <Button 
                                        onClick={handleScheduleSession}
                                        variant="outline"
                                        className="border-primary hover:bg-primary/10 text-primary font-medium h-12"
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
                <div className="container mx-auto max-w-7xl px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Main Content Area - 3 columns */}
                        <div className="lg:col-span-3 space-y-6">
                        {/* Enhanced Stats Section */}
                        <DashboardStats 
                            userGroups={myGroups.length}
                            upcomingSessions={upcomingSessionsCount}
                            availableGroups={groups.length}
                        />

                        <Tabs defaultValue="groups" className="space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-primary/20">
                                <TabsList className="bg-transparent p-0 h-auto space-x-6">
                                    <TabsTrigger 
                                        value="groups" 
                                        className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-3 rounded-none text-muted-foreground data-[state=active]:text-foreground focus:outline-none text-lg font-bold"
                                    >
                                        My Groups
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="calendar" 
                                        className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-3 rounded-none text-muted-foreground data-[state=active]:text-foreground focus:outline-none text-lg font-bold"
                                    >
                                        Upcoming Sessions
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="discover" 
                                        className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-3 rounded-none text-muted-foreground data-[state=active]:text-foreground focus:outline-none text-lg font-bold"
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
                                        <div className="p-3 rounded-xl bg-primary text-primary-foreground w-fit mx-auto mb-4">
                                            <Users className="h-8 w-8" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
                                        <p className="text-muted-foreground mb-6">Get started by joining or creating a study group.</p>
                                        <Button
                                            onClick={() => setShowCreateDialog(true)}
                                            className="bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl border-0 text-primary-foreground"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Group
                                        </Button>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="calendar" className="mt-8">
                                <Card className="bg-gradient-to-br from-background via-background to-muted/10 backdrop-blur-md border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-xl">
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
                        
                        {/* Sidebar - 2 columns */}
                        <div className="lg:col-span-2">
                            <ActivityFeed 
                                activities={activities}
                                loading={loadingActivities}
                                onActivityClick={handleActivityClick}
                                maxItems={6}
                                currentUserInitials={getUserInitials(user)}
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
                onSuccess={async () => {
                    setShowCreateSession(false);
                    setSelectedGroupForSession(null);
                    await refreshSessionsCount();
                }}
            />
        </div>
    );
};

export default Dashboard;
