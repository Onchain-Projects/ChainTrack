import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Network } from "lucide-react";

interface NetworkBannerProps {
  onSwitchNetwork: () => void;
  isLoading?: boolean;
}

export const NetworkBanner = ({ onSwitchNetwork, isLoading }: NetworkBannerProps) => {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>
          You're connected to the wrong network. Please switch to Polygon Amoy Testnet to use all features.
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSwitchNetwork}
          disabled={isLoading}
          className="ml-4 border-destructive-foreground text-destructive-foreground hover:bg-destructive-foreground hover:text-destructive"
        >
          <Network className="h-3 w-3 mr-1" />
          {isLoading ? "Switching..." : "Switch to Polygon Amoy Testnet"}
        </Button>
      </AlertDescription>
    </Alert>
  );
};