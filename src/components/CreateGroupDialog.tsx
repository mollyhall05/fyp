import React, { useState } from "react";
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
                    is_public: isPublic,
                    created_by: user.id,
                    users: [user.id]
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
            await supabase
                .from("group_members")
                .insert({
                    group_id: group.id,
                    user_id: user.id,
                    is_admin: true,
                });

            toast({
                title: "Success!",
                description: "Study group created successfully",
            });

            // Reset the form
            setName("");
            setDescription("");

            onSuccess();
            onOpenChange(false); // Close the dialog on success
        } catch (error: any) {
            console.error('Error in handleSubmit:', error);
            toast({
                title: "Error",
                description: error.message || "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 backdrop-blur-xl border border-teal-500/30 shadow-2xl shadow-teal-500/15">
                <DialogHeader>
                    <DialogTitle className="text-white text-xl">Create Study Group</DialogTitle>
                    <DialogDescription className="text-gray-300">
                        Create a new study group and invite others to join
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-200 font-medium">Group Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Advanced Calculus Study Group"
                            required
                            className="bg-slate-700/50 border-teal-500/30 text-white placeholder-white/70 focus:border-teal-400 focus:ring-teal-400/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-gray-200 font-medium">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what this group is about..."
                            rows={3}
                            className="bg-slate-700/50 border-teal-500/30 text-white placeholder-white/70 focus:border-teal-400 focus:ring-teal-400/20"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-700/30 border-teal-500/30">
                        <div className="space-y-0.5">
                            <Label htmlFor="privacy-toggle" className="text-base text-gray-200 font-medium">
                                {isPublic ? 'Public Group' : 'Private Group'}
                            </Label>
                            <p className="text-sm text-gray-400">
                                {isPublic 
                                    ? 'Anyone can find and join this group' 
                                    : 'Only people with an invite link can join'}
                            </p>
                        </div>
                        <Switch
                            id="privacy-toggle"
                            checked={isPublic}
                            onCheckedChange={setIsPublic}
                            className="data-[state=checked]:bg-teal-600"
                        />
                    </div>

                    <div className="flex gap-3 mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 bg-slate-600/50 border-teal-500/30 text-white hover:bg-slate-600/70"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white shadow-lg shadow-teal-500/20"
                        >
                            {loading ? "Creating..." : "Create Group"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
