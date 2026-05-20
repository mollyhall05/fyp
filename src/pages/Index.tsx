import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, MessageSquare, BookOpen, Brain, Clock, Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/styles/animations";

const Index = () => {
    const heroFeatures = [
        {
            icon: <BookOpen className="h-6 w-6" />,
            title: "Smart Study Groups",
            description: "Find or create study groups by course or topic",
            gradient: "from-blue-600 to-blue-500"
        },
        {
            icon: <Clock className="h-6 w-6" />,
            title: "Flexible Scheduling",
            description: "Find times that work for everyone",
            gradient: "from-emerald-600 to-emerald-500"
        },
        {
            icon: <Brain className="h-6 w-6" />,
            title: "Focused Learning",
            description: "Tools to help you stay on track",
            gradient: "from-amber-600 to-amber-500"
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-transparent via-primary/20 to-secondary/50 font-body pt-8">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-24 pb-24 px-4 overflow-hidden">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 dark:opacity-[0.05]"></div>
                </div>
                
                <div className="container mx-auto max-w-6xl">
                    <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="grid lg:grid-cols-2 gap-12 items-center"
                    >
                        <motion.div variants={fadeInUp}>
                            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600/20 to-emerald-600/20 border border-primary/30 px-4 py-2 text-base font-semibold text-primary mb-6 shadow-lg backdrop-blur-sm">
                                <Zap className="w-4 h-4 mr-2" />
                                Study Smarter, Together
                            </span>
                            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mb-6 leading-tight font-display">
                                <span className="text-foreground drop-shadow-sm">
                                    Elevate Your Study Game
                                </span>
                            </h1>
                            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl">
                                Connect with classmates, organize study sessions, and achieve academic success together. 
                                StudySync makes collaborative learning effortless, engaging, and effective.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Button asChild size="lg" className="text-lg px-8 group bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 border-0 text-primary-foreground">
                                    <Link to="/auth">
                                        Get Started for Free
                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </Button>
                            </div>
                        </motion.div>
                        <motion.div 
                            variants={fadeInUp}
                            className="relative hidden lg:block"
                        >
                            <div className="absolute -top-12 -right-12 w-64 h-64 bg-gradient-to-br from-blue-600/40 to-emerald-600/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
                            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-gradient-to-br from-emerald-500/30 to-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-blue-500/20 to-emerald-500/20 rounded-full mix-blend-multiply filter blur-2xl opacity-50"></div>
                            <div className="relative bg-gradient-to-br from-card/80 to-card/60 p-8 rounded-2xl shadow-2xl border border-primary/20 backdrop-blur-md">
                                <div className="space-y-6">
                                    {heroFeatures.map((feature, index) => (
                                        <div key={index} className="flex items-start space-x-4">
                                            <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} text-primary-foreground shadow-lg`}>
                                                {feature.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">{feature.title}</h3>
                                                <p className="text-base text-muted-foreground">{feature.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Divider Element */}
            <div className="relative h-8 bg-gradient-to-b from-transparent to-muted/10">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                </div>
            </div>

            {/* Features Section */}
            <section className="py-16 px-4 bg-gradient-to-b from-muted/10 via-muted/20 to-muted/30">
                <div className="container mx-auto max-w-6xl">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">
                            <span className="text-foreground">
                                Everything You Need for Academic Success
                            </span>
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
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
                                gradient: "from-blue-600 to-blue-500"
                            },
                            {
                                icon: <Calendar className="h-6 w-6" />,
                                title: "Session Scheduling",
                                description: "Coordinate study sessions with ease. Schedule both in-person and online meetings that work for everyone.",
                                gradient: "from-emerald-600 to-emerald-500"
                            },
                            {
                                icon: <MessageSquare className="h-6 w-6" />,
                                title: "Group Chat",
                                description: "Stay connected with real-time messaging. Share resources, ask questions, and collaborate seamlessly.",
                                gradient: "from-amber-600 to-amber-500"
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
                                        <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} w-fit mb-4 text-primary-foreground shadow-lg`}>
                                            {feature.icon}
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                                            {feature.title}
                                        </h3>
                                        <p className="text-muted-foreground text-lg">
                                            {feature.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Divider Element */}
            <div className="relative h-12 bg-gradient-to-b from-muted/30 to-muted/40">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                </div>
            </div>

            {/* Call To Action Section */}
            <section className="py-24 px-4 bg-gradient-to-b from-muted/40 via-muted/50 to-muted/60 relative overflow-hidden">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 dark:opacity-[0.05]"></div>
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
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 font-display">
                            <span className="text-foreground">
                                Ready to Transform Your Study Habits?
                            </span>
                        </h2>
                        <div className="flex flex-wrap justify-center gap-6 py-4">
                            <Button asChild size="lg" className="px-12 text-lg h-14 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 border-0 text-primary-foreground">
                                <Link to="/auth">
                                    Get Started
                                </Link>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default Index;
