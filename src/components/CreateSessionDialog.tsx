import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateSessionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: string;
    onSuccess: () => void;
}

export const CreateSessionDialog = ({
                                        open,
                                        onOpenChange,
                                        groupId,
                                        onSuccess,
                                    }: CreateSessionDialogProps) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [sessionDate, setSessionDate] = useState("");
    const [duration, setDuration] = useState(60);
    const [isOnline, setIsOnline] = useState(false);
    const [location, setLocation] = useState("");
    const [meetingLink, setMeetingLink] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Ensure the user is logged in
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("You must be logged in");

            // Create the study session
            const { error } = await supabase
                .from("study_sessions")
                .insert({
                    group_id: groupId,
                    title,
                    description,
                    datetime: new Date(sessionDate).toISOString()
                } as any);

            if (error) throw error;

            toast({
                title: "Success!",
                description: "Study session created successfully",
            });

            // Reset the form
            setTitle("");
            setDescription("");
            setSessionDate("");
            setDuration(60);
            setIsOnline(false);
            setLocation("");
            setMeetingLink("");

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
                    <DialogTitle>Schedule Study Session</DialogTitle>
                    <DialogDescription>
                        Create a new study session for your group
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Session Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Chapter 5 Review"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What will you cover in this session?"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date & Time</Label>
                            <Input
                                id="date"
                                type="datetime-local"
                                value={sessionDate}
                                onChange={(e) => setSessionDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration (minutes)</Label>
                            <Input
                                id="duration"
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(parseInt(e.target.value))}
                                min={15}
                                max={480}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="online">Online Session</Label>
                        <Switch
                            id="online"
                            checked={isOnline}
                            onCheckedChange={setIsOnline}
                        />
                    </div>

                    {isOnline ? (
                        <div className="space-y-2">
                            <Label htmlFor="link">Meeting Link</Label>
                            <Input
                                id="link"
                                type="url"
                                value={meetingLink}
                                onChange={(e) => setMeetingLink(e.target.value)}
                                placeholder="https://zoom.us/..."
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g., Library Room 201"
                            />
                        </div>
                    )}

                    <div className="flex gap-3">
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
                            {loading ? "Creating..." : "Create Session"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
