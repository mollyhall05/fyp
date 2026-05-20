import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle2, Clock, X, HelpCircle } from 'lucide-react';

interface Member {
    id: string;
    username: string | null;
    email: string;
    is_admin: boolean;
    rsvp_status: 'attending' | 'maybe' | 'not_attending' | null;
}

interface MemberListProps {
    members: Member[];
}

const MemberList: React.FC<MemberListProps> = ({ members }) => {
    return (
        <div className="space-y-3">
            {members.map((member) => (
                <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-muted/30 hover:bg-muted/30 transition-colors"
                >
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-primary">
                                    {(member.username || member.email || 'U').charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p className="font-medium text-foreground">
                                    {member.username || member.email}
                                </p>
                                {member.is_admin && (
                                    <Badge variant="secondary" className="text-xs">
                                        Admin
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {member.rsvp_status ? (
                            <Badge
                                className={
                                    member.rsvp_status === 'attending'
                                        ? 'bg-green-100 text-green-700 border-green-200'
                                        : member.rsvp_status === 'maybe'
                                        ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                        : 'bg-red-100 text-red-700 border-red-200'
                                }
                            >
                                {member.rsvp_status === 'attending' && (
                                    <CheckCircle2 className="h-3 w-3 mr-1"/>
                                )}
                                {member.rsvp_status === 'maybe' && (
                                    <Clock className="h-3 w-3 mr-1"/>
                                )}
                                {member.rsvp_status === 'not_attending' && (
                                    <X className="h-3 w-3 mr-1"/>
                                )}
                                {member.rsvp_status === 'attending' && 'Attending'}
                                {member.rsvp_status === 'maybe' && 'Maybe'}
                                {member.rsvp_status === 'not_attending' && 'Not Attending'}
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                                <HelpCircle className="h-3 w-3 mr-1"/>
                                No Response
                            </Badge>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MemberList;
