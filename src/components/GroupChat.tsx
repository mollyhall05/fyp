import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {data} from "autoprefixer";

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

const GroupChat = ({ groupId }: GroupChatProps) => {
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

    const loadMessages = async () => {
        try {
            console.log('Loading messages for group:', groupId);
            const { data: messages, error } = await supabase
                .from('group_messages')
                .select(`
                    *,
                    profiles:user_id (username)
                `)
                .eq('group_id', groupId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error loading messages:', error);
                throw error;
            }
            
            if (data) {
                console.log('Messages loaded:', data);
                setMessages(data as unknown as MessageWithProfile[]);
            } else {
                console.log('No messages found');
                setMessages([]);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setLoading(true);
        try {
            // Get the current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
                throw new Error('You must be logged in to send messages');
            }

            const { error } = await supabase
                .from('group_messages')
                .insert([
                    { 
                        content: newMessage, 
                        group_id: groupId,
                        user_id: user.id  // Include the user_id
                    }
                ]);

            if (error) throw error;
            
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            toast({
                title: "Error sending message",
                description: error instanceof Error ? error.message : 'Failed to send message',
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const subscribeToMessages = () => {
        const channel = supabase
            .channel('group_messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'group_messages',
                filter: `group_id=eq.${groupId}`
            }, (payload) => {
                console.log('New message received:', payload);
                setMessages(prev => [...prev, payload.new as Message]);
            })
            .subscribe((status, err) => {
                if (err) {
                    console.error('Subscription error:', err);
                    return;
                }
                console.log('Subscription status:', status);
            });

        return () => {
            console.log('Unsubscribing from messages');
            supabase.removeChannel(channel);
        };
    };

    console.log('Rendering messages:', messages);
    
    return (
        <Card className="shadow-soft h-[600px] flex flex-col">
            <CardHeader>
                <CardTitle>Group Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4">
                            No messages yet. Send a message to start the conversation!
                        </div>
                    ) : (
                        messages.map((message) => (
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
                        ))
                    )}
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

export default GroupChat;