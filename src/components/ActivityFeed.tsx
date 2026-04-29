import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import {
    Calendar,
    MessageSquare,
    UserPlus,
    Clock,
    Star,
    BookOpen,
    Users,
    TrendingUp, Award
} from "lucide-react";
import { itemFadeIn } from "@/styles/animations";

interface ActivityItem {
  id: string;
  type: 'session' | 'message' | 'member_joined' | 'session_completed' | 'achievement' | 'group_created';
  title: string;
  description: string;
  timestamp: string;
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
}

export const ActivityFeed = ({ activities, loading = false, maxItems = 5 }: ActivityFeedProps) => {
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
      case 'achievement':
        return <Award className={iconClasses} />;
      case 'group_created':
        return <Users className={iconClasses} />;
      default:
        return <Clock className={iconClasses} />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'session':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'message':
        return 'bg-green-100 text-green-600 border-green-200';
      case 'member_joined':
        return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'session_completed':
        return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'achievement':
        return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'group_created':
        return 'bg-teal-100 text-teal-600 border-teal-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const recentActivities = activities.slice(0, maxItems);

  return (
    <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border border-border/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs">
            View All
          </Button>
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
            <p className="text-muted-foreground text-sm">No recent activity</p>
            <p className="text-muted-foreground text-xs mt-1">
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
              >
                <div className={`p-2 rounded-full border ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground line-clamp-1">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {activity.description}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        {activity.user && (
                          <div className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarFallback className="text-xs">
                                {activity.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                              {activity.user.name}
                            </span>
                          </div>
                        )}
                        
                        {activity.group && (
                          <Badge variant="outline" className="text-xs">
                            {activity.group}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(activity.timestamp)}
                    </span>
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
