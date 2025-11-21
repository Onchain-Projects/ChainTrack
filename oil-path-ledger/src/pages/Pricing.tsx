import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, TrendingUp, Building2 } from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      icon: Zap,
      price: "₹4,999",
      period: "/month",
      description: "Perfect for small businesses getting started with blockchain tracking",
      features: [
        "Up to 1,000 products/month",
        "Basic blockchain verification",
        "QR code generation",
        "Consumer verification portal",
        "Email support",
        "5 team members",
        "Basic analytics dashboard",
        "Mobile app access"
      ],
      cta: "Start Free Trial",
      popular: false
    },
    {
      name: "Growth",
      icon: TrendingUp,
      price: "₹14,999",
      period: "/month",
      description: "Ideal for growing businesses with complex supply chains",
      features: [
        "Up to 10,000 products/month",
        "Advanced Merkle proof verification",
        "Custom branding on QR codes",
        "Priority support (24/7)",
        "Unlimited team members",
        "Advanced analytics & reports",
        "API access",
        "Batch operations",
        "Multi-location tracking",
        "Export capabilities"
      ],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      icon: Building2,
      price: "Custom",
      period: "",
      description: "Tailored solutions for large-scale operations",
      features: [
        "Unlimited products",
        "Dedicated blockchain infrastructure",
        "Custom smart contracts",
        "White-label solution",
        "Dedicated account manager",
        "SLA guarantee (99.9% uptime)",
        "Custom integrations",
        "On-premise deployment option",
        "Advanced security features",
        "Training & onboarding",
        "Custom analytics & BI tools",
        "Regulatory compliance support"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-subtle py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the perfect plan for your business. All plans include blockchain security 
            and Merkle tree verification.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative flex flex-col ${
                  plan.popular 
                    ? 'border-primary shadow-elevated scale-105' 
                    : 'hover:shadow-elevated hover:scale-105'
                } transition-smooth`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-hero text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-4">
                    <plan.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription className="min-h-12">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button 
                    variant={plan.popular ? "hero" : "outline"} 
                    className="w-full"
                    asChild
                  >
                    <a href={plan.name === "Enterprise" ? "/contact" : "/signup"}>
                      {plan.cta}
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Compare All Features</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-card rounded-lg overflow-hidden shadow-card">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="text-center p-4 font-semibold">Starter</th>
                  <th className="text-center p-4 font-semibold">Growth</th>
                  <th className="text-center p-4 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-4">Products per month</td>
                  <td className="text-center p-4">1,000</td>
                  <td className="text-center p-4">10,000</td>
                  <td className="text-center p-4">Unlimited</td>
                </tr>
                <tr>
                  <td className="p-4">Team members</td>
                  <td className="text-center p-4">5</td>
                  <td className="text-center p-4">Unlimited</td>
                  <td className="text-center p-4">Unlimited</td>
                </tr>
                <tr>
                  <td className="p-4">Merkle proof verification</td>
                  <td className="text-center p-4">Basic</td>
                  <td className="text-center p-4">Advanced</td>
                  <td className="text-center p-4">Custom</td>
                </tr>
                <tr>
                  <td className="p-4">API access</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4">Custom branding</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4">White-label solution</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-primary mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4">Support</td>
                  <td className="text-center p-4">Email</td>
                  <td className="text-center p-4">24/7 Priority</td>
                  <td className="text-center p-4">Dedicated Manager</td>
                </tr>
                <tr>
                  <td className="p-4">SLA</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4">99.9%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We accept all major credit cards, debit cards, UPI, net banking, and bank transfers for Indian customers.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans later?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect in the next billing cycle.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, we offer a 14-day free trial for Starter and Growth plans. No credit card required to start.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens if I exceed my plan limits?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We'll notify you when you're approaching your limits. You can upgrade your plan or purchase additional capacity as needed.
                </p>
              </CardContent>
            </Card>
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

export default Pricing;
