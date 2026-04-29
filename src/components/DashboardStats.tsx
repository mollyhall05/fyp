import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { 
  Users, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Award, 
  Target,
  BookOpen,
  Timer
} from "lucide-react";

interface DashboardStatsProps {
  userGroups: number;
  upcomingSessions: number;
  availableGroups: number;
  studyStreak?: number;
  totalStudyTime?: number;
  completedSessions?: number;
  weeklyProgress?: number;
}

export const DashboardStats = ({ 
  userGroups, 
  upcomingSessions, 
  availableGroups,
  studyStreak = 0,
  totalStudyTime = 0,
  completedSessions = 0,
  weeklyProgress = 0
}: DashboardStatsProps) => {
  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const statsCards = [
    {
      title: "Your Groups",
      value: userGroups,
      icon: Users,
      color: "from-teal-600 to-teal-700",
      bgColor: "bg-teal-600",
      trend: "+2 this week",
      trendUp: true
    },
    {
      title: "Upcoming Sessions",
      value: upcomingSessions,
      icon: Calendar,
      color: "from-purple-600 to-purple-700",
      bgColor: "bg-purple-600",
      trend: "+1 tomorrow",
      trendUp: true
    },
    {
      title: "Study Streak",
      value: `${studyStreak} days`,
      icon: Award,
      color: "from-orange-600 to-orange-700",
      bgColor: "bg-orange-600",
      trend: "Keep it up!",
      trendUp: true
    },
    {
      title: "Total Study Time",
      value: formatStudyTime(totalStudyTime),
      icon: Timer,
      color: "from-blue-600 to-blue-700",
      bgColor: "bg-blue-600",
      trend: "+2.5h this week",
      trendUp: true
    },
    {
      title: "Completed Sessions",
      value: completedSessions,
      icon: Target,
      color: "from-green-600 to-green-700",
      bgColor: "bg-green-600",
      trend: "+3 this week",
      trendUp: true
    },
    {
      title: "Weekly Progress",
      value: `${weeklyProgress}%`,
      icon: TrendingUp,
      color: "from-indigo-600 to-indigo-700",
      bgColor: "bg-indigo-600",
      trend: "On track",
      trendUp: true,
      showProgress: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {statsCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <Card className="relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-white/20 dark:border-gray-700/20 hover:border-white/30 dark:hover:border-gray-700/30 transition-all duration-300 hover:shadow-xl">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`}></div>
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-white/60 dark:bg-gray-700/60 shadow-lg border border-white/20 dark:border-gray-600/20">
                  <stat.icon className="h-5 w-5 text-foreground" />
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    stat.trendUp 
                      ? "text-green-600 border-green-200 bg-green-50" 
                      : "text-red-600 border-red-200 bg-red-50"
                  }`}
                >
                  {stat.trend}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                
                {stat.showProgress && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Weekly Goal</span>
                      <span>{weeklyProgress}%</span>
                    </div>
                    <Progress value={weeklyProgress} className="h-2" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
