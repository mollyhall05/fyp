import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Session = {
  id: string;
  title: string;
  description: string | null;
  session_date: string;
  group_id: string;
  group_name?: string;
};

export const Session = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("study_sessions")
          .select(`
            *,
            groups (name)
          `)
          .eq("id", sessionId)
          .single();

        if (error) throw error;

        setSession({
          ...data,
          group_name: data.groups?.name,
        });
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

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId, toast]);

  if (loading) {
    return <div className="p-6">Loading session details...</div>;
  }

  if (!session) {
    return <div className="p-6">Session not found</div>;
  }

  const sessionDate = new Date(session.session_date);
  const formattedDate = sessionDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">{session.title}</h1>
          {session.group_name && (
            <p className="text-muted-foreground">
              Group: {session.group_name}
            </p>
          )}
          <p className="text-muted-foreground">{formattedDate}</p>
        </div>

        {session.description && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="whitespace-pre-line">{session.description}</p>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back to Group
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Session;
