import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMetaMask } from "@/hooks/useMetaMask";
import { AlertCircle } from "lucide-react";
import { POLYGON_AMOY_CHAIN_ID } from "@/lib/blockchain";
import { useWalletSync } from "@/hooks/useWalletSync";
import { WalletSelector } from "./WalletSelector";
import { WalletDropdown } from "./WalletDropdown";
import { NetworkBanner } from "./NetworkBanner";

interface WalletConnectionProps {
  className?: string;
}

export const WalletConnection = ({ className }: WalletConnectionProps) => {
  const { toast } = useToast();
  useWalletSync(); // Sync wallet address to Supabase
  const {
    isConnected,
    account,
    chainId,
    isLoading,
    error,
    connect,
    switchToPolygonAmoy,
    disconnect,
  } = useMetaMask();

  const handleConnect = async (walletType: string = 'metamask') => {
    if (walletType !== 'metamask') return false; // Only MetaMask implemented for now
    
    const success = await connect();
    if (success) {
      // Auto-switch to Amoy if on wrong network
      if (chainId !== POLYGON_AMOY_CHAIN_ID) {
        setTimeout(() => {
          handleSwitchNetwork();
        }, 1000);
      }
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

  const isWrongNetwork = isConnected && chainId !== POLYGON_AMOY_CHAIN_ID;

  return (
    <div className={className}>
      {isWrongNetwork && (
        <NetworkBanner onSwitchNetwork={handleSwitchNetwork} isLoading={isLoading} />
      )}
      
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="font-medium">Wallet Status</span>
          </div>
          
          <div className="flex items-center space-x-3">
            {!isConnected ? (
              <WalletSelector onConnect={handleConnect} />
            ) : (
              <WalletDropdown
                account={account!}
                chainId={chainId}
                onDisconnect={handleDisconnect}
                onSwitchNetwork={handleSwitchNetwork}
              />
            )}
          </div>
        </div>
        
        {error && (
          <div className="mt-3 flex items-center space-x-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </Card>
    </div>
  );
};