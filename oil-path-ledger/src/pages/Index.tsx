import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import RoleSelector from "@/components/RoleSelector";

const Index = () => {
  const navigate = useNavigate();

  const handleRoleSelect = (roleId: string) => {
    navigate(`/dashboard/${roleId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <RoleSelector onRoleSelect={handleRoleSelect} />
      
      {/* Footer */}
      <footer className="bg-muted/30 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="/features" className="text-muted-foreground hover:text-foreground transition-smooth">Features</a></li>
                <li><a href="/how-it-works" className="text-muted-foreground hover:text-foreground transition-smooth">How it Works</a></li>
                <li><a href="/pricing" className="text-muted-foreground hover:text-foreground transition-smooth">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="/about" className="text-muted-foreground hover:text-foreground transition-smooth">About</a></li>
                <li><a href="/contact" className="text-muted-foreground hover:text-foreground transition-smooth">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="/verify" className="text-muted-foreground hover:text-foreground transition-smooth">Verify Product</a></li>
                <li><a href="/docs" className="text-muted-foreground hover:text-foreground transition-smooth">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="/privacy" className="text-muted-foreground hover:text-foreground transition-smooth">Privacy Policy</a></li>
                <li><a href="/terms" className="text-muted-foreground hover:text-foreground transition-smooth">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 ChainTrack. Securing supply chains with blockchain and Merkle tree technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
