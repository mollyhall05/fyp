import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ChevronRight, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// Import shared styles and animations
import { cardVariants, buttonVariants } from "@/styles/animations";
import { cardStyles, buttonStyles, typography } from "@/styles/layout";

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
    const [isHovered, setIsHovered] = useState(false);

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
        console.log('Join group button clicked for group:', group.name);
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (!user || authError) {
                console.error('Auth error:', authError);
                toast({
                    title: "Error",
                    description: "You must be logged in to join a group",
                    variant: "destructive",
                });
                return;
            }

            console.log('User authenticated:', user.id);

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
                console.log('User is already a member');
                toast({
                    title: "Already a member",
                    description: `You're already a member of ${group.name}`,
                });
                onUpdate();
                return;
            }

            console.log('Adding user to group...');
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

            console.log('Successfully joined group');
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
        <motion.div
            initial="initial"
            animate="animate"
            whileHover="hover"
            variants={cardVariants}
            className="h-full"
        >
            <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border border-border/20 hover:border-border/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col">
                <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <CardTitle className={typography.h3}>
                                {group.name}
                            </CardTitle>
                            {group.member_count !== undefined && (
                                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4 mr-1.5" />
                                    <span>{group.member_count} {group.member_count === 1 ? 'member' : 'members'}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-6">
                    <CardDescription className="mb-6 line-clamp-3 flex-1 text-base">
                        {group.description || "No description provided"}
                    </CardDescription>

                    <motion.div
                        className="mt-auto"
                        variants={buttonVariants}
                        whileHover={isMember ? "hover" : undefined}
                        whileTap={isMember ? "tap" : undefined}
                    >
                        {isMember ? (
                            <Button 
                                onClick={handleViewGroup}
                                className="w-full bg-teal-700 hover:bg-teal-600 text-white transition-all duration-300 shadow-lg hover:shadow-xl border-0 group py-3 text-base"
                            >
                                View Group
                                <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Button>
                        ) : (
                            <Button
                                onClick={(e) => {
                                    console.log('Button clicked!');
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleJoinGroup();
                                }}
                                className="w-full bg-gradient-to-r from-accent-purple to-accent-purple/80 hover:from-accent-purple/90 hover:to-accent-purple/70 text-white transition-all duration-300 shadow-lg hover:shadow-xl border-0 group py-3 text-base"
                            >
                                <UserPlus className="mr-2 h-5 w-5" />
                                Join Group
                            </Button>
                        )}
                    </motion.div>
                </CardContent>
            </Card>
        </motion.div>
    );
};
