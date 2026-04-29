import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { itemFadeIn } from "@/styles/animations";

interface Group {
  id: string;
  name: string;
  description: string | null;
  member_count?: number;
  created_by: string;
}

interface GroupSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: Group[];
  onSelectGroup: (group: Group) => void;
}

export const GroupSelectionDialog = ({ 
  open, 
  onOpenChange, 
  groups, 
  onSelectGroup 
}: GroupSelectionDialogProps) => {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const handleSelectGroup = () => {
    if (selectedGroup) {
      onSelectGroup(selectedGroup);
      setSelectedGroup(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-teal-600" />
            Select Group for Session
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose which group you'd like to schedule a study session for:
          </p>

          {groups.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No groups available</p>
              <p className="text-sm text-muted-foreground mt-1">
                Join or create a group first to schedule sessions
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {groups.map((group, index) => (
                <motion.div
                  key={group.id}
                  variants={itemFadeIn}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedGroup?.id === group.id 
                        ? 'ring-2 ring-teal-500 border-teal-500 bg-teal-50/50' 
                        : 'hover:border-teal-300'
                    }`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-foreground">
                              {group.name}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {group.member_count || 0} members
                            </Badge>
                          </div>
                          {group.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {group.description}
                            </p>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedGroup?.id === group.id
                              ? 'bg-teal-500 border-teal-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedGroup?.id === group.id && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedGroup(null);
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSelectGroup}
              disabled={!selectedGroup}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
