import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { zoomService } from "@/lib/zoom";
import { ZoomErrorHandler } from "@/lib/zoom-error-handler";
import { Video, Loader2 } from "lucide-react";

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
    const [useZoom, setUseZoom] = useState(true);
    const [loading, setLoading] = useState(false);
    const [creatingZoomMeeting, setCreatingZoomMeeting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Ensure the user is logged in
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("You must be logged in");

            let zoomMeetingData = null;
            
            // Create Zoom meeting if online session and Zoom is enabled
            if (isOnline && useZoom) {
                setCreatingZoomMeeting(true);
                try {
                    zoomMeetingData = await zoomService.createMeeting({
                        topic: title,
                        start_time: new Date(sessionDate).toISOString(),
                        duration: duration,
                        agenda: description || `Study session for ${title}`
                    });
                    
                    toast({
                        title: "Zoom meeting created!",
                        description: "A Zoom meeting has been automatically created for this session.",
                    });
                } catch (zoomError: any) {
                    console.error('Error creating Zoom meeting:', zoomError);
                    const userFriendlyMessage = ZoomErrorHandler.getUserFriendlyMessage(zoomError);
                    toast({
                        title: "Zoom meeting failed",
                        description: userFriendlyMessage,
                        variant: "destructive",
                    });
                    // Continue without Zoom - user can add manual link
                } finally {
                    setCreatingZoomMeeting(false);
                }
            }

            // Prepare session data
            const sessionData: any = {
                group_id: groupId,
                title,
                description,
                datetime: new Date(sessionDate).toISOString(),
                duration_minutes: duration,
                is_online: isOnline
            };

            if (isOnline) {
                if (zoomMeetingData) {
                    sessionData.zoom_meeting_id = zoomMeetingData.id;
                    sessionData.zoom_join_url = zoomMeetingData.join_url;
                    sessionData.zoom_password = zoomMeetingData.password;
                    sessionData.zoom_host_url = zoomMeetingData.join_url;
                    sessionData.meeting_link = zoomMeetingData.join_url;
                } else if (meetingLink) {
                    sessionData.meeting_link = meetingLink;
                }
            } else {
                sessionData.location = location;
            }

            // Create the study session
            const { error } = await supabase
                .from("study_sessions")
                .insert(sessionData);

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
            setUseZoom(true);

            onSuccess();
            // Refresh dashboard sessions count if available
            if ((window as any).refreshDashboardSessionsCount) {
                (window as any).refreshDashboardSessionsCount();
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
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Video className="h-4 w-4 text-blue-600" />
                                    <Label htmlFor="zoom" className="text-sm font-medium">Auto-create Zoom Meeting</Label>
                                </div>
                                <Switch
                                    id="zoom"
                                    checked={useZoom}
                                    onCheckedChange={setUseZoom}
                                />
                            </div>
                            
                            {!useZoom && (
                                <div className="space-y-2">
                                    <Label htmlFor="link">Meeting Link</Label>
                                    <Input
                                        id="link"
                                        type="url"
                                        value={meetingLink}
                                        onChange={(e) => setMeetingLink(e.target.value)}
                                        placeholder="https://zoom.us/... or other meeting link"
                                    />
                                </div>
                            )}
                            
                            {useZoom && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex items-center space-x-2 text-sm text-blue-700">
                                        <Video className="h-4 w-4" />
                                        <span>A Zoom meeting will be automatically created when you save this session</span>
                                    </div>
                                </div>
                            )}
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
                            disabled={loading || creatingZoomMeeting}
                            className="flex-1 bg-gradient-primary"
                        >
                            {loading || creatingZoomMeeting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {creatingZoomMeeting ? "Creating Zoom meeting..." : "Creating..."}
                                </>
                            ) : (
                                "Create Session"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
