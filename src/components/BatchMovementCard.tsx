import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, MapPin, Calendar, ExternalLink } from "lucide-react";
import { getPolygonscanUrl } from "@/lib/blockchain";

interface Movement {
  location: string;
  timestamp: string;
  blockchain_hash: string | null;
  from_user: {
    name: string;
    role: string;
  };
  to_user: {
    name: string;
    role: string;
  };
}

interface BatchMovementCardProps {
  movements: Movement[];
}

export const BatchMovementCard = ({ movements }: BatchMovementCardProps) => {
  if (movements.length === 0) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="bg-primary text-white p-2 rounded-lg">
          <MapPin className="h-4 w-4" />
        </div>
        <h3 className="text-lg font-semibold">Supply Chain Journey</h3>
      </div>

      <div className="space-y-4">
        {movements.map((movement, index) => (
          <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg bg-card">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{movement.location}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{new Date(movement.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm mt-1">
                <span>From: {movement.from_user.name} ({movement.from_user.role})</span>
                <span>→</span>
                <span>To: {movement.to_user.name} ({movement.to_user.role})</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {movement.blockchain_hash ? (
                <>
                  <Badge variant="default">
                    <Shield className="h-3 w-3 mr-1" />
                    On-Chain
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(getPolygonscanUrl(movement.blockchain_hash!), '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <Badge variant="secondary">Database Only</Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};