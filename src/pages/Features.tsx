import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileCheck, Package, Users, Lock, Zap, Globe, TrendingUp } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Shield,
      title: "Blockchain Security",
      description: "Immutable records on Polygon blockchain ensure complete transparency and tamper-proof tracking throughout the supply chain."
    },
    {
      icon: FileCheck,
      title: "Merkle Proof Verification",
      description: "Advanced cryptographic verification using Merkle trees enables efficient and secure proof of product authenticity without exposing sensitive data."
    },
    {
      icon: Package,
      title: "Multi-Product Support",
      description: "Track any type of product from pharmaceuticals to electronics. Our flexible system adapts to your supply chain needs."
    },
    {
      icon: Users,
      title: "Consumer Trust",
      description: "Empower consumers to verify product authenticity with simple QR code scanning. Build trust through transparency."
    },
    {
      icon: Lock,
      title: "Data Privacy",
      description: "Share only what's necessary. Merkle proofs allow verification without revealing the entire supply chain to competitors."
    },
    {
      icon: Zap,
      title: "Real-Time Tracking",
      description: "Monitor product movement instantly with sub-3 second transaction confirmation on Polygon Amoy testnet."
    },
    {
      icon: Globe,
      title: "Global Accessibility",
      description: "Access your supply chain data from anywhere. Our decentralized system ensures 99.9% uptime worldwide."
    },
    {
      icon: TrendingUp,
      title: "Scalable Solution",
      description: "Handle thousands of products and movements daily. Low gas fees make blockchain tracking economically viable at scale."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-subtle py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            Powerful Features for Modern Supply Chains
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Leverage blockchain technology and Merkle tree verification to create transparent, 
            secure, and efficient supply chain management systems.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-elevated transition-smooth hover:scale-105">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 ChainTrack. Securing supply chains with blockchain and Merkle tree technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Features;
