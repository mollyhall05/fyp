import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, MessageSquare, TrendingUp, BookOpen, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";

const Index = () => {
    return (
        <div className="min-h-screen">
            <Navbar />

            {/* Hero Section */}
            <section className="pt-24 pb-16 px-4">
                <div className="container mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                                Transform Your Study Experience
                            </h1>
                            <p className="text-xl text-muted-foreground mb-8">
                                Connect with fellow students, organize study sessions, and achieve academic excellence together.
                                StudySync makes collaborative learning effortless and engaging.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link to="/auth">
                                    <Button size="lg" variant="outline" className="text-lg px-8">
                                        Get Started
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-hero opacity-20 rounded-3xl blur-3xl"></div>
                            <img
                                // src={heroImage}
                                alt="Students collaborating in study group"
                                className="relative rounded-3xl shadow-large w-full"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 px-4 bg-muted/30">
                <div className="container mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Everything You Need for Collaborative Learning
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Powerful features designed specifically for university students
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card className="shadow-soft hover:shadow-medium transition-shadow">
                            <CardContent className="pt-6">
                                <div className="bg-gradient-primary p-3 rounded-lg w-fit mb-4">
                                    <Users className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Study Groups</h3>
                                <p className="text-muted-foreground">
                                    Create or join study groups based on your courses and interests. Connect with peers who share your academic goals.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-soft hover:shadow-medium transition-shadow">
                            <CardContent className="pt-6">
                                <div className="bg-gradient-secondary p-3 rounded-lg w-fit mb-4">
                                    <Calendar className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Session Scheduling</h3>
                                <p className="text-muted-foreground">
                                    Coordinate study sessions with ease. Schedule both in-person and online meetings that work for everyone.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-soft hover:shadow-medium transition-shadow">
                            <CardContent className="pt-6">
                                <div className="bg-accent p-3 rounded-lg w-fit mb-4">
                                    <MessageSquare className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Group Chat</h3>
                                <p className="text-muted-foreground">
                                    Stay connected with real-time messaging. Share resources, ask questions, and collaborate seamlessly.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-soft hover:shadow-medium transition-shadow">
                            <CardContent className="pt-6">
                                <div className="bg-success p-3 rounded-lg w-fit mb-4">
                                    <TrendingUp className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Track Progress</h3>
                                <p className="text-muted-foreground">
                                    Monitor your study sessions and group participation. See your learning journey visualized.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-soft hover:shadow-medium transition-shadow">
                            <CardContent className="pt-6">
                                <div className="bg-gradient-primary p-3 rounded-lg w-fit mb-4">
                                    <BookOpen className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Resource Sharing</h3>
                                <p className="text-muted-foreground">
                                    Share notes, materials, and helpful resources with your study group members instantly.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-soft hover:shadow-medium transition-shadow">
                            <CardContent className="pt-6">
                                <div className="bg-gradient-secondary p-3 rounded-lg w-fit mb-4">
                                    <Target className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Goal Setting</h3>
                                <p className="text-muted-foreground">
                                    Set group goals and individual targets. Stay motivated and accountable together.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>
            
            {/* Footer */}
            <footer className="border-t py-8 px-4">
                <div className="container mx-auto text-center text-muted-foreground">
                    <p>&copy; 2025 StudySync. Built for collaborative learning.</p>
                </div>
            </footer>
        </div>
    );
};

export default Index;
