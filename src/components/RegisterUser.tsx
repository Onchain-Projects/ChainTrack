import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMetaMask } from "@/hooks/useMetaMask";
import { ChainTrackContract } from "@/lib/blockchain";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { normalizeAddress } from "@/lib/ethUtils";

interface RegisterUserProps {
  onUserRegistered?: () => void;
}

export const RegisterUser = ({ onUserRegistered }: RegisterUserProps) => {
  const { signer, isConnected, account } = useMetaMask();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedRole, setSelectedRole] = useState<"manufacturer" | "distributor" | "retailer" | "">("");
  const [verificationResult, setVerificationResult] = useState<{
    isRegistered: boolean;
    role: string | null;
  } | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, wallet_address')
        .in('role', ['manufacturer', 'distributor', 'retailer'])
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleVerifyAddress = async () => {
    if (!walletAddress.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a wallet address",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected || !signer) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const normalizedAddress = normalizeAddress(walletAddress);
      const contract = new ChainTrackContract(signer);

      const [isManufacturer, isDistributor, isRetailer] = await Promise.all([
        contract.isManufacturer(normalizedAddress),
        contract.isDistributor(normalizedAddress),
        contract.isRetailer(normalizedAddress),
      ]);

      let role: string | null = null;
      if (isManufacturer) role = 'manufacturer';
      else if (isDistributor) role = 'distributor';
      else if (isRetailer) role = 'retailer';

      setVerificationResult({
        isRegistered: isManufacturer || isDistributor || isRetailer,
        role,
      });

      if (isManufacturer || isDistributor || isRetailer) {
        toast({
          title: "Already Registered",
          description: `This address is already registered as ${role}`,
        });
      }
    } catch (error) {
      console.error('Error verifying address:', error);
      toast({
        title: "Verification Error",
        description: "Failed to verify wallet address",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRegister = async () => {
    if (!isConnected || !signer || !account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your MetaMask wallet",
        variant: "destructive",
      });
      return;
    }

    if (!walletAddress.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a wallet address",
        variant: "destructive",
      });
      return;
    }

    if (!selectedRole) {
      toast({
        title: "Invalid Input",
        description: "Please select a role",
        variant: "destructive",
      });
      return;
    }

    // Verify current user is a manufacturer
    try {
      const normalizedCurrentAddress = normalizeAddress(account);
      const contract = new ChainTrackContract(signer);
      const isManufacturer = await contract.isManufacturer(normalizedCurrentAddress);

      if (!isManufacturer) {
        toast({
          title: "Unauthorized",
          description: "Only registered manufacturers can register users on the blockchain",
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Failed to verify your manufacturer status",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const normalizedAddress = normalizeAddress(walletAddress);
      const contract = new ChainTrackContract(signer);

      let result;
      if (selectedRole === 'manufacturer') {
        result = await contract.registerManufacturer(normalizedAddress);
      } else if (selectedRole === 'distributor') {
        result = await contract.registerDistributor(normalizedAddress);
      } else if (selectedRole === 'retailer') {
        result = await contract.registerRetailer(normalizedAddress);
      } else {
        throw new Error("Invalid role selected");
      }

      if (result.success) {
        toast({
          title: "Registration Successful",
          description: `User registered as ${selectedRole} on blockchain. TX: ${result.hash.substring(0, 10)}...`,
        });

        // Update user's wallet address in database if they exist
        const matchingUser = users.find(u => 
          u.wallet_address && normalizeAddress(u.wallet_address) === normalizedAddress
        );

        if (matchingUser) {
          // Wallet already linked, no update needed
        } else {
          // Try to find user by role and update wallet
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('role', selectedRole)
            .is('wallet_address', null)
            .limit(1);

          if (userData && userData.length > 0) {
            await supabase
              .from('users')
              .update({ wallet_address: normalizedAddress })
              .eq('id', userData[0].id);
          }
        }

        // Reset form
        setWalletAddress("");
        setSelectedRole("");
        setVerificationResult(null);

        onUserRegistered?.();
      } else {
        throw new Error(result.error || "Registration failed");
      }
    } catch (error) {
      console.error('Error registering user:', error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          <CardTitle>Register User on Blockchain</CardTitle>
        </div>
        <CardDescription>
          Register a wallet address as manufacturer, distributor, or retailer on the blockchain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Connect your MetaMask wallet to register users. Only registered manufacturers can perform this action.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="walletAddress">Wallet Address</Label>
          <div className="flex gap-2">
            <Input
              id="walletAddress"
              value={walletAddress}
              onChange={(e) => {
                setWalletAddress(e.target.value);
                setVerificationResult(null);
              }}
              placeholder="0x..."
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleVerifyAddress}
              disabled={isVerifying || !walletAddress.trim() || !isConnected}
            >
              {isVerifying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Verify"
              )}
            </Button>
          </div>
        </div>

        {verificationResult && (
          <Alert variant={verificationResult.isRegistered ? "default" : "default"}>
            {verificationResult.isRegistered ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  This address is already registered as <strong>{verificationResult.role}</strong> on the blockchain.
                </AlertDescription>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  This address is not registered on the blockchain. You can proceed to register it.
                </AlertDescription>
              </>
            )}
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
            <SelectTrigger id="role">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manufacturer">Manufacturer</SelectItem>
              <SelectItem value="distributor">Distributor</SelectItem>
              <SelectItem value="retailer">Retailer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-2">
          <Button
            onClick={handleRegister}
            disabled={isLoading || !isConnected || !walletAddress.trim() || !selectedRole || verificationResult?.isRegistered}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Register on Blockchain
              </>
            )}
          </Button>
        </div>

        {users.length > 0 && (
          <div className="pt-4 border-t">
            <Label className="text-sm text-muted-foreground mb-2 block">
              Users with wallet addresses:
            </Label>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {users.filter(u => u.wallet_address).map((user) => (
                <div
                  key={user.id}
                  className="p-2 bg-muted rounded text-sm cursor-pointer hover:bg-muted/80"
                  onClick={() => {
                    setWalletAddress(user.wallet_address);
                    setSelectedRole(user.role);
                    setVerificationResult(null);
                  }}
                >
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {user.wallet_address.substring(0, 10)}...{user.wallet_address.substring(38)}
                  </div>
                  <div className="text-xs text-muted-foreground">Role: {user.role}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

