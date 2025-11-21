import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Wallet, ExternalLink } from "lucide-react";

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  isInstalled: () => boolean;
  connect: () => Promise<boolean>;
}

interface WalletSelectorProps {
  onConnect: (walletType: string) => Promise<boolean>;
}

export const WalletSelector = ({ onConnect }: WalletSelectorProps) => {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const wallets: WalletOption[] = [
    {
      id: "metamask",
      name: "MetaMask",
      icon: "🦊",
      isInstalled: () => typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask,
      connect: async () => {
        if (!window.ethereum?.isMetaMask) {
          window.open('https://metamask.io/', '_blank');
          return false;
        }
        return await onConnect('metamask');
      }
    },
    {
      id: "walletconnect",
      name: "WalletConnect",
      icon: "🔗",
      isInstalled: () => true, // WalletConnect is always "available" via QR
      connect: async () => {
        toast({
          title: "WalletConnect",
          description: "WalletConnect integration coming soon!",
          variant: "default"
        });
        return false;
      }
    },
    {
      id: "coinbase",
      name: "Coinbase Wallet",
      icon: "🔵",
      isInstalled: () => typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' && (window.ethereum as any).isCoinbaseWallet,
      connect: async () => {
        toast({
          title: "Coinbase Wallet",
          description: "Coinbase Wallet integration coming soon!",
          variant: "default"
        });
        return false;
      }
    }
  ];

  const handleConnect = async (wallet: WalletOption) => {
    setIsConnecting(wallet.id);
    
    try {
      const success = await wallet.connect();
      if (success) {
        setIsOpen(false);
        toast({
          title: "Wallet Connected",
          description: `Successfully connected to ${wallet.name}`,
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${wallet.name}`,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {wallets.map((wallet) => (
            <Card key={wallet.id} className="p-0">
              <Button
                variant="ghost"
                className="w-full justify-between p-4 h-auto"
                onClick={() => handleConnect(wallet)}
                disabled={isConnecting === wallet.id}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{wallet.icon}</span>
                  <div className="text-left">
                    <p className="font-medium">{wallet.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {wallet.isInstalled() ? "Installed" : "Not installed"}
                    </p>
                  </div>
                </div>
                {!wallet.isInstalled() && wallet.id === "metamask" && (
                  <ExternalLink className="h-4 w-4" />
                )}
                {isConnecting === wallet.id && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                )}
              </Button>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};