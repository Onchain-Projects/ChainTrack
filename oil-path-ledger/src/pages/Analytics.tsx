import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import {
  BarChart3,
  Package,
  Shield,
  Users,
  TrendingUp,
  Filter,
  Loader2
} from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface AnalyticsData {
  totalBatches: number;
  totalProducts: number;
  totalTransactions: number;
  totalVerifications: number;
  productTypeDistribution: { name: string; value: number }[];
  batchCreationTrend: { date: string; count: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const Analytics = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalBatches: 0,
    totalProducts: 0,
    totalTransactions: 0,
    totalVerifications: 0,
    productTypeDistribution: [],
    batchCreationTrend: []
  });
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    productType: 'all'
  });
  
  const [productTypes, setProductTypes] = useState<string[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Build query with filters
      let batchQuery = supabase.from('batches').select('*');
      
      if (filters.startDate) {
        batchQuery = batchQuery.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        batchQuery = batchQuery.lte('created_at', filters.endDate);
      }
      if (filters.productType !== 'all') {
        batchQuery = batchQuery.eq('product_type', filters.productType);
      }

      const { data: batches, error: batchError } = await batchQuery;
      if (batchError) throw batchError;

      // Get all product types for filter dropdown
      const { data: allBatches } = await supabase
        .from('batches')
        .select('product_type');
      
      const uniqueTypes = [...new Set(allBatches?.map(b => b.product_type) || [])];
      setProductTypes(uniqueTypes);

      // Total batches
      const totalBatches = batches?.length || 0;

      // Total products
      const batchIds = batches?.map(b => b.id) || [];
      let productsQuery = supabase.from('products').select('*', { count: 'exact' });
      if (batchIds.length > 0) {
        productsQuery = productsQuery.in('batch_id', batchIds);
      }
      const { count: totalProducts } = await productsQuery;

      // Total blockchain transactions
      const totalTransactions = batches?.filter(b => b.blockchain_hash).length || 0;

      // Total consumer verifications
      let verificationsQuery = supabase.from('consumer_scans').select('*', { count: 'exact' });
      if (batchIds.length > 0) {
        verificationsQuery = verificationsQuery.in('batch_id', batchIds);
      }
      const { count: totalVerifications } = await verificationsQuery;

      // Product type distribution
      const typeDistribution = batches?.reduce((acc, batch) => {
        const type = batch.product_type;
        const existing = acc.find(item => item.name === type);
        if (existing) {
          existing.value += 1;
        } else {
          acc.push({ name: type, value: 1 });
        }
        return acc;
      }, [] as { name: string; value: number }[]) || [];

      // Batch creation trend (last 30 days or filtered range)
      const trendData = batches?.reduce((acc, batch) => {
        const date = new Date(batch.created_at).toLocaleDateString();
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.count += 1;
        } else {
          acc.push({ date, count: 1 });
        }
        return acc;
      }, [] as { date: string; count: number }[]) || [];

      // Sort trend data by date
      trendData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setAnalyticsData({
        totalBatches,
        totalProducts: totalProducts || 0,
        totalTransactions,
        totalVerifications: totalVerifications || 0,
        productTypeDistribution: typeDistribution,
        batchCreationTrend: trendData
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchAnalytics();
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      productType: 'all'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      {/* Header */}
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary text-white p-3 rounded-lg">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                <p className="text-muted-foreground">Track your supply chain performance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>Filter analytics by date range and product type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="productType">Product Type</Label>
                <Select
                  value={filters.productType}
                  onValueChange={(value) => setFilters({ ...filters, productType: value })}
                >
                  <SelectTrigger id="productType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {productTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleApplyFilters} className="flex-1">
                  Apply
                </Button>
                <Button onClick={handleResetFilters} variant="outline" className="flex-1">
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalBatches}</div>
              <p className="text-xs text-muted-foreground">
                Product batches created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Individual items tracked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blockchain Txns</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalTransactions}</div>
              <p className="text-xs text-muted-foreground">
                Verified on-chain
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verifications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalVerifications}</div>
              <p className="text-xs text-muted-foreground">
                Consumer scans
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Product Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Product Type Distribution
              </CardTitle>
              <CardDescription>Breakdown of batches by product type</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.productTypeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.productTypeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.productTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Batch Creation Trend Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Batch Creation Trend
              </CardTitle>
              <CardDescription>Number of batches created over time</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.batchCreationTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.batchCreationTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Batches Created"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Type Bar Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Batch Count by Product Type
              </CardTitle>
              <CardDescription>Comparative view of batches across product categories</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.productTypeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.productTypeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Number of Batches">
                      {analyticsData.productTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
