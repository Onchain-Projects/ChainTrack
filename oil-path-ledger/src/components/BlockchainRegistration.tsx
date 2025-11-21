import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMetaMask } from "@/hooks/useMetaMask";
import { ChainTrackContract } from "@/lib/blockchain";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Shield, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { normalizeAddress } from "@/lib/ethUtils";

interface BlockchainRegistrationProps {
  onRegistrationComplete?: () => void;
}

export const BlockchainRegistration = ({ onRegistrationComplete }: BlockchainRegistrationProps) => {
  const { user } = useAuth();
  const { signer, isConnected, account, connect, switchToPolygonAmoy } = useMetaMask();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [needsRegistration, setNeedsRegistration] = useState(false);

  useEffect(() => {
    checkRegistrationStatus();
  }, [user, isConnected, account]);

  const checkRegistrationStatus = async () => {
    if (!user) {
      setIsChecking(false);
      return;
    }

    try {
      // Get user role from database
      const { data: userData, error } = await supabase
        .from('users')
        .select('role, wallet_address')
        .eq('id', user.id)
        .single();

      if (error || !userData) {
        setIsChecking(false);
        return;
      }

      setUserRole(userData.role);

      // Skip check for consumers (they don't need blockchain registration)
      if (userData.role === 'consumer') {
        setIsRegistered(true);
        setIsChecking(false);
        return;
      }

      // If wallet is connected, check on-chain status
      if (isConnected && account) {
        const normalizedAddress = normalizeAddress(account);
        const contract = new ChainTrackContract(signer!);
        
        let registered = false;
        if (userData.role === 'manufacturer') {
          registered = await contract.isManufacturer(normalizedAddress);
        } else if (userData.role === 'distributor') {
          registered = await contract.isDistributor(normalizedAddress);
        } else if (userData.role === 'retailer') {
          registered = await contract.isRetailer(normalizedAddress);
        }

        setIsRegistered(registered);
        setNeedsRegistration(!registered && userData.role !== 'consumer');
      } else {
        // Wallet not connected, but user has a role that needs registration
        setNeedsRegistration(userData.role !== 'consumer');
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleConnectAndRegister = async () => {
    if (!isConnected) {
      const connected = await connect();
      if (!connected) {
        return;
      }
    }

    // Switch to Polygon Amoy if needed
    await switchToPolygonAmoy();

    // Wait a bit for network switch
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Re-check registration status after connection
    await checkRegistrationStatus();
  };

  const handleRegister = async () => {
    if (!isConnected || !signer || !account || !user || !userRole) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (userRole === 'consumer') {
      return; // Consumers don't need blockchain registration
    }

    setIsRegistering(true);

    try {
      const normalizedAddress = normalizeAddress(account);
      const contract = new ChainTrackContract(signer);

      // Get a manufacturer to register this user
      // First, try to find an existing manufacturer
      const { data: manufacturers } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('role', 'manufacturer')
        .not('wallet_address', 'is', null)
        .limit(1);

      if (!manufacturers || manufacturers.length === 0) {
        throw new Error("No manufacturer found to register you. Please contact an administrator.");
      }

      const manufacturerWallet = manufacturers[0].wallet_address;
      
      // Check if the manufacturer is registered on blockchain
      const manufacturerContract = new ChainTrackContract(signer);
      const isManufacturerRegistered = await manufacturerContract.isManufacturer(
        normalizeAddress(manufacturerWallet)
      );

      if (!isManufacturerRegistered) {
        throw new Error("Manufacturer is not registered on blockchain. Please contact an administrator.");
      }

      // For now, we'll need the user to have a manufacturer register them
      // In a production system, you might want to have an admin panel
      toast({
        title: "Registration Required",
        description: `Please ask a registered manufacturer to register your wallet address (${normalizedAddress}) on the blockchain.`,
        variant: "default",
      });

      // Alternative: If the user is the first manufacturer (deployer), they're already registered
      // We can check if they're the deployer or if there's a way to auto-register
      
    } catch (error) {
      console.error('Error during registration:', error);
      toast({
        title: "Registration Error",
        description: error instanceof Error ? error.message : "Failed to register on blockchain",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  if (isChecking) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Checking registration status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isRegistered) {
    return (
      <Card className="border-success">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <CardTitle>Blockchain Registration Complete</CardTitle>
          </div>
          <CardDescription>
            Your wallet is registered on the blockchain for role: {userRole}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>You can now perform blockchain operations</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!needsRegistration) {
    return null; // Consumer or already registered
  }

  return (
    <Card className="border-warning">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-warning" />
          <CardTitle>Blockchain Registration Required</CardTitle>
        </div>
        <CardDescription>
          You need to register your wallet on the blockchain to perform {userRole} operations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <Alert>
            <AlertDescription>
              Connect your MetaMask wallet to register on the blockchain.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertDescription>
              Your wallet is connected but not registered on the blockchain. 
              A registered manufacturer needs to register your address.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          {!isConnected ? (
            <Button onClick={handleConnectAndRegister} className="w-full">
              <Shield className="h-4 w-4 mr-2" />
              Connect Wallet & Check Status
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-1">Your Wallet Address:</div>
                <code className="text-xs break-all">{account}</code>
              </div>
              <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  To complete registration, ask a registered manufacturer to register your wallet address on the blockchain.
                  You can also use the "Register User" feature in the manufacturer dashboard if you have access.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

