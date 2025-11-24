import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { WalletConnection } from "@/components/WalletConnection";
import { CreateBatchForm } from "@/components/CreateBatchForm";
import { MovementForm } from "@/components/MovementForm";
import { BlockchainRegistration } from "@/components/BlockchainRegistration";
import { RegisterUser } from "@/components/RegisterUser";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWalletSync } from "@/hooks/useWalletSync";
import { getPolygonscanUrl } from "@/lib/blockchain";
import { 
  Factory, 
  Truck, 
  Store, 
  User, 
  Plus, 
  Package, 
  Shield,
  BarChart3,
  Clock,
  CheckCircle,
  ExternalLink,
  Wallet,
  LineChart,
  ChevronDown,
  Settings,
  Activity
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  useWalletSync(); // Sync wallet address
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState({
    totalBatches: 0,
    activeShipments: 0,
    completedToday: 0,
    blockchainEntries: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBlockchainStatus, setShowBlockchainStatus] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  const roleConfig = {
    manufacturer: {
      title: "Manufacturer Dashboard",
      icon: <Factory className="h-6 w-6" />,
      color: "bg-primary",
      actions: [
        { label: "Create New Batch", icon: Plus, variant: "hero" as const },
        { label: "View All Batches", icon: Package, variant: "outline" as const }
      ]
    },
    distributor: {
      title: "Distributor Dashboard", 
      icon: <Truck className="h-6 w-6" />,
      color: "bg-secondary",
      actions: [
        { label: "Process Shipment", icon: Plus, variant: "hero" as const },
        { label: "Inventory Status", icon: Package, variant: "outline" as const }
      ]
    },
    retailer: {
      title: "Retailer Dashboard",
      icon: <Store className="h-6 w-6" />,
      color: "bg-warning", 
      actions: [
        { label: "Record Sale", icon: Plus, variant: "hero" as const },
        { label: "Stock Levels", icon: Package, variant: "outline" as const }
      ]
    },
    consumer: {
      title: "Consumer Portal",
      icon: <User className="h-6 w-6" />,
      color: "bg-success",
      actions: [
        { label: "Verify Product", icon: Shield, variant: "hero" as const },
        { label: "View History", icon: Clock, variant: "outline" as const }
      ]
    }
  };

  const config = roleConfig[role as keyof typeof roleConfig];

  useEffect(() => {
    if (!user) return;
    
    const fetchDashboardData = async () => {
      try {
        // Fetch batches data
        const { data: batches } = await supabase
          .from('batches')
          .select('id, created_at, blockchain_hash');

        // Fetch movements data
        const { data: movements } = await supabase
          .from('movements')
          .select('id, created_at, blockchain_hash, status')
          .order('created_at', { ascending: false })
          .limit(10);

        const today = new Date().toDateString();
        const completedToday = movements?.filter(m => 
          new Date(m.created_at).toDateString() === today
        ).length || 0;

        const activeShipments = movements?.filter(m => 
          m.status === 'created' || m.status === 'in_transit'
        ).length || 0;

        const blockchainEntries = batches?.filter(b => b.blockchain_hash).length || 0;

        setDashboardData({
          totalBatches: batches?.length || 0,
          activeShipments,
          completedToday,
          blockchainEntries
        });

        setRecentActivity(movements || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (!config) {
    return <div>Role not found</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Global Navbar */}
      <Navbar />
      
      {/* Dashboard Header */}
      <div className="bg-background/95 backdrop-blur-sm border-b sticky top-16 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className={`${config.color} text-white p-3 rounded-xl shadow-lg`}>
                {config.icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{config.title}</h1>
                <p className="text-muted-foreground mt-1">Manage your supply chain operations</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Compact Wallet & Blockchain Status */}
              <div className="flex items-center gap-2">
                <WalletConnection className="hidden md:block" />
                <Popover open={showBlockchainStatus} onOpenChange={setShowBlockchainStatus}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative">
                      <Shield className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96" align="end">
                    <BlockchainRegistration />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Main Action Buttons */}
              <div className="flex gap-3">
                {config.actions.map((action, index) => {
                  const handleClick = () => {
                    if (role === 'manufacturer') {
                      if (action.label === 'Create New Batch') {
                        setActiveDialog('createBatch');
                        setShowCreateBatch(true);
                      } else if (action.label === 'View All Batches') {
                        navigate('/batches');
                        return;
                      }
                    } else if ((role === 'distributor' || role === 'retailer') && (action.label.includes('Process') || action.label.includes('Record'))) {
                      setActiveDialog('movement');
                      setShowMovementForm(true);
                    }
                  };

                  return (
                    <Button 
                      key={index} 
                      variant={action.variant} 
                      onClick={handleClick}
                      size="lg"
                      className="shadow-md hover:shadow-lg transition-all"
                    >
                      <action.icon className="h-4 w-4 mr-2" />
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            </div>
            
            {/* Single Dialog for all actions */}
            <Dialog open={showCreateBatch || showMovementForm} onOpenChange={(open) => {
              if (!open) {
                setShowCreateBatch(false);
                setShowMovementForm(false);
                setActiveDialog(null);
              }
            }}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0 gap-0 flex flex-col">
                <div className="flex-shrink-0 bg-background border-b px-6 py-4">
                  <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                    {activeDialog === 'createBatch' ? (
                      <>
                        <Package className="h-6 w-6 text-primary" />
                        Create New Batch
                      </>
                    ) : (
                      <>
                        <Truck className="h-6 w-6 text-primary" />
                        Record Movement
                      </>
                    )}
                  </DialogTitle>
                  <DialogDescription className="mt-2 text-muted-foreground">
                    {activeDialog === 'createBatch' 
                      ? 'Create a new product batch with QR codes and blockchain registration.'
                      : 'Record the movement of a batch from one party to another in the supply chain.'}
                  </DialogDescription>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0 pb-24">
                  {activeDialog === 'createBatch' && (
                    <CreateBatchForm 
                      onBatchCreated={() => { setShowCreateBatch(false); setActiveDialog(null); }} 
                      hideTitle={true}
                    />
                  )}
                  {activeDialog === 'movement' && (
                    <MovementForm onMovementCreated={() => { setShowMovementForm(false); setActiveDialog(null); }} hideTitle={true} />
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Quick Access Links */}
          <div className="mt-6 flex gap-3 flex-wrap">
            <Link to="/analytics">
              <Button variant="outline" size="sm" className="gap-2">
                <LineChart className="h-4 w-4" />
                Analytics
              </Button>
            </Link>
            {role === 'manufacturer' && (
              <>
                <Link to="/batches">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Package className="h-4 w-4" />
                    All Batches
                  </Button>
                </Link>
                <Collapsible open={showAdminPanel} onOpenChange={setShowAdminPanel}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Settings className="h-4 w-4" />
                      Admin
                      <ChevronDown className={`h-3 w-3 transition-transform ${showAdminPanel ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Wallet Connection */}
        <div className="md:hidden mb-6">
          <WalletConnection />
        </div>

        {/* Admin Panel (Collapsible) */}
        {role === 'manufacturer' && showAdminPanel && (
          <div className="mb-6">
            <Card className="border-2">
              <RegisterUser onUserRegistered={() => window.location.reload()} />
            </Card>
          </div>
        )}
        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-primary/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium mb-1">Total Batches</p>
                <p className="text-3xl font-bold text-foreground">{dashboardData.totalBatches.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-secondary/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium mb-1">Active Shipments</p>
                <p className="text-3xl font-bold text-foreground">{dashboardData.activeShipments}</p>
              </div>
              <div className="p-3 bg-secondary/10 rounded-lg">
                <Truck className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-green-500/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium mb-1">Completed Today</p>
                <p className="text-3xl font-bold text-foreground">{dashboardData.completedToday}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-blue-500/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium mb-1">Verified Entries</p>
                <p className="text-3xl font-bold text-foreground">{dashboardData.blockchainEntries.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          <Card className="p-6 border-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Recent Activity</h2>
                  <p className="text-sm text-muted-foreground">Latest movements and transactions</p>
                </div>
              </div>
              <Link to="/analytics">
                <Button variant="outline" size="sm" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  View Analytics
                </Button>
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 border-2 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        item.blockchain_hash ? 'bg-green-500' : 'bg-amber-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            Movement {item.status}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {item.id.substring(0, 8)}...
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Badge 
                        variant={item.blockchain_hash ? 'default' : 'secondary'}
                        className="gap-1"
                      >
                        {item.blockchain_hash ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            <span>Verified</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" />
                            <span>Pending</span>
                          </>
                        )}
                      </Badge>
                      {item.blockchain_hash && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => window.open(getPolygonscanUrl(item.blockchain_hash), '_blank')}
                          title="View on blockchain"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="p-4 bg-muted rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Package className="h-8 w-8 opacity-50" />
                  </div>
                  <p className="font-medium">No recent activity</p>
                  <p className="text-sm mt-1">Your activity will appear here</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;