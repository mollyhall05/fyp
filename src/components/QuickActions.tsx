import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  Plus, 
  Calendar, 
  Search, 
  Bell, 
  Users, 
  BookOpen,
  Settings,
  MessageSquare,
  Target
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickActionsProps {
  onCreateGroup?: () => void;
  onCreateSession?: () => void;
}

export const QuickActions = ({ onCreateGroup, onCreateSession }: QuickActionsProps) => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "Create Group",
      description: "Start a new study group",
      icon: Plus,
      color: "from-teal-600 to-teal-700",
      action: onCreateGroup || (() => {}),
      primary: true
    },
    {
      title: "Schedule Session",
      description: "Plan a study session",
      icon: Calendar,
      color: "from-purple-600 to-purple-700",
      action: onCreateSession || (() => {}),
      primary: false
    },
    {
      title: "Find Groups",
      description: "Discover study groups",
      icon: Search,
      color: "from-blue-600 to-blue-700",
      action: () => navigate('/dashboard?tab=discover'),
      primary: false
    },
    {
      title: "Join Study Room",
      description: "Enter active session",
      icon: BookOpen,
      color: "from-green-600 to-green-700",
      action: () => navigate('/sessions'),
      primary: false
    },
    {
      title: "Messages",
      description: "Check group chats",
      icon: MessageSquare,
      color: "from-orange-600 to-orange-700",
      action: () => navigate('/messages'),
      primary: false
    },
    {
      title: "Settings",
      description: "Manage preferences",
      icon: Settings,
      color: "from-gray-600 to-gray-700",
      action: () => navigate('/settings'),
      primary: false
    }
  ];

  return (
    <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border border-border/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant={action.primary ? "default" : "outline"}
                className={`h-auto p-4 w-full justify-start text-left ${
                  action.primary 
                    ? `bg-gradient-to-r ${action.color} hover:opacity-90 border-0 text-white shadow-lg hover:shadow-xl` 
                    : 'hover:bg-muted/50 border-border/20'
                }`}
                onClick={action.action}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    action.primary 
                      ? 'bg-white/20' 
                      : `bg-gradient-to-br ${action.color} text-white`
                  }`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${
                      action.primary ? 'text-white' : 'text-foreground'
                    }`}>
                      {action.title}
                    </p>
                    <p className={`text-xs ${
                      action.primary ? 'text-white/80' : 'text-muted-foreground'
                    }`}>
                      {action.description}
                    </p>
                  </div>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
