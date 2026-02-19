import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
    User,
    Mail,
    ChevronLeft,
    Save,
    Loader2
} from "lucide-react";

const ProfileEdit = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        bio: ''
    });

    useEffect(() => {
        const loadUserProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    navigate('/auth');
                    return;
                }

                setUser(user);
                setFormData({
                    full_name: user.user_metadata?.full_name || '',
                    email: user.email || '',
                    bio: user.user_metadata?.bio || ''
                });
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to load profile",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        loadUserProfile();
    }, [navigate, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: formData.full_name,
                    bio: formData.bio
                }
            });

            if (error) throw error;

            toast({
                title: "Success!",
                description: "Your profile has been updated.",
            });
            
            // Navigate back to dashboard after successful update
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update profile",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Back Button */}
                    <Button 
                        variant="ghost" 
                        onClick={() => navigate(-1)} 
                        className="mb-6"
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>

                    {/* Main Form Card */}
                    <Card className="overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                            <CardTitle className="text-2xl flex items-center">
                                <User className="h-6 w-6 mr-3" />
                                Edit Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Profile Avatar */}
                                <div className="flex justify-center mb-6">
                                    <Avatar className="h-24 w-24">
                                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                                        <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                            {formData.full_name ? formData.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>

                                {/* Full Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="full_name" className="text-sm font-medium">
                                        Full Name
                                    </Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="full_name"
                                            type="text"
                                            value={formData.full_name}
                                            onChange={(e) => handleInputChange('full_name', e.target.value)}
                                            className="pl-10"
                                            placeholder="Enter your full name"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium">
                                        Email
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            disabled
                                            className="pl-10 bg-muted/50"
                                            placeholder="Your email address"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Email cannot be changed. Contact support if needed.
                                    </p>
                                </div>

                                {/* Bio */}
                                <div className="space-y-2">
                                    <Label htmlFor="bio" className="text-sm font-medium">
                                        Bio
                                    </Label>
                                    <Textarea
                                        id="bio"
                                        value={formData.bio}
                                        onChange={(e) => handleInputChange('bio', e.target.value)}
                                        placeholder="Tell us about yourself..."
                                        rows={4}
                                        className="resize-none"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Brief description for your profile (optional)
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate(-1)}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default ProfileEdit;
