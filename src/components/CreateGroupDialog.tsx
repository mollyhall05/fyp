import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export const CreateGroupDialog = ({ open, onOpenChange, onSuccess }: CreateGroupDialogProps) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [subject, setSubject] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Ensure the user is logged in
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast({
                    title: "Error",
                    description: "You must be logged in to create a group",
                    variant: "destructive",
                });
                setLoading(false);
                return;
            }

            // Create the group
            const { data: group, error: groupError } = await supabase
                .from("groups")
                .insert({
                    name,
                    description,
                    subject,
                    is_public: isPublic,
                    created_by: user.id,
                    created_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (groupError) {
                console.error('Error creating group:', groupError);
                toast({
                    title: "Error",
                    description: "Failed to create study group. Please try again.",
                    variant: "destructive",
                });
                return;
            }

            // Add the creator of the group as the first member with admin privileges
            const { error: memberError } = await supabase
                .from("group_members")
                .insert({
                    group_id: group.id,
                    user_id: user.id,
                    is_admin: true,
                });

            if (memberError) {
                console.error('Error adding member to group:', memberError);
                toast({
                    title: "Error",
                    description: "Failed to add you to the study group. Please try again.",
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "Success!",
                description: "Study group created successfully",
            });

            // Reset the form
            setName("");
            setDescription("");
            setSubject("");

            onSuccess();
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Study Group</DialogTitle>
                    <DialogDescription>
                        Create a new study group and invite others to join
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Group Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Advanced Calculus Study Group"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g., Mathematics, Computer Science"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what this group is about..."
                            rows={3}
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-md">
                        <div className="space-y-0.5">
                            <Label htmlFor="privacy-toggle" className="text-base">
                                {isPublic ? 'Public Group' : 'Private Group'}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                {isPublic 
                                    ? 'Anyone can find and join this group' 
                                    : 'Only people with an invite link can join'}
                            </p>
                        </div>
                        <Switch
                            id="privacy-toggle"
                            checked={isPublic}
                            onCheckedChange={setIsPublic}
                            className="data-[state=checked]:bg-blue-600"
                        />
                    </div>

                    <div className="flex gap-3 mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-gradient-primary"
                        >
                            {loading ? "Creating..." : "Create Group"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
