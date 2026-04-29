import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";

export const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-teal-700 shadow-lg">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="bg-teal-600 p-2 rounded-lg">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">
              StudySync
            </span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link to="/auth">
                            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/20">Sign In</Button>
                        </Link>
                        <Link to="/auth">
                            <Button className="bg-teal-600 hover:bg-teal-500 text-white">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};