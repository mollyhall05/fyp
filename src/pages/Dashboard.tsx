import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus, LogOut, Calendar, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { GroupCard } from "@/components/GroupCard";

interface StudyGroup {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    created_by: string;
    updated_at: string;
    member_count?: number;
}

const Dashboard = () => {
    const [user, setUser] = useState<any>(null);
    const [groups, setGroups] = useState<StudyGroup[]>([]);
    const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        checkUser();
        loadGroups();
    }, []);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            navigate("/auth");
            return;
        }
        setUser(session.user);
    };

    const loadGroups = async () => {
        try {
            setLoading(true);

            // Load all public groups
            const { data: publicGroups, error: publicError } = await supabase
                .from("groups")
                .select("*")
                .order("created_at", { ascending: false });

            if (publicError) throw publicError;

            // Load groups user is a member of
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: memberGroups, error: memberError } = await supabase
                    .from("group_members")
                    .select("group_id")
                    .eq("user_id", user.id);

                if (memberError) throw memberError;

                const memberGroupIds = memberGroups?.map(m => m.group_id) || [];
                const userGroups = publicGroups?.filter(g => memberGroupIds.includes(g.id)) || [];
                const availableGroups = publicGroups?.filter(g => !memberGroupIds.includes(g.id)) || [];

                setMyGroups(userGroups);
                setGroups(availableGroups);
            } else {
                setGroups(publicGroups || []);
            }
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

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    const handleGroupCreated = () => {
        loadGroups();
        setShowCreateDialog(false);
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
                            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                StudySync
              </span>
                        </div>

                        <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user?.email}
              </span>
                            <Button variant="ghost" size="icon" onClick={handleSignOut}>
                                <LogOut className="h-5 w-5" />
                            </Button>
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
