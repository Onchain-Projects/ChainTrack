import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, LogOut, ChevronDown, Network } from "lucide-react";
import { formatAddress, getPolygonscanUrl, POLYGON_AMOY_CHAIN_ID } from "@/lib/blockchain";

interface WalletDropdownProps {
  account: string;
  chainId: number | null;
  onDisconnect: () => void;
  onSwitchNetwork: () => void;
}

export const WalletDropdown = ({ account, chainId, onDisconnect, onSwitchNetwork }: WalletDropdownProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  const isWrongNetwork = chainId !== POLYGON_AMOY_CHAIN_ID;

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(account);
      toast({
        title: "Copied",
        description: "Wallet address copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy address to clipboard",
        variant: "destructive",
      });
    }
    setIsOpen(false);
  };

  const openExplorer = () => {
    window.open(getPolygonscanUrl(account, 'address'), '_blank');
    setIsOpen(false);
  };

  const handleDisconnect = () => {
    onDisconnect();
    setIsOpen(false);
  };

  const handleSwitchNetwork = () => {
    onSwitchNetwork();
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="font-mono text-sm">{formatAddress(account)}</span>
          </div>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Connected Wallet</span>
            <Badge variant={isWrongNetwork ? "destructive" : "default"} className="text-xs">
              {isWrongNetwork ? "Wrong Network" : "Amoy Testnet"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-1">{account}</p>
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={copyAddress}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Address
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={openExplorer}>
          <ExternalLink className="h-4 w-4 mr-2" />
          View on Explorer
        </DropdownMenuItem>
        
        {isWrongNetwork && (
          <DropdownMenuItem onClick={handleSwitchNetwork}>
            <Network className="h-4 w-4 mr-2" />
            Switch to Amoy Testnet
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleDisconnect} className="text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};