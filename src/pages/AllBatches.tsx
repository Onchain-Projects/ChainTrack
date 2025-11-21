import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Search, ExternalLink, Loader2, ArrowLeft, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";

interface Batch {
  id: string;
  batch_code: string;
  product_type: string;
  production_date: string;
  expiry_date: string;
  quantity: number;
  blockchain_hash: string | null;
  created_at: string;
  manufacturer: {
    name: string;
  };
}

const AllBatches = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchBatches();
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredBatches(batches);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = batches.filter(
        (batch) =>
          batch.batch_code.toLowerCase().includes(query) ||
          batch.product_type.toLowerCase().includes(query) ||
          batch.manufacturer.name.toLowerCase().includes(query)
      );
      setFilteredBatches(filtered);
    }
  }, [searchQuery, batches]);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from("batches")
        .select(`
          *,
          manufacturer:users!batches_manufacturer_id_fkey (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBatches(data || []);
      setFilteredBatches(data || []);
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      setLoading(false);
    }
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link to={user ? `/dashboard/${user.user_metadata?.role || 'manufacturer'}` : '/'}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-6 w-6 text-primary" />
                  All Batches
                </CardTitle>
                <CardDescription>
                  View and search all batches in the system
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {filteredBatches.length} {filteredBatches.length === 1 ? "Batch" : "Batches"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by batch code, product type, or manufacturer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {filteredBatches.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Code</TableHead>
                      <TableHead>Product Type</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Production Date</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBatches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-mono font-semibold">
                          {batch.batch_code}
                        </TableCell>
                        <TableCell>{batch.product_type}</TableCell>
                        <TableCell>{batch.manufacturer.name}</TableCell>
                        <TableCell>{batch.quantity.toLocaleString()} units</TableCell>
                        <TableCell>
                          {new Date(batch.production_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={batch.blockchain_hash ? "default" : "secondary"}>
                            {batch.blockchain_hash ? (
                              <div className="flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                Verified
                              </div>
                            ) : (
                              "Pending"
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link to={`/batch/${batch.id}`}>
                              <Button variant="outline" size="sm">
                                <Package className="h-3 w-3 mr-1" />
                                View Details
                              </Button>
                            </Link>
                            {batch.blockchain_hash && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  window.open(
                                    `https://www.oklink.com/amoy/tx/${batch.blockchain_hash}`,
                                    "_blank"
                                  )
                                }
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">
                  {searchQuery ? "No batches found" : "No batches yet"}
                </p>
                <p className="text-sm">
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "Create your first batch to get started"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AllBatches;
