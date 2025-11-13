import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface GroupCardProps {
    group: {
        id: string;
        name: string;
        description: string | null;
        created_by: string;
        member_count?: number;
    };
    isMember?: boolean;
    onUpdate: () => void;
}

export const GroupCard = ({ group: initialGroup, isMember, onUpdate }: GroupCardProps) => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [group, setGroup] = useState(initialGroup);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMemberCount = async () => {
            try {
                const { count } = await supabase
                    .from('group_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('group_id', group.id);

                setGroup(prev => ({
                    ...prev,
                    member_count: count || 0
                }));
            } catch (error) {
                console.error('Error fetching member count:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMemberCount();
    }, [group.id]);

    // Update local state if the group prop changes
    useEffect(() => {
        setGroup(initialGroup);
    }, [initialGroup]);

    const handleJoinGroup = async () => {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (!user || authError) {
                toast({
                    title: "Error",
                    description: "You must be logged in to join a group",
                    variant: "destructive",
                });
                return;
            }

            // First check if user is already a member
            const { data: existingMember, error: checkError } = await supabase
                .from("group_members")
                .select()
                .eq("group_id", group.id)
                .eq("user_id", user.id)
                .maybeSingle();

            if (checkError) {
                console.error('Error checking group membership:', checkError);
                toast({
                    title: "Error checking membership",
                    description: checkError.message || "Failed to check membership. Please try again.",
                    variant: "destructive",
                });
                return;
            }
            
            if (existingMember) {
                toast({
                    title: "Already a member",
                    description: `You're already a member of ${group.name}`,
                });
                onUpdate();
                return;
            }

            const { error: insertError } = await supabase
                .from("group_members")
                .insert({
                    group_id: group.id,
                    user_id: user.id,
                    is_admin: false,
                });

            if (insertError) {
                console.error('Error joining group:', insertError);
                toast({
                    title: "Error joining group",
                    description: insertError.message || "Failed to join the group. Please try again.",
                    variant: "destructive",
                });
                return;
            }

            // Update the member count locally
            setGroup(prev => ({
                ...prev,
                member_count: (prev.member_count || 0) + 1
            }));

            toast({
                title: "Success!",
                description: `You've joined ${group.name}`,
            });
            onUpdate();
        } catch (error: any) {
            console.error('Error joining group:', error);
            toast({
                title: "Error joining group",
                description: error.message || "Failed to join the group. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleViewGroup = () => {
        navigate(`/group/${group.id}`);
    };

    return (
        <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{group.name}</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <CardDescription className="mb-4 line-clamp-2">
                    {group.description || "No description provided"}
                </CardDescription>

                {group.member_count !== undefined && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{group.member_count} members</span>
                        </div>
                    </div>
                )}

                {isMember ? (
                    <Button
                        onClick={handleViewGroup}
                        className="w-full bg-gradient-primary"
                    >
                        View Group
                    </Button>
                ) : (
                    <Button
                        onClick={handleJoinGroup}
                        variant="outline"
                        className="w-full"
                    >
                        Join Group
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};
