import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Menu, X, LogOut, LayoutDashboard, BarChart3, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMetaMask } from "@/hooks/useMetaMask";
import { useWalletSync } from "@/hooks/useWalletSync";
import { WalletDropdown } from "@/components/WalletDropdown";
import { WalletSelector } from "@/components/WalletSelector";
import { useToast } from "@/hooks/use-toast";
import { POLYGON_AMOY_CHAIN_ID } from "@/lib/blockchain";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  useWalletSync();
  const {
    isConnected,
    account,
    chainId,
    connect,
    switchToPolygonAmoy,
    disconnect,
  } = useMetaMask();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleConnect = async (walletType: string = 'metamask') => {
    if (walletType !== 'metamask') return false;
    
    const success = await connect();
    if (success && chainId !== POLYGON_AMOY_CHAIN_ID) {
      setTimeout(() => handleSwitchNetwork(), 1000);
    }
    return success;
  };

  const handleSwitchNetwork = async () => {
    const success = await switchToPolygonAmoy();
    if (success) {
      toast({
        title: "Network Switched",
        description: "Successfully switched to Polygon Amoy testnet",
      });
    } else {
      toast({
        title: "Network Switch Failed", 
        description: "Please manually switch to Polygon Amoy testnet in MetaMask",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  return (
    <nav className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              ChainTrack
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Verify link - always visible (public feature) */}
            <Link to="/verify" className="text-muted-foreground hover:text-foreground transition-smooth flex items-center gap-2">
              <Search className="h-4 w-4" />
              Verify Product
            </Link>
            
            {user ? (
              <>
                <Link to={`/dashboard/${user.user_metadata?.role || 'consumer'}`} className="text-muted-foreground hover:text-foreground transition-smooth flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link to="/analytics" className="text-muted-foreground hover:text-foreground transition-smooth flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </Link>
              </>
            ) : (
              <>
                <Link to="/features" className="text-muted-foreground hover:text-foreground transition-smooth">
                  Features
                </Link>
                <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-smooth">
                  How it Works
                </Link>
                <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-smooth">
                  Pricing
                </Link>
              </>
            )}
          </div>

          {/* Auth Buttons - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Wallet Connection */}
                {isConnected && account ? (
                  <WalletDropdown
                    account={account}
                    chainId={chainId}
                    onDisconnect={handleDisconnect}
                    onSwitchNetwork={handleSwitchNetwork}
                  />
                ) : (
                  <WalletSelector onConnect={handleConnect} />
                )}
                
                <span className="text-sm text-muted-foreground">
                  Welcome back!
                </span>
                <Button variant="ghost" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button variant="hero" asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu Panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-sm">
            <div className="px-4 py-4 space-y-3">
              {/* Verify link - always visible */}
              <Link 
                to="/verify" 
                className="flex items-center gap-2 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Search className="h-4 w-4" />
                Verify Product
              </Link>
              
              {user ? (
                <>
                  <Link 
                    to={`/dashboard/${user.user_metadata?.role || 'consumer'}`} 
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link 
                    to="/analytics" 
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </Link>
                  
                  {/* Mobile Wallet & Auth Section */}
                  <div className="border-t border-border pt-3 mt-3 space-y-3">
                    {isConnected && account ? (
                      <WalletDropdown
                        account={account}
                        chainId={chainId}
                        onDisconnect={handleDisconnect}
                        onSwitchNetwork={handleSwitchNetwork}
                      />
                    ) : (
                      <WalletSelector onConnect={handleConnect} />
                    )}
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Link 
                    to="/features" 
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Features
                  </Link>
                  <Link 
                    to="/how-it-works" 
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    How it Works
                  </Link>
                  <Link 
                    to="/pricing" 
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  
                  {/* Mobile Auth Buttons */}
                  <div className="border-t border-border pt-3 mt-3 space-y-2">
                    <Button variant="ghost" asChild className="w-full">
                      <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
                    </Button>
                    <Button variant="hero" asChild className="w-full">
                      <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>Get Started</Link>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;