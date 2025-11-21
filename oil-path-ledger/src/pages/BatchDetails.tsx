import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMetaMask } from "@/hooks/useMetaMask";
import { ChainTrackContract } from "@/lib/blockchain";
import { supabase } from "@/integrations/supabase/client";
import { MerkleTree } from "@/lib/merkleTree";
import { 
  Package, 
  Shield, 
  Hash, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  ArrowLeft,
  Loader2,
  Download,
  QrCode,
  Copy,
  Check
} from "lucide-react";
import Navbar from "@/components/Navbar";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface BatchData {
  id: string;
  batch_code: string;
  product_type: string;
  production_date: string;
  expiry_date: string;
  quantity: number;
  merkle_root: string | null;
  blockchain_hash: string | null;
  manufacturer: {
    name: string;
    email: string;
  };
}

interface ProductItem {
  id: string;
  product_identifier: string;
  qr_code_url: string | null;
}

const BatchDetails = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const { toast } = useToast();
  const { signer, isConnected } = useMetaMask();
  const [batchData, setBatchData] = useState<BatchData | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyItemId, setVerifyItemId] = useState("");
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedBatchCode, setCopiedBatchCode] = useState(false);

  useEffect(() => {
    fetchBatchDetails();
  }, [batchId]);

  const fetchBatchDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select(`
          *,
          manufacturer:users!batches_manufacturer_id_fkey (
            name,
            email
          )
        `)
        .eq('id', batchId)
        .single();

      if (error) throw error;
      
      setBatchData({
        id: data.id,
        batch_code: data.batch_code,
        product_type: data.product_type,
        production_date: data.production_date,
        expiry_date: data.expiry_date,
        quantity: data.quantity,
        merkle_root: data.merkle_root,
        blockchain_hash: data.blockchain_hash,
        manufacturer: data.manufacturer
      });

      // Fetch products with QR codes
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('batch_id', batchId);

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching batch details:', error);
      toast({
        title: "Error",
        description: "Failed to load batch details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = async (qrUrl: string, productId: string) => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      saveAs(blob, `QR_${productId}.png`);
      toast({
        title: "Downloaded",
        description: "QR code downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading QR:', error);
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive",
      });
    }
  };

  const handleDownloadAllQRs = async () => {
    if (products.length === 0) {
      toast({
        title: "No QR Codes",
        description: "No QR codes available for this batch",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    try {
      const zip = new JSZip();
      
      for (const product of products) {
        if (product.qr_code_url) {
          const response = await fetch(product.qr_code_url);
          const blob = await response.blob();
          zip.file(`QR_${product.product_identifier}.png`, blob);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${batchData?.batch_code}_QR_Codes.zip`);
      
      toast({
        title: "Downloaded",
        description: `${products.length} QR codes downloaded successfully`,
      });
    } catch (error) {
      console.error('Error downloading QRs:', error);
      toast({
        title: "Error",
        description: "Failed to download QR codes",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleVerifyItem = async () => {
    if (!verifyItemId.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter an item identifier",
        variant: "destructive",
      });
      return;
    }

    if (!batchData?.merkle_root) {
      toast({
        title: "No Merkle Root",
        description: "This batch does not have a Merkle root",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected || !signer) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to verify on blockchain",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // First, check if product exists in database
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('merkle_proof, product_identifier')
        .eq('batch_id', batchData.id)
        .eq('product_identifier', verifyItemId.trim())
        .maybeSingle(); // Use maybeSingle() instead of single() to handle not found gracefully

      if (productError) {
        console.error('Error fetching product:', productError);
        setVerificationResult(false);
        toast({
          title: "Verification Error",
          description: `Error checking product: ${productError.message}`,
          variant: "destructive",
        });
        return;
      }

      if (!productData) {
        // Product not found in database
        setVerificationResult(false);
        toast({
          title: "Verification Failed",
          description: `Product "${verifyItemId}" not found in this batch`,
          variant: "destructive",
        });
        return;
      }

      // Get stored Merkle proof from database
      if (!productData.merkle_proof || typeof productData.merkle_proof !== 'object') {
        throw new Error("Merkle proof not found for this product");
      }

      const proof = productData.merkle_proof as { leaf: string; proof: string[]; root: string };
      
      // Verify the product hash matches the stored leaf
      const productHash = MerkleTree.hash(verifyItemId.trim());
      if (productHash.toLowerCase() !== proof.leaf.toLowerCase()) {
        setVerificationResult(false);
        toast({
          title: "Verification Failed",
          description: "Product hash does not match stored proof",
          variant: "destructive",
        });
        return;
      }

      // Fetch batch from blockchain
      const contract = new ChainTrackContract(signer);
      const blockchainBatch = await contract.getBatch(batchData.batch_code);
      
      if (!blockchainBatch || !blockchainBatch.exists) {
        throw new Error("Batch not found on blockchain");
      }

      // Verify Merkle root matches
      if (blockchainBatch.merkleRoot.toLowerCase() !== batchData.merkle_root.toLowerCase()) {
        setVerificationResult(false);
        toast({
          title: "Verification Failed",
          description: "Batch Merkle root mismatch",
          variant: "destructive",
        });
        return;
      }

      // Now verify the Merkle proof on blockchain
      const isValid = await contract.verifyMerkleProof(
        batchData.batch_code,
        proof.leaf,
        proof.proof
      );

      setVerificationResult(isValid);
      
      toast({
        title: isValid ? "Item Verified ✓" : "Verification Failed",
        description: isValid 
          ? `Product "${verifyItemId}" is verified and part of batch ${batchData.batch_code}`
          : `Product "${verifyItemId}" could not be verified in this batch`,
        variant: isValid ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Error verifying item:', error);
      toast({
        title: "Verification Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      setVerificationResult(false);
    } finally {
      setIsVerifying(false);
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

  if (!batchData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Batch Not Found</h1>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          {/* Batch Information */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-primary text-white p-2 rounded-lg">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Batch Details</CardTitle>
                    <CardDescription>Complete information about this batch</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <div className="text-sm text-muted-foreground mb-1">Batch Code</div>
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-semibold text-lg">{batchData.batch_code}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(batchData.batch_code);
                          setCopiedBatchCode(true);
                          setTimeout(() => setCopiedBatchCode(false), 2000);
                        }}
                      >
                        {copiedBatchCode ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Product Type</div>
                    <div className="font-semibold">{batchData.product_type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Quantity</div>
                    <div className="font-semibold">{batchData.quantity} Units</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Manufacturer</div>
                    <div className="font-semibold">{batchData.manufacturer.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Production Date</div>
                    <div className="font-semibold">{new Date(batchData.production_date).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Expiry Date</div>
                    <div className="font-semibold">{new Date(batchData.expiry_date).toLocaleDateString()}</div>
                  </div>
                </div>

                {batchData.merkle_root && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Merkle Root</span>
                    </div>
                    <code className="text-xs bg-muted p-2 rounded block break-all">
                      {batchData.merkle_root}
                    </code>
                  </div>
                )}

                {batchData.blockchain_hash && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">Blockchain Transaction</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://www.oklink.com/amoy/tx/${batchData.blockchain_hash}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            </div>

            {/* Item Verification */}
            <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Verify Item
                </CardTitle>
                <CardDescription>
                  Verify if an item belongs to this batch
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="itemId">Item Identifier</Label>
                  <Input
                    id="itemId"
                    value={verifyItemId}
                    onChange={(e) => setVerifyItemId(e.target.value)}
                    placeholder="e.g., SN-CT-2024-001-001"
                    onKeyPress={(e) => e.key === 'Enter' && handleVerifyItem()}
                  />
                </div>

                <Button 
                  onClick={handleVerifyItem} 
                  disabled={isVerifying || !isConnected}
                  className="w-full"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Verify on Blockchain
                    </>
                  )}
                </Button>

                {!isConnected && (
                  <p className="text-xs text-muted-foreground text-center">
                    Connect your wallet to verify items
                  </p>
                )}

                {verificationResult !== null && (
                  <div className={`p-4 rounded-lg ${
                    verificationResult 
                      ? 'bg-success/10 border border-success' 
                      : 'bg-destructive/10 border border-destructive'
                  }`}>
                    <div className="flex items-center gap-2">
                      {verificationResult ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-success" />
                          <div>
                            <div className="font-semibold text-success">Valid Item ✓</div>
                            <div className="text-xs text-muted-foreground">
                              Verified on blockchain
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-destructive" />
                          <div>
                            <div className="font-semibold text-destructive">Invalid Item ✗</div>
                            <div className="text-xs text-muted-foreground">
                              Not found in this batch
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            </div>
          </div>

          {/* Products and QR Codes Table */}
          {products.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-primary" />
                      Product QR Codes
                    </CardTitle>
                    <CardDescription>
                      {products.length} product{products.length !== 1 ? 's' : ''} in this batch
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleDownloadAllQRs}
                    disabled={isDownloading}
                    variant="outline"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download All
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product ID</TableHead>
                        <TableHead className="text-center">QR Code</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono text-sm">
                            {product.product_identifier}
                          </TableCell>
                          <TableCell className="text-center">
                            {product.qr_code_url ? (
                              <div className="flex justify-center">
                                <img
                                  src={product.qr_code_url}
                                  alt={`QR code for ${product.product_identifier}`}
                                  className="w-24 h-24 border rounded"
                                />
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">No QR code</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.qr_code_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadQR(product.qr_code_url!, product.product_identifier)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  Product QR Codes
                </CardTitle>
                <CardDescription>
                  No products found for this batch
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="default">
                  <AlertDescription>
                    No products were created for this batch. This might happen if:
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                      <li>QR code generation failed during batch creation</li>
                      <li>Products table is empty for this batch</li>
                      <li>There was an error during product creation</li>
                    </ul>
                    <p className="mt-2 text-sm">
                      Check the browser console for errors, or try creating a new batch.
                    </p>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchDetails;
