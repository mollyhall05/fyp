import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
    full_name: string;
    email: string;
}

interface Message {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    group_id: string;
    profiles: Profile;
}

interface GroupChatProps {
    groupId: string;
}

export const GroupChat = ({ groupId }: GroupChatProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadMessages();
        subscribeToMessages();
    }, [groupId]);

    type MessageWithProfile = {
        id: string;
        content: string;
        created_at: string;
        user_id: string;
        group_id: string;
        profiles: {
            full_name: string;
            email: string;
        } | null;
    };

    // Base message type for the database query
    type DatabaseMessage = Omit<MessageWithProfile, 'profiles'> & {
        profiles: Profile | null;
    };

    const loadMessages = async () => {
        try {
            const { data, error } = await supabase
                .from("messages")
                .select<`
                    *,
                    profiles:user_id (
                        full_name,
                        email
                    )
                `, DatabaseMessage, MessageWithProfile>(`
                    *,
                    profiles:user_id (
                        full_name,
                        email
                    )
                `)
                .eq("group_id", groupId)
                .order("created_at", { ascending: true });

            if (error) throw error;
            setMessages(data || []);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const subscribeToMessages = () => {
        const channel = supabase
            .channel(`messages:${groupId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `group_id=eq.${groupId}`,
                },
                () => {
                    loadMessages();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase
                .from("messages")
                .insert({
                    group_id: groupId,
                    user_id: user.id,
                    content: newMessage.trim(),
                });

            if (error) throw error;
            setNewMessage("");
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
        <Card className="shadow-soft h-[600px] flex flex-col">
            <CardHeader>
                <CardTitle>Group Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                    {messages.map((message) => (
                        <div key={message.id} className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                {message.profiles?.full_name?.[0] || "?"}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {message.profiles?.full_name || "Anonymous"}
                  </span>
                                    <span className="text-xs text-muted-foreground">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </span>
                                </div>
                                <p className="text-sm bg-muted rounded-lg p-3">{message.content}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        disabled={loading}
                    />
                    <Button
                        type="submit"
                        disabled={loading || !newMessage.trim()}
                        className="bg-gradient-primary"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};
