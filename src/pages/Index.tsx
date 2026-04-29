import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, MessageSquare, BookOpen, Brain, Clock, Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";

// Import shared styles and animations
import { fadeInUp, staggerContainer, itemFadeIn } from "@/styles/animations";

const Index = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-28 pb-32 px-4 overflow-hidden">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 dark:opacity-[0.05]"></div>
                    <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-teal-600/30 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-teal-500/20 to-purple-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
                </div>
                
                <div className="container mx-auto max-w-6xl">
                    <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="grid lg:grid-cols-2 gap-12 items-center"
                    >
                        <motion.div variants={fadeInUp}>
                            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-teal-600/20 to-purple-600/20 border border-teal-600/30 px-4 py-2 text-sm font-semibold text-teal-700 mb-6 shadow-lg backdrop-blur-sm">
                                <Zap className="w-4 h-4 mr-2" />
                                Study Smarter, Together
                            </span>
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
                                <span className="text-foreground drop-shadow-sm">
                                    Elevate Your Study Game
                                </span>
                            </h1>
                            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
                                Connect with classmates, organize study sessions, and achieve academic success together. 
                                StudySync makes collaborative learning effortless, engaging, and effective.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link to="/auth">
                                    <Button size="lg" className="text-lg px-8 group bg-teal-700 hover:bg-teal-600 shadow-lg hover:shadow-xl transition-all duration-300 border-0 text-white">
                                        Get Started for Free
                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>
                        <motion.div 
                            variants={fadeInUp}
                            className="relative hidden lg:block"
                        >
                            <div className="absolute -top-12 -right-12 w-64 h-64 bg-gradient-to-br from-teal-600/40 to-purple-600/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-gradient-to-br from-purple-500/30 to-teal-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-teal-500/20 to-purple-500/20 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob animation-delay-4000"></div>
                            <div className="relative bg-gradient-to-br from-card/80 to-card/60 p-8 rounded-2xl shadow-2xl border border-primary/20 backdrop-blur-md">
                                <div className="space-y-6">
                                    <div className="flex items-start space-x-4">
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-teal-600 to-teal-500 text-white shadow-lg">
                                            <BookOpen className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">Smart Study Groups</h3>
                                            <p className="text-sm text-muted-foreground">Find or create study groups by course or topic</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4">
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-purple-500 text-white shadow-lg">
                                            <Clock className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">Flexible Scheduling</h3>
                                            <p className="text-sm text-muted-foreground">Find times that work for everyone</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4">
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
                                            <Brain className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">Focused Learning</h3>
                                            <p className="text-sm text-muted-foreground">Tools to help you stay on track</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Connecting Element */}
            <div className="relative h-20 bg-gradient-to-b from-transparent to-muted/10">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-1 bg-gradient-to-r from-transparent via-teal-600/30 to-transparent"></div>
                </div>
            </div>

            {/* Features Section */}
            <section className="py-20 px-4 bg-gradient-to-b from-muted/10 via-muted/20 to-muted/30">
                <div className="container mx-auto max-w-6xl">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            <span className="text-foreground">
                                Everything You Need for Academic Success
                            </span>
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Powerful features designed to make studying more effective and collaborative
                        </p>
                    </motion.div>

                    <motion.div 
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {[
                            {
                                icon: <Users className="h-6 w-6" />,
                                title: "Study Groups",
                                description: "Create or join study groups based on your courses and interests. Connect with peers who share your academic goals.",
                                gradient: "from-teal-600 to-teal-500"
                            },
                            {
                                icon: <Calendar className="h-6 w-6" />,
                                title: "Session Scheduling",
                                description: "Coordinate study sessions with ease. Schedule both in-person and online meetings that work for everyone.",
                                gradient: "from-purple-600 to-purple-500"
                            },
                            {
                                icon: <MessageSquare className="h-6 w-6" />,
                                title: "Group Chat",
                                description: "Stay connected with real-time messaging. Share resources, ask questions, and collaborate seamlessly.",
                                gradient: "from-purple-500 to-pink-500"
                            },
                            {
                                icon: <BookOpen className="h-6 w-6" />,
                                title: "Resource Sharing",
                                description: "Easily share notes, documents, and study materials with your group members in one place.",
                                gradient: "from-teal-600/80 to-teal-500/60"
                            },
                            {
                                icon: <Clock className="h-6 w-6" />,
                                title: "Study Analytics",
                                description: "Track your study habits and progress with detailed analytics and insights.",
                                gradient: "from-purple-600/80 to-purple-500/60"
                            },
                            {
                                icon: <Brain className="h-6 w-6" />,
                                title: "Focus Tools",
                                description: "Built-in Pomodoro timer and focus sessions to help you stay productive.",
                                gradient: "from-purple-500/80 to-pink-500/60"
                            }
                        ].map((feature, index) => (
                            <motion.div 
                                key={index} 
                                variants={fadeInUp}
                                whileHover={{ y: -5 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="h-full bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-md border border-primary/20 hover:border-primary/40 transition-all duration-300 group hover:shadow-xl hover:-translate-y-1">
                                    <CardContent className="p-6">
                                        <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} w-fit mb-4 text-white shadow-lg`}>
                                            {feature.icon}
                                        </div>
                                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                                            {feature.title}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {feature.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Connecting Element */}
            <div className="relative h-20 bg-gradient-to-b from-muted/30 to-muted/40">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-1 bg-gradient-to-r from-transparent via-purple-600/30 to-transparent"></div>
                </div>
            </div>

            {/* CTA Section */}
            <section className="py-24 px-4 bg-gradient-to-b from-muted/40 via-muted/50 to-muted/60 relative overflow-hidden">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-teal-600/30 to-transparent rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-purple-600/30 to-transparent rounded-full blur-3xl"></div>
                </div>
                <div className="container mx-auto max-w-4xl text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            <span className="text-foreground">
                                Ready to Transform Your Study Habits?
                            </span>
                        </h2>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link to="/auth">
                                <Button size="lg" className="px-8 text-base h-12 bg-gradient-to-r from-green-700 to-green-800 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 border-0">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default Index;
