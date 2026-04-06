import React, { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Users, BookOpen, Brain, Zap, ArrowRight, Mail, Lock, User, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Auth = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("signin");
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {

        // Check if the user is already logged in
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
            if (session) {
                navigate("/dashboard");
            }
        });

        // Listen for authentication changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
            if (session) {
                navigate("/dashboard");
            }
        });
        return () => subscription.unsubscribe();
    }, [navigate]);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Check if email or username already exists
            const { data: existingEmail } = await supabase
                .from('users')
                .select('email')
                .eq('email', email)
                .maybeSingle();

            if (existingEmail) {
                toast({
                    title: "Email already registered",
                    description: "This email is already in use. Please sign in instead.",
                    variant: "destructive",
                });
                return;
            }

            const { data: existingUsername } = await supabase
                .from('users')
                .select('username')
                .eq('username', username.trim())
                .maybeSingle();

            if (existingUsername) {
                toast({
                    title: "Username already taken",
                    description: "This username is already taken. Please choose a different one.",
                    variant: "destructive",
                });
                return;
            }

            // 2. Create a new user
            const { data: authData } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username.trim(),
                        first_name: firstName.trim(),
                        last_name: lastName.trim(),
                        full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
                    },
                    emailRedirectTo: window.location.origin,
                },
            });

            // 3. Add to 'users' table
            const { error: userError } = await supabase
                .from('users')
                .upsert({
                    id: authData.user?.id,
                    email: email,
                    username: username.trim(),
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
                }, {
                    onConflict: 'id',
                });

            toast({
                title: "Account created!",
                description: "You can now sign in with your new account.",
            });

            // Clear the form
            setEmail('');
            setPassword('');
            setUsername('');
            setFirstName('');
            setLastName('');

        } catch (error: any) {
            console.error('Signup error:', error);
            toast({
                title: "Error creating account",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // ----- SIGN IN function ----- //
    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            
            // This will be handled by the auth state listener in useEffect
            // which will automatically redirect to /dashboard on successful auth
            
            toast({
                title: "Welcome back!",
                description: "You are now logged in.",
            });
        } catch (error: any) {
            toast({
                title: "Error signing in",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-secondary/5">
                    <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 dark:opacity-[0.05]"></div>
                </div>
                <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/30 to-secondary/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-accent/20 to-primary/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-secondary/20 to-accent/20 rounded-full blur-2xl opacity-50 animate-pulse animation-delay-4000"></div>
            </div>

            <div className="w-full max-w-md px-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center mb-8"
                >
                    <Link to="/" className="flex items-center justify-center gap-3 group">
                        <motion.div 
                            className="bg-gradient-to-r from-blue-600 to-teal-500 p-3 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300"
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Users className="h-8 w-8 text-white" />
                        </motion.div>
                        <motion.span 
                            className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-teal-500 to-orange-500 bg-clip-text text-transparent"
                            whileHover={{ scale: 1.02 }}
                        >
                            StudySync
                        </motion.span>
                    </Link>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="text-muted-foreground mt-2 text-center"
                    >
                        Study Smarter, Together
                    </motion.p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="relative"
                >
                    {/* Glow effect behind card */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-teal-500/20 rounded-3xl blur-xl opacity-50"></div>
                    
                    <Card className="relative bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border border-primary/20 shadow-2xl">
                        <CardHeader className="text-center pb-6">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                key={activeTab}
                            >
                                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                                    {activeTab === "signin" ? "Welcome Back" : "Join StudySync"}
                                </CardTitle>
                                <CardDescription className="text-muted-foreground mt-2">
                                    {activeTab === "signin" 
                                        ? "Sign in to continue your learning journey" 
                                        : "Create your account and start studying smarter"
                                    }
                                </CardDescription>
                            </motion.div>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="signin" value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl backdrop-blur-sm border border-primary/10 p-0 h-12">
                                    <TabsTrigger 
                                        value="signin" 
                                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 font-medium h-full rounded-l-xl rounded-r-none data-[state=inactive]:bg-transparent"
                                    >
                                        Sign In
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="signup" 
                                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 font-medium h-full rounded-r-xl rounded-l-none data-[state=inactive]:bg-transparent"
                                    >
                                        Sign Up
                                    </TabsTrigger>
                                </TabsList>

                            <TabsContent value="signin" className="mt-6">
                                    <motion.form 
                                        onSubmit={handleSignIn} 
                                        className="space-y-5"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <motion.div 
                                            className="space-y-2"
                                            whileHover={{ scale: 1.02 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Label htmlFor="signin-email" className="text-sm font-medium flex items-center gap-2">
                                                <Mail className="h-4 w-4" />
                                                Email Address
                                            </Label>
                                            <Input
                                                id="signin-email"
                                                type="email"
                                                placeholder="you@university.edu"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="border-primary/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                                            />
                                        </motion.div>
                                        <motion.div 
                                            className="space-y-2"
                                            whileHover={{ scale: 1.02 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Label htmlFor="signin-password" className="text-sm font-medium flex items-center gap-2">
                                                <Lock className="h-4 w-4" />
                                                Password
                                            </Label>
                                            <Input
                                                id="signin-password"
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="border-primary/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                                            />
                                        </motion.div>
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Button
                                                type="submit"
                                                className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Signing in...
                                                    </>
                                                ) : (
                                                    <>
                                                        Sign In
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                    </>
                                                )}
                                            </Button>
                                        </motion.div>
                                    </motion.form>
                                </TabsContent>

                            <TabsContent value="signup" className="mt-6">
                                    <motion.form 
                                        onSubmit={handleSignUp} 
                                        className="space-y-5"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="grid grid-cols-2 gap-4">
                                            <motion.div 
                                                className="space-y-2"
                                                whileHover={{ scale: 1.02 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <Label htmlFor="signup-firstname" className="text-sm font-medium flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    First Name
                                                </Label>
                                                <Input
                                                    id="signup-firstname"
                                                    type="text"
                                                    placeholder="John"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    required
                                                    className="border-primary/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                                                />
                                            </motion.div>
                                            <motion.div 
                                                className="space-y-2"
                                                whileHover={{ scale: 1.02 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <Label htmlFor="signup-lastname" className="text-sm font-medium flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    Last Name
                                                </Label>
                                                <Input
                                                    id="signup-lastname"
                                                    type="text"
                                                    placeholder="Doe"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    required
                                                    className="border-primary/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                                                />
                                            </motion.div>
                                        </div>
                                        <motion.div 
                                            className="space-y-2"
                                            whileHover={{ scale: 1.02 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Label htmlFor="signup-name" className="text-sm font-medium flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Username
                                            </Label>
                                            <Input
                                                id="signup-name"
                                                type="text"
                                                placeholder="johndoe"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                required
                                                className="border-primary/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                                            />
                                        </motion.div>
                                        <motion.div 
                                            className="space-y-2"
                                            whileHover={{ scale: 1.02 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Label htmlFor="signup-email" className="text-sm font-medium flex items-center gap-2">
                                                <Mail className="h-4 w-4" />
                                                Email Address
                                            </Label>
                                            <Input
                                                id="signup-email"
                                                type="email"
                                                placeholder="you@university.edu"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="border-primary/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                                            />
                                        </motion.div>
                                        <motion.div 
                                            className="space-y-2"
                                            whileHover={{ scale: 1.02 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Label htmlFor="signup-password" className="text-sm font-medium flex items-center gap-2">
                                                <Lock className="h-4 w-4" />
                                                Password
                                            </Label>
                                            <Input
                                                id="signup-password"
                                                type="password"
                                                placeholder="Min. 6 characters"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                minLength={6}
                                                className="border-primary/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                                            />
                                        </motion.div>
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Button
                                                type="submit"
                                                className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Creating account...
                                                    </>
                                                ) : (
                                                    <>
                                                        Create Account
                                                        <Zap className="ml-2 h-4 w-4" />
                                                    </>
                                                )}
                                            </Button>
                                        </motion.div>
                                    </motion.form>
                                </TabsContent>
                        </Tabs>
                            
                            {/* Feature highlights */}
                            <motion.div 
                                className="mt-8 pt-6 border-t border-primary/10"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                            >
                                <div className="flex justify-center space-x-6 text-xs text-muted-foreground">
                                    <motion.div 
                                        className="flex items-center gap-1"
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <BookOpen className="h-3 w-3" />
                                        <span>Study Groups</span>
                                    </motion.div>
                                    <motion.div 
                                        className="flex items-center gap-1"
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Brain className="h-3 w-3" />
                                        <span>Smart Tools</span>
                                    </motion.div>
                                    <motion.div 
                                        className="flex items-center gap-1"
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Zap className="h-3 w-3" />
                                        <span>Fast & Easy</span>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default Auth;