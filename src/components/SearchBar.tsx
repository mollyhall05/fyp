import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  searchResults?: any[];
  userGroups?: any[];
  onGroupClick?: (group: any) => void;
}

export const SearchBar = ({ 
  onSearch, 
  placeholder = "Search groups, sessions, or people...",
  searchResults = [],
  userGroups = [],
  onGroupClick
}: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onSearch(newQuery);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  // Check if user is a member of a group
  const isUserMember = (groupId: string) => {
    return userGroups.some(group => group.id === groupId);
  };

  // Update dropdown position when query changes
  useEffect(() => {
    if (query && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [query]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl relative z-[99998]"
    >
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative flex items-center">
          <div className="absolute left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <Input
            ref={inputRef}
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="pl-10 pr-20 h-12 bg-card/50 backdrop-blur-sm border-border/20 focus:border-primary/50 transition-all duration-300 text-base"
          />
          
          <div className="absolute right-2 flex items-center gap-1">
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 w-8 p-0 hover:bg-muted/50"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
              </form>
    
    {/* Portal-based dropdown */}
    {query && createPortal(
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bg-card/95 backdrop-blur-md border border-border/20 rounded-lg shadow-lg z-[999999]"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`
        }}
      >
        <div className="p-4 max-h-96 overflow-y-auto">
          <p className="text-sm text-muted-foreground mb-3">
            Search results for "{query}"
          </p>
          
          {searchResults.length === 0 ? (
            <div className="text-center py-8">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No groups found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching with different keywords
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors duration-200 border border-transparent hover:border-border/20"
                  onClick={() => {
                    // Handle group selection - navigate to group details
                    if (onGroupClick) {
                      onGroupClick(group);
                    }
                    setQuery("");
                  }}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-semibold">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{group.name}</h4>
                    {group.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        {group.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {group.member_count || 0} members
                      </Badge>
                      {isUserMember(group.id) ? (
                        <Badge variant="default" className="text-xs bg-teal-600 text-white">
                          Member
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Join
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {searchResults.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/20">
              <p className="text-xs text-muted-foreground">
                {searchResults.length} group{searchResults.length !== 1 ? 's' : ''} found
              </p>
            </div>
          )}
        </div>
      </motion.div>,
      document.body
    )}
    </motion.div>
  );
};
