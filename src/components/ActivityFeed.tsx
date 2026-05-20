import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Calendar, MessageSquare, UserPlus, Clock, Star, Users, TrendingUp } from "lucide-react";
import { itemFadeIn } from "@/styles/animations";

interface ActivityItem {
  id: string;
  type: 'session' | 'message' | 'member_joined' | 'session_completed' | 'group_created';
  title: string;
  description: string;
  user?: {
    name: string;
    avatar?: string;
  };
  group?: string;
  metadata?: {
    sessionId?: string;
    groupId?: string;
  };
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  loading?: boolean;
  maxItems?: number;
  onActivityClick?: (activity: ActivityItem) => void;
  currentUserInitials?: string;
}

export const ActivityFeed = ({ activities, loading = false, maxItems = 5, onActivityClick, currentUserInitials }: ActivityFeedProps) => {
  const getActivityIcon = (type: ActivityItem['type']) => {
    const iconClasses = "h-4 w-4";
    switch (type) {
      case 'session':
        return <Calendar className={iconClasses} />;
      case 'message':
        return <MessageSquare className={iconClasses} />;
      case 'member_joined':
        return <UserPlus className={iconClasses} />;
      case 'session_completed':
        return <Star className={iconClasses} />;
      case 'group_created':
        return <Users className={iconClasses} />;
      default:
        return <Clock className={iconClasses} />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'session':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'message':
        return 'bg-success/10 text-success border-success/30';
      case 'member_joined':
        return 'bg-secondary/10 text-secondary border-secondary/30';
      case 'session_completed':
        return 'bg-accent/10 text-accent border-accent/30';
      case 'group_created':
        return 'bg-primary/20 text-primary border-primary/40';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/30';
    }
  };

  const recentActivities = activities.slice(0, maxItems);

  return (
    <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border border-border/20 w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg">
                <div className="p-2 rounded-full bg-muted animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recentActivities.length === 0 ? (
          <div className="text-center py-8">
            <div className="p-3 rounded-xl bg-muted/50 w-fit mx-auto mb-3">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-base">No recent activity</p>
            <p className="text-muted-foreground text-sm mt-1">
              Your activity will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                variants={itemFadeIn}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => onActivityClick?.(activity)}
              >
                <div className={`p-2 rounded-full border ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-base font-medium text-foreground line-clamp-1">
                        {activity.title}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {activity.description}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        {activity.user && (
                          <div className="flex items-center gap-1">
                            <div className="h-6 w-6 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground text-xs font-semibold">
                              {activity.user.name === "You" && currentUserInitials 
                                ? currentUserInitials 
                                : activity.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {activity.user.name}
                            </span>
                          </div>
                        )}
                        
                        {activity.group && (
                          <Badge variant="outline" className="text-sm">
                            {activity.group}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
