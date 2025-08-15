import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Trophy,
  Target,
  Users,
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
  Activity,
  Clock
} from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { GroupSwitcherModal } from "@/components/GroupSwitcherModal";
import { Player, Tournament, MMRMatch, Group } from "@/types/tournament";
import { useAuth } from "@/contexts/AuthContext";

interface AppLayoutProps {
  currentGroup: Group | null;
  players: Player[];
  currentTournament?: Tournament | null;
  mmrMatches: MMRMatch[];
  children: React.ReactNode;
  sidebarContent?: React.ReactNode;
}

export const AppLayout = ({
  currentGroup,
  players,
  currentTournament,
  mmrMatches,
  children,
  sidebarContent
}: AppLayoutProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


  const getActivitySummary = () => {
    const recentMatches = mmrMatches.slice(-3);
    const activeTournamentStatus = currentTournament?.status === 'active';

    return {
      recentMatches,
      activeTournamentStatus,
      totalPlayers: players.length,
      totalMatches: mmrMatches.length
    };
  };

  const activity = getActivitySummary();

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-gray to-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Brand + Mobile Menu */}
            <div className="flex items-center gap-4">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    {sidebarContent}
                  </div>
                </SheetContent>
              </Sheet>

              <Link to="/" className="items-center gap-3 hidden sm:flex">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-ping-pong to-victory-gold flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-ping-pong to-victory-gold bg-clip-text text-transparent">
                  TTTracker
                </h1>
              </Link>
            </div>

            {/* Center: Group + Mode Navigation */}
            <div className="flex items-center gap-6">
              <GroupSwitcherModal
                trigger={
                  <Button variant="ghost" className="flex items-center gap-2 px-3 py-1.5">
                    <Users className="w-4 h-4 text-ping-pong" />
                    <span className="text-sm font-medium">{currentGroup?.name || 'Select Group'}</span>
                    {currentGroup && (
                      <Badge variant="secondary" className="text-xs">
                        {players.length}
                      </Badge>
                    )}
                  </Button>
                }
              />

              {currentGroup && (
                <div className="flex items-center gap-2">
                  <Link
                    to="/mmr"
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${location.pathname === '/mmr' || location.pathname === '/'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                  >
                    <Target className="w-4 h-4" />
                    <span className="hidden sm:inline">MMR</span>
                  </Link>
                  <Link
                    to="/tournament"
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${location.pathname === '/tournament'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                  >
                    <Trophy className="w-4 h-4" />
                    <span className="hidden sm:inline">Tournament</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Right: User + Settings */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <UserAvatar size="sm" />
                <span className="text-sm text-muted-foreground hidden md:inline">
                  {user && !user.isAnonymous ? user.displayName || user.email : 'Anonymous'}
                </span>
              </div>
              <Link to="/settings">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Sidebar - Hidden on mobile, collapsible on desktop */}
        {currentGroup && (
          <aside className={`hidden lg:flex flex-col border-r bg-background/50 transition-all duration-300 ${sidebarCollapsed ? 'w-12' : 'w-80'
            }`}>
            {/* Sidebar Header */}
            <div className="p-4 border-b flex items-center justify-between">
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-ping-pong" />
                  <h2 className="font-semibold">Players & Actions</h2>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5"
              >
                {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto">
              {!sidebarCollapsed && sidebarContent}
            </div>

          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container max-w-6xl mx-auto p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Status Bar */}
      {currentGroup && (
        <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Activity className="w-4 h-4" />
                  <span>Activity</span>
                </div>

                {activity.activeTournamentStatus && (
                  <Badge variant="default" className="bg-table-green">
                    Tournament Active
                  </Badge>
                )}

                <span className="text-muted-foreground">
                  {activity.totalMatches} matches played
                </span>
              </div>

              <div className="flex items-center gap-4">
                {activity.recentMatches.length > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                      Last match: {activity.recentMatches[0].winner.name} won
                    </span>
                  </div>
                )}

                <div className="text-muted-foreground">
                  {activity.totalPlayers} players registered
                </div>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};