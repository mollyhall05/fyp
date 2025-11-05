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
import { Users } from "lucide-react";
import { Link } from "react-router-dom";

const Auth = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
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
            // 1. First, check if email already exists
            const { data: existingUser } = await supabase
                .from('users')
                .select('email')
                .eq('email', email)
                .maybeSingle();

            if (existingUser) {
                toast({
                    title: "Email already registered",
                    description: "This email is already in use. Please sign in instead.",
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
                        full_name: fullName,
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
                    full_name: fullName.trim(), // Ensure we save the trimmed full name
                    created_at: new Date().toISOString()
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
            setFullName('');

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
            await supabase.auth.signInWithPassword({
                email,
                password,
            });

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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
            <div className="w-full max-w-md">
                <Link to="/" className="flex items-center justify-center gap-2 mb-8">
                    <div className="bg-gradient-primary p-2 rounded-lg">
                        <Users className="h-6 w-6 text-black" />
                    </div>
                    <span className="text-2xl font-bold bg-gradient-primary bg-clip-text">StudySync</span>
                </Link>

                <Card>
                    <CardHeader>
                        <CardTitle>Welcome</CardTitle>
                        <CardDescription>Sign in to your account or create a new one</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="signin" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
                                <TabsTrigger value="signin" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                                    Sign In
                                </TabsTrigger>
                                <TabsTrigger value="signup" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                                    Sign Up
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="signin">
                                <form onSubmit={handleSignIn} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="signin-email">Email</Label>
                                        <Input
                                            id="signin-email"
                                            type="email"
                                            placeholder="you@university.edu"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signin-password">Password</Label>
                                        <Input
                                            id="signin-password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full bg-blue-500 hover:bg-blue-600 text-white hover:text-white"
                                        disabled={loading}
                                    >
                                        {loading ? "Signing in..." : "Sign In"}
                                    </Button>
                                </form>
                            </TabsContent>

                            <TabsContent value="signup">
                                <form onSubmit={handleSignUp} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-name">Full Name</Label>
                                        <Input
                                            id="signup-name"
                                            type="text"
                                            placeholder="John Doe"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-email">Email</Label>
                                        <Input
                                            id="signup-email"
                                            type="email"
                                            placeholder="you@university.edu"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-password">Password</Label>
                                        <Input
                                            id="signup-password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full bg-blue-500 hover:bg-blue-600 text-white hover:text-white"
                                        disabled={loading}
                                    >
                                        {loading ? "Creating account..." : "Sign Up"}
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Auth;