import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {data} from "autoprefixer";
import {channel} from "node:diagnostics_channel";

interface Profile {
    username: string;
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
        const unsubscribe = subscribeToMessages();
        
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [groupId]); // Re-run when groupId changes

    type MessageWithProfile = {
        id: string;
        content: string;
        created_at: string;
        user_id: string;
        group_id: string;
        profiles: {
            username: string;
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
            
            if (messages) {
                console.log('Messages loaded:', messages);
                setMessages(messages as unknown as MessageWithProfile[]);
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

            // Create a temporary message ID for optimistic update
            const tempId = `temp-${Date.now()}`;
            const now = new Date().toISOString();
            
            // Optimistically add the message to the UI
            const optimisticMessage: Message = {
                id: tempId,
                content: newMessage,
                created_at: now,
                user_id: user.id,
                group_id: groupId,
                profiles: {
                    username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'You',
                    email: user.email || ''
                }
            };

            // Add the message to the UI immediately
            setMessages(prev => [...prev, optimisticMessage]);
            setNewMessage('');
            
            // Scroll to the bottom to show the new message
            setTimeout(() => {
                const messagesContainer = document.querySelector('.messages-container');
                if (messagesContainer) {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            }, 0);

            // Send the message to the server
            const { data, error } = await supabase
                .from('group_messages')
                .insert([
                    { 
                        content: newMessage, 
                        group_id: groupId,
                        user_id: user.id
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            // The realtime subscription will handle updating the message with the server-generated ID
            // But we'll update the optimistic message just in case
            if (data) {
                setMessages(prev => 
                    prev.map(msg => 
                        msg.id === tempId ? { ...msg, id: data.id } : msg
                    )
                );
            }
        } catch (error) {
            console.error('Error sending message:', error);
            // Remove the optimistic message on error
            let tempId = `temp-${Date.now()}`;
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
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
        // Create a unique channel name for this subscription
        const channelName = `group:${groupId}`;
        console.log('Setting up subscription for channel:', channelName);
        
        // Create a channel for realtime updates
        const channel = supabase.channel(channelName);
        
        // Subscribe to new messages
        const subscription = channel
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'group_messages',
                    filter: `group_id=eq.${groupId}`
                },
                async (payload) => {
                    console.log('New message received:', payload);

                    try {
                        // Fetch the user's profile for the new message
                        const { data: user, error } = await supabase
                            .from('users')
                            .select('username, email')
                            .eq('id', payload.new.user_id)
                            .single();

                        if (error) {
                            console.error('Error fetching user:', error);
                            return;
                        }

                        // Create a new message object with the profile data
                        const newMessage: Message = {
                            id: payload.new.id,
                            content: payload.new.content,
                            created_at: payload.new.created_at,
                            user_id: payload.new.user_id,
                            group_id: payload.new.group_id,
                            profiles: {
                                username: user?.username || 'Unknown',
                                email: user?.email || ''
                            }
                        };

                        console.log('Adding new message:', newMessage);
                        
                        // Update the messages state
                        setMessages(prev => {
                            // Check if message already exists to prevent duplicates
                            if (!prev.some(m => m.id === newMessage.id)) {
                                return [...prev, newMessage];
                            }
                            return prev;
                        });
                    } catch (error) {
                        console.error('Error processing new message:', error);
                    }
                }
            )
            .subscribe((status, err) => {
                if (err) {
                    console.error('Subscription error:', err);
                    return;
                }
                console.log('Subscription status:', status);
            });

        // Return cleanup function
        return () => {
            console.log('Unsubscribing from channel:', channelName);
            subscription.unsubscribe();
        };
    };

    console.log('Rendering messages:', messages);
    
    // Auto-scroll to bottom when messages change
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <Card className="shadow-soft h-[600px] flex flex-col">
            <CardHeader className="border-b p-4">
                <CardTitle className="text-lg">Group Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 messages-container">
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            No messages yet. Send a message to start the conversation!
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div key={message.id} className="flex gap-3">
                                <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                    {message.profiles?.username?.[0]?.toUpperCase() || "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="font-medium text-sm truncate">
                                            {message.profiles?.username || "Anonymous"}
                                        </span>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(message.created_at).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="text-sm bg-muted rounded-lg p-3 break-words">
                                        {message.content}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
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