import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Shield, Eye, EyeOff } from 'lucide-react';

const SignUp = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.fullName || !formData.email || !formData.password || !formData.role) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const { error } = await signUp(formData.email, formData.password, formData.fullName, formData.role);
    
    if (!error) {
      // For non-consumer roles, redirect to login with message about blockchain registration
      if (formData.role !== 'consumer') {
        toast({
          title: "Account Created",
          description: "After logging in, you'll need to complete blockchain registration to perform operations.",
        });
      }
      navigate('/login');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-floating">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-gradient-primary p-3 rounded-xl">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl bg-gradient-hero bg-clip-text text-transparent">
              Join ChainTrack
            </CardTitle>
            <CardDescription className="text-base">
              Create your account to secure supply chains
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  className="h-12 pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manufacturer">Manufacturer</SelectItem>
                  <SelectItem value="distributor">Distributor</SelectItem>
                  <SelectItem value="retailer">Retailer</SelectItem>
                  <SelectItem value="consumer">Consumer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base bg-gradient-primary hover:opacity-90 transition-smooth"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignUp;