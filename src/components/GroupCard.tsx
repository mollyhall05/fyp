import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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

export const GroupCard = ({ group, isMember, onUpdate }: GroupCardProps) => {
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleJoinGroup = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast({
                    title: "Error",
                    description: "You must be logged in to join a group",
                    variant: "destructive",
                });
                return;
            }

            await supabase
                .from("group_members")
                .insert({
                    group_id: group.id,
                    user_id: user.id,
                    is_admin: false,
                });

            toast({
                title: "Success!",
                description: `You've joined ${group.name}`,
            });
            onUpdate();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
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
