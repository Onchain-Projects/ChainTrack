import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Factory, Truck, Store, User } from "lucide-react";

interface Role {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const roles: Role[] = [
  {
    id: "manufacturer",
    title: "Manufacturer",
    description: "Create and track product batches from production",
    icon: <Factory className="h-8 w-8" />,
    color: "text-primary"
  },
  {
    id: "distributor", 
    title: "Distributor",
    description: "Manage inventory and shipments between facilities",
    icon: <Truck className="h-8 w-8" />,
    color: "text-secondary"
  },
  {
    id: "retailer",
    title: "Retailer", 
    description: "Track products in your store and manage sales",
    icon: <Store className="h-8 w-8" />,
    color: "text-warning"
  },
  {
    id: "verify",
    title: "Consumer",
    description: "Verify product authenticity and view complete history",
    icon: <User className="h-8 w-8" />,
    color: "text-success"
  }
];

interface RoleSelectorProps {
  onRoleSelect: (roleId: string) => void;
}

const RoleSelector = ({ onRoleSelect }: RoleSelectorProps) => {
  const handleRoleSelect = (roleId: string) => {
    if (roleId === 'verify') {
      window.location.href = '/verify';
    } else {
      onRoleSelect(roleId);
    }
  };
  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Choose Your Role</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select your position in the supply chain to access your personalized dashboard
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role) => (
            <Card 
              key={role.id} 
              className="p-6 hover:shadow-elevated transition-spring cursor-pointer group"
              onClick={() => handleRoleSelect(role.id)}
            >
              <div className="text-center space-y-4">
                <div className={`${role.color} flex justify-center group-hover:scale-110 transition-spring`}>
                  {role.icon}
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{role.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {role.description}
                  </p>
                </div>

                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-smooth">
                  Access Dashboard
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RoleSelector;