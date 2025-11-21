import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, CheckCircle2, AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import { getPolygonscanUrl } from "@/lib/blockchain";

interface BlockchainVerificationProps {
  isConnected: boolean;
  isVerified: boolean | null;
  blockchainHash?: string;
  isLoading?: boolean;
}

export const BlockchainVerification = ({ 
  isConnected, 
  isVerified, 
  blockchainHash,
  isLoading = false 
}: BlockchainVerificationProps) => {
  const getVerificationStatus = () => {
    if (isLoading || isVerified === null) {
      return {
        variant: "secondary" as const,
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
        text: "Verifying...",
        description: "Checking blockchain data..."
      };
    }

    if (isVerified) {
      return {
        variant: "default" as const,
        icon: <CheckCircle2 className="h-3 w-3" />,
        text: "Blockchain Verified ✅",
        description: "This product's data has been verified on the blockchain and matches our records."
      };
    }

    return {
      variant: "destructive" as const,
      icon: <AlertTriangle className="h-3 w-3" />,
      text: "Not Verified ❌",
      description: "Warning: This product's blockchain data doesn't match our records or wasn't found on-chain."
    };
  };

  const status = getVerificationStatus();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Shield className="h-5 w-5 mr-2 text-primary" />
          Blockchain Verification
        </h3>
        <Badge variant={status.variant}>
          <div className="flex items-center space-x-1">
            {status.icon}
            <span>{status.text}</span>
          </div>
        </Badge>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {status.description}
        </p>
        {blockchainHash && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(getPolygonscanUrl(blockchainHash), '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View on Polygonscan
          </Button>
        )}
      </div>
    </Card>
  );
};