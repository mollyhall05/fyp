import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Plus, LogOut, User, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { GroupCard } from "@/components/GroupCard";

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
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        checkUser();
        loadGroups();
    }, []);

    // Check if the user is authenticated and set the user state
    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            navigate("/auth");
            return;
        }
        setUser(session.user);
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
        <div className="min-h-screen bg-gradient-to-br from-background to-muted">
            {/* Header */}
            <header className="border-b bg-card/80 backdrop-blur-lg">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="bg-gradient-primary p-2 rounded-lg">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-blue-700">
                StudySync
              </span>
                        </div>

                        <div className="relative">
                            <Button 
                                variant="ghost" 
                                className="flex items-center gap-2 group"
                                onClick={() => setShowProfile(prev => !prev)}
                            >
                                <User className="h-5 w-5" />
                                <span className="hidden sm:inline">Profile</span>
                                <ChevronDown className={`h-4 w-4 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
                            </Button>
                            
                            {showProfile && (
                                <div className="absolute right-0 mt-1 w-72 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                                    <div className="p-4">
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">My Account</h3>
                                        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.email?.split('@')[0]}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                {user?.email}
                                            </p>
                                        </div>
                                        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            <span>Sign out</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* My Groups Section */}
                {myGroups.length > 0 && (
                    <section className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold">My Study Groups</h2>
                                <p className="text-muted-foreground">Groups you're a member of</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myGroups.map((group) => (
                                <GroupCard key={group.id} group={group} isMember onUpdate={loadGroups} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Available Groups Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold">Discover Study Groups</h2>
                            <p className="text-muted-foreground">Find and join groups that match your interests</p>
                        </div>
                        <Button
                            onClick={() => setShowCreateDialog(true)}
                            className="bg-gradient-primary"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            Create Group
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">Loading groups...</p>
                        </div>
                    ) : groups.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groups.map((group) => (
                                <GroupCard key={group.id} group={group} onUpdate={loadGroups} />
                            ))}
                        </div>
                    ) : (
                        <Card className="shadow-soft">
                            <CardContent className="py-12 text-center">
                                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-muted-foreground">
                                    No groups available yet. Be the first to create one!
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </section>
            </main>

            <CreateGroupDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onSuccess={handleGroupCreated}
            />
        </div>
    );
};

export default Dashboard;
