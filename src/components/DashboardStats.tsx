import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Users, Calendar } from "lucide-react";

interface DashboardStatsProps {
  userGroups: number;
  upcomingSessions: number;
  availableGroups: number;
}

export const DashboardStats = ({ 
  userGroups, 
  upcomingSessions, 
  availableGroups,
}: DashboardStatsProps) => {

  const statsCards = [
    {
      title: "Your Groups",
      value: userGroups,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      gradient: "from-blue-500/20 to-cyan-500/20"
    },
    {
      title: "Upcoming Sessions",
      value: upcomingSessions,
      icon: Calendar,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      gradient: "from-emerald-500/20 to-green-500/20"
    },
      {
          title: "Available Groups",
          value: availableGroups,
          icon: Users,
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
          gradient: "from-amber-500/20 to-orange-500/20"
      }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
      {statsCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          whileHover={{ y: -3, scale: 1.01 }}
          className="w-full"
        >
          <Card className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} ${stat.bgColor} ${stat.borderColor} border-2 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 w-full`}>
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor} ${stat.borderColor} border`}>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-4xl font-bold text-foreground">{stat.value}</p>
                <p className="text-base text-muted-foreground">{stat.title}</p>
              </div>

              {/* Subtle decorative element */}
              <div className={`absolute -bottom-2 -right-2 w-20 h-20 rounded-full ${stat.bgColor} opacity-30 blur-xl`}></div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
