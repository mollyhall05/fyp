import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";

export const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-primary shadow-lg">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="bg-primary/80 p-2 rounded-lg">
                            <Users className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold text-primary-foreground">
              StudySync
            </span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link to="/auth">
                            <Button variant="ghost" className="text-primary-foreground hover:text-primary-foreground hover:bg-white/20 text-base font-medium">Sign In</Button>
                        </Link>
                        <Link to="/auth">
                            <Button className="bg-primary/80 hover:bg-primary/70 text-primary-foreground text-base font-medium">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};