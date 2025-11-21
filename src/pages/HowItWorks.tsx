import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Factory, Truck, Store, CheckCircle } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: Factory,
      number: "01",
      title: "Manufacturer",
      description: "Manufacturer creates a batch with product details and generates a unique Merkle root. This cryptographic fingerprint is anchored on the Polygon blockchain, creating an immutable record.",
      details: [
        "Create product batches with unique identifiers",
        "Generate Merkle tree for batch verification",
        "Store Merkle root on blockchain",
        "Issue QR codes for each product"
      ]
    },
    {
      icon: Truck,
      number: "02",
      title: "Distributor",
      description: "Distributor receives the batch and records the movement on blockchain. Each transfer includes timestamp, location, and cryptographic proof linking back to the original batch.",
      details: [
        "Scan and verify received products",
        "Record movement with location data",
        "Generate Merkle proof for shipment",
        "Update blockchain with transfer details"
      ]
    },
    {
      icon: Store,
      number: "03",
      title: "Retailer",
      description: "Retailer receives products and verifies authenticity using blockchain records. The complete chain of custody is visible, ensuring product integrity throughout the journey.",
      details: [
        "Verify product authenticity via Merkle proof",
        "Update inventory with blockchain confirmation",
        "Track product location in real-time",
        "Maintain transparent records for customers"
      ]
    },
    {
      icon: CheckCircle,
      number: "04",
      title: "Consumer",
      description: "Consumer scans the QR code to verify product authenticity. They can see the complete journey from manufacturer to retail, building trust through transparency.",
      details: [
        "Scan product QR code with any smartphone",
        "View complete supply chain history",
        "Verify blockchain authenticity",
        "Report suspicious products if needed"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-subtle py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            How ChainTrack Works
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Follow the journey of a product from manufacturer to consumer, secured by blockchain 
            technology and verified with Merkle tree cryptography.
          </p>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            {/* Vertical Line */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-hero"></div>

            {/* Steps */}
            <div className="space-y-16">
              {steps.map((step, index) => (
                <div key={index} className={`flex flex-col md:flex-row gap-8 items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Content Card */}
                  <div className="md:w-1/2">
                    <Card className="hover:shadow-elevated transition-smooth">
                      <CardHeader>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center">
                            <step.icon className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground font-mono">Step {step.number}</div>
                            <CardTitle className="text-2xl">{step.title}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-base mb-4">
                          {step.description}
                        </CardDescription>
                        <ul className="space-y-2">
                          {step.details.map((detail, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Spacer for timeline */}
                  <div className="hidden md:block md:w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Secure Your Supply Chain?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of businesses using blockchain technology to build trust and transparency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/signup" className="inline-flex items-center justify-center h-11 rounded-md px-8 bg-gradient-hero text-white hover:shadow-elevated hover:scale-105 transition-spring font-semibold">
              Get Started Free
            </a>
            <a href="/pricing" className="inline-flex items-center justify-center h-11 rounded-md px-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-smooth">
              View Pricing
            </a>
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

export default HowItWorks;
