import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMetaMask } from "@/hooks/useMetaMask";
import { ChainTrackContract } from "@/lib/blockchain";
import { supabase } from "@/integrations/supabase/client";
import { MerkleTree } from "@/lib/merkleTree";
import { Shield, Search, Package, CheckCircle, XCircle, Hash, Loader2 } from "lucide-react";
import { BlockchainVerification } from "@/components/BlockchainVerification";
import { BatchMovementCard } from "@/components/BatchMovementCard";
import Navbar from "@/components/Navbar";

interface BatchInfo {
  code: string;
  productType: string;
  productionDate: string;
  expiryDate: string;
  quantity: number;
  manufacturer: string;
  blockchainHash: string | null;
  merkleRoot: string | null;
}

interface MovementInfo {
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

const Consumer = () => {
  const { toast } = useToast();
  const { signer, isConnected } = useMetaMask();
  const [searchParams] = useSearchParams();
  const [batchCode, setBatchCode] = useState("");
  const [productId, setProductId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingProduct, setIsVerifyingProduct] = useState(false);
  const [batchInfo, setBatchInfo] = useState<BatchInfo | null>(null);
  const [movements, setMovements] = useState<MovementInfo[]>([]);
  const [blockchainVerified, setBlockchainVerified] = useState<boolean | null>(null);
  const [productVerified, setProductVerified] = useState<boolean | null>(null);

  // Define handleSearch first (needed by handleSearchFromQR)
  const handleSearch = useCallback(async (codeOverride?: string) => {
    const trimmedCode = (codeOverride || batchCode).trim();
    
    if (!trimmedCode) {
      toast({
        title: "Invalid Input",
        description: "Please enter a batch code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setBatchInfo(null);
    setMovements([]);
    setBlockchainVerified(null);

    try {
      // Fetch from Supabase
      const { data: batch, error: batchError } = await supabase
        .from('batches')
        .select(`
          *,
          users!batches_manufacturer_id_fkey (
            name,
            email
          )
        `)
        .eq('batch_code', trimmedCode)
        .single();

      if (batchError) {
        console.error('Batch fetch error:', batchError);
        throw new Error(`Batch not found: ${batchError.message}`);
      }
      
      if (!batch) {
        throw new Error("Batch not found in database");
      }
      
      console.log('Batch found:', batch.batch_code);

      setBatchInfo({
        code: batch.batch_code,
        productType: batch.product_type,
        productionDate: new Date(batch.production_date).toLocaleDateString(),
        expiryDate: new Date(batch.expiry_date).toLocaleDateString(),
        quantity: batch.quantity,
        manufacturer: batch.users?.name || 'Unknown',
        blockchainHash: batch.blockchain_hash,
        merkleRoot: batch.merkle_root,
      });

      // Fetch movements
      const { data: movementData, error: movementError } = await supabase
        .from('movements')
        .select(`
          location,
          timestamp,
          blockchain_hash,
          from_user:users!movements_from_user_fkey (
            name,
            role
          ),
          to_user:users!movements_to_user_fkey (
            name,
            role
          )
        `)
        .eq('batch_id', batch.id)
        .order('timestamp', { ascending: true });

      if (movementData) {
        setMovements(movementData.map((m: any) => ({
          location: m.location,
          timestamp: m.timestamp,
          blockchain_hash: m.blockchain_hash,
          from_user: { 
            name: m.from_user?.name || 'Unknown', 
            role: m.from_user?.role || 'unknown' 
          },
          to_user: { 
            name: m.to_user?.name || 'Unknown', 
            role: m.to_user?.role || 'unknown' 
          }
        })));
      }

      // Verify on blockchain (no wallet needed - uses read-only provider)
      try {
        const { getReadOnlyProvider } = await import("@/lib/blockchain");
        const readOnlyProvider = getReadOnlyProvider();
        const contract = new ChainTrackContract(readOnlyProvider);
        const blockchainBatch = await contract.getBatch(trimmedCode);
        
        if (blockchainBatch && blockchainBatch.exists) {
          const isVerified = 
            blockchainBatch.batchCode === batch.batch_code &&
            blockchainBatch.productType === batch.product_type &&
            blockchainBatch.productionDate.getTime() === new Date(batch.production_date).getTime() &&
            blockchainBatch.expiryDate.getTime() === new Date(batch.expiry_date).getTime();
          
          setBlockchainVerified(isVerified);
        } else {
          setBlockchainVerified(false);
        }
      } catch (error) {
        console.error('Blockchain verification failed:', error);
        setBlockchainVerified(false);
      }

      // Record consumer scan
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('consumer_scans')
          .insert({
            batch_id: batch.id,
            consumer_id: user.id,
          });
      }

    } catch (error) {
      console.error('Error searching batch:', error);
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [batchCode, toast]);

  // Define handleSearchFromQR (uses handleSearch)
  const handleSearchFromQR = useCallback(async (batchCodeParam: string, productIdParam: string) => {
    try {
      console.log('🔄 Processing QR code scan:', { batchCode: batchCodeParam, productId: productIdParam });
      setProductId(productIdParam);
      setIsLoading(true);
      
      // First, try to find the product and get its actual batch
      console.log('📦 Searching for product:', productIdParam.trim());
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('batch_id, product_identifier, batches!inner(batch_code, product_type, production_date, expiry_date, quantity, merkle_root, blockchain_hash, manufacturer_id, users!batches_manufacturer_id_fkey(name, email))')
        .eq('product_identifier', productIdParam.trim())
        .maybeSingle();
      
      console.log('📦 Product query result - merkle_root check:', {
        hasProductData: !!productData,
        merkleRoot: productData?.batches?.merkle_root,
        batchCode: productData?.batches?.batch_code
      });
      
      console.log('📦 Product search result:', { 
        found: !!productData, 
        error: productError?.message,
        productData: productData ? 'exists' : 'not found'
      });
      
      if (productError || !productData) {
        // Product not found, try to search by batch code from URL
        console.log('⚠️ Product not found, trying batch code from URL:', batchCodeParam);
        setBatchCode(batchCodeParam);
        await handleSearch(batchCodeParam);
        toast({
          title: "Product Not Found",
          description: `Product "${productIdParam}" not found. Showing batch information instead.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Product found! Use its actual batch
      const actualBatch = (productData as any).batches;
      if (actualBatch) {
        console.log('✅ Found product in batch:', actualBatch.batch_code);
        setBatchCode(actualBatch.batch_code);
        
        // Set batch info directly
        setBatchInfo({
          code: actualBatch.batch_code,
          productType: actualBatch.product_type,
          productionDate: new Date(actualBatch.production_date).toLocaleDateString(),
          expiryDate: new Date(actualBatch.expiry_date).toLocaleDateString(),
          quantity: actualBatch.quantity,
          manufacturer: actualBatch.users?.name || 'Unknown',
          blockchainHash: actualBatch.blockchain_hash,
          merkleRoot: actualBatch.merkle_root,
        });
        
        // Fetch movements for this batch
        console.log('📍 Fetching movements for batch:', productData.batch_id);
        const { data: movementData, error: movementError } = await supabase
          .from('movements')
          .select(`
            location,
            timestamp,
            blockchain_hash,
            from_user:users!movements_from_user_fkey (name, role),
            to_user:users!movements_to_user_fkey (name, role)
          `)
          .eq('batch_id', productData.batch_id)
          .order('timestamp', { ascending: true });
        
        if (movementError) {
          console.error('❌ Error fetching movements:', movementError);
        } else {
          console.log('✅ Movements fetched:', movementData?.length || 0);
        }
        
        if (movementData) {
          setMovements(movementData.map((m: any) => ({
            location: m.location,
            timestamp: m.timestamp,
            blockchain_hash: m.blockchain_hash,
            from_user: { 
              name: m.from_user?.name || 'Unknown', 
              role: m.from_user?.role || 'unknown' 
            },
            to_user: { 
              name: m.to_user?.name || 'Unknown', 
              role: m.to_user?.role || 'unknown' 
            }
          })));
        }
        
        // Verify on blockchain (no wallet needed)
        console.log('🔗 Verifying on blockchain...');
        try {
          const { getReadOnlyProvider } = await import("@/lib/blockchain");
          const readOnlyProvider = getReadOnlyProvider();
          const contract = new ChainTrackContract(readOnlyProvider);
          const blockchainBatch = await contract.getBatch(actualBatch.batch_code);
          
          if (blockchainBatch && blockchainBatch.exists) {
            const isVerified = 
              blockchainBatch.batchCode === actualBatch.batch_code &&
              blockchainBatch.productType === actualBatch.product_type;
            setBlockchainVerified(isVerified);
            console.log('✅ Blockchain verification:', isVerified ? 'VERIFIED' : 'NOT VERIFIED');
          } else {
            setBlockchainVerified(false);
            console.log('❌ Batch not found on blockchain');
          }
        } catch (blockchainError) {
          console.error('❌ Blockchain verification error:', blockchainError);
          setBlockchainVerified(false);
        }
        
        // Verify product after batch is loaded - pass batch code directly to avoid race condition
        console.log('🔒 Verifying product...');
        setTimeout(() => {
          handleVerifyProduct(productIdParam, actualBatch.batch_code).catch(err => {
            console.error('❌ Product verification error:', err);
            toast({
              title: "Verification Error",
              description: err instanceof Error ? err.message : "Failed to verify product",
              variant: "destructive",
            });
          });
        }, 500);
        
        setIsLoading(false);
        console.log('✅ QR code processing complete!');
      } else {
        throw new Error('Batch information not found for product');
      }
    } catch (error) {
      console.error('❌ Error processing QR code:', error);
      setIsLoading(false);
      toast({
        title: "QR Code Error",
        description: error instanceof Error ? error.message : "Failed to process QR code",
        variant: "destructive",
      });
    }
  }, [toast, handleSearch]);

  // Handle QR code scan via URL parameters
  useEffect(() => {
    const productIdFromUrl = searchParams.get('productId');
    const batchCodeFromUrl = searchParams.get('batchCode');
    
    console.log('🔍 URL Parameters Check:', {
      productId: productIdFromUrl,
      batchCode: batchCodeFromUrl,
      fullURL: window.location.href,
      searchParams: Object.fromEntries(searchParams.entries())
    });
    
    // Only process if we have both parameters and haven't already processed them
    if (productIdFromUrl && batchCodeFromUrl) {
      // Decode URL parameters in case they were encoded
      const decodedProductId = decodeURIComponent(productIdFromUrl).trim();
      const decodedBatchCode = decodeURIComponent(batchCodeFromUrl).trim();
      
      // Skip if we're already showing this product (avoid re-processing)
      if (productId === decodedProductId && batchCode === decodedBatchCode && batchInfo) {
        console.log('⏭️ Already showing this product, skipping re-processing');
        return;
      }
      
      console.log('✅ QR Code detected:', { 
        productId: decodedProductId, 
        batchCode: decodedBatchCode,
        rawProductId: productIdFromUrl,
        rawBatchCode: batchCodeFromUrl
      });
      
      setProductId(decodedProductId);
      setBatchCode(decodedBatchCode);
      
      // Show loading state
      setIsLoading(true);
      
      // Auto-verify after a brief delay to ensure state is set
      const timeoutId = setTimeout(() => {
        handleSearchFromQR(decodedBatchCode, decodedProductId).catch(error => {
          console.error('❌ Error in handleSearchFromQR:', error);
          setIsLoading(false);
          toast({
            title: "Error Loading Product",
            description: error instanceof Error ? error.message : "Failed to load product information",
            variant: "destructive",
          });
        });
      }, 100);
      
      // Cleanup timeout on unmount
      return () => clearTimeout(timeoutId);
    } else {
      // Log if parameters are missing for debugging
      console.warn('⚠️ QR Code parameters missing:', { 
        hasProductId: !!productIdFromUrl, 
        hasBatchCode: !!batchCodeFromUrl,
        allParams: Object.fromEntries(searchParams.entries()),
        currentURL: window.location.href
      });
    }
  }, [searchParams, handleSearchFromQR, toast, productId, batchCode, batchInfo]);

  const handleVerifyProduct = async (idOverride?: string, batchCodeOverride?: string) => {
    const productIdToVerify = idOverride || productId;
    if (!productIdToVerify.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a product identifier",
        variant: "destructive",
      });
      return;
    }

    // Use provided batch code, or fall back to batchInfo, or use batchCode from state
    let batchCodeToUse = batchCodeOverride || batchInfo?.code || batchCode.trim();
    
    if (!batchCodeToUse) {
      toast({
        title: "Missing Batch Information",
        description: "Batch information is not available. Please search for a batch first.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifyingProduct(true);
    setProductVerified(null);

    try {
      // Use read-only provider (no wallet needed!)
      const { getReadOnlyProvider } = await import("@/lib/blockchain");
      const readOnlyProvider = getReadOnlyProvider();
      const contract = new ChainTrackContract(readOnlyProvider);
      
      // Verify batch exists on blockchain and get merkle root
      const blockchainBatch = await contract.getBatch(batchCodeToUse);
      
      if (!blockchainBatch || !blockchainBatch.exists) {
        setProductVerified(false);
        toast({
          title: "Verification Failed",
          description: "Batch not found on blockchain",
          variant: "destructive",
        });
        return;
      }

      // Use merkle root from blockchain if database doesn't have it
      const merkleRootToUse = batchInfo?.merkleRoot || blockchainBatch.merkleRoot;
      
      if (!merkleRootToUse) {
        toast({
          title: "No Merkle Root",
          description: "This batch does not have Merkle verification enabled",
          variant: "destructive",
        });
        setIsVerifyingProduct(false);
        return;
      }

      // Get batch ID from batch code
      const { data: batchRecord } = await supabase
        .from('batches')
        .select('id')
        .eq('batch_code', batchCodeToUse)
        .single();

      // Get stored Merkle proof from database
      let productData = null;
      if (batchRecord?.id) {
        const { data, error: productError } = await supabase
          .from('products')
          .select('merkle_proof')
          .eq('product_identifier', productIdToVerify.trim())
          .eq('batch_id', batchRecord.id)
          .maybeSingle(); // Use maybeSingle to handle not found gracefully
        
        if (productError) {
          console.error('Error fetching product:', productError);
          throw new Error(`Product lookup failed: ${productError.message}`);
        }
        
        productData = data;
        console.log('Product data:', productData ? 'Found' : 'Not found');
      }

      // If we have stored Merkle proof, use it for verification
      if (productData?.merkle_proof && typeof productData.merkle_proof === 'object') {
        const proof = productData.merkle_proof as { leaf: string; proof: string[]; root: string };
        
        // Verify Merkle proof on blockchain (read-only, no wallet needed)
        const isValid = await contract.verifyMerkleProof(
          batchCodeToUse,
          proof.leaf,
          proof.proof
        );
        
        setProductVerified(isValid);
        
        toast({
          title: isValid ? "Product Verified ✓" : "Verification Failed",
          description: isValid 
            ? "Product is authentic and verified on blockchain"
            : "Product could not be verified in this batch",
          variant: isValid ? "default" : "destructive",
        });
      } else {
        // Fallback: verify Merkle root matches (less secure but works)
        const isValid = blockchainBatch.merkleRoot === merkleRootToUse;
        setProductVerified(isValid);
        
        toast({
          title: isValid ? "Batch Verified ✓" : "Verification Failed",
          description: isValid 
            ? "Batch verified, but product-specific proof not available"
            : "Product could not be verified",
          variant: isValid ? "default" : "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying product:', error);
      toast({
        title: "Verification Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      setProductVerified(false);
    } finally {
      setIsVerifyingProduct(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      {/* Header */}
      <div className="bg-background border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="bg-success text-white p-3 rounded-lg">
                <Shield className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold">Product Verification</h1>
            </div>
            <p className="text-muted-foreground">
              Verify the authenticity and track the journey of your product
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <Card className="p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Search className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Enter Batch Code</h2>
          </div>
          
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="batchCode">Batch Code</Label>
              <Input
                id="batchCode"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
                placeholder="e.g., CT-2024-001"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => handleSearch()} disabled={isLoading}>
                {isLoading ? "Searching..." : "Verify Product"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Results */}
        {batchInfo && (
          <div className="space-y-6">
            {/* Blockchain Status */}
            <BlockchainVerification
              isConnected={true}
              isVerified={blockchainVerified}
              blockchainHash={batchInfo.blockchainHash || undefined}
              isLoading={isLoading}
            />

            {/* Batch Information */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Package className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Product Information</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Batch Code</div>
                    <div className="font-medium">{batchInfo.code}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Product Type</div>
                    <div className="font-medium">{batchInfo.productType}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Quantity</div>
                    <div className="font-medium">{batchInfo.quantity} Units</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Manufacturer</div>
                    <div className="font-medium">{batchInfo.manufacturer}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Production Date</div>
                    <div className="font-medium">{batchInfo.productionDate}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Expiry Date</div>
                    <div className="font-medium">{batchInfo.expiryDate}</div>
                  </div>
                </div>
              </div>

              {batchInfo.merkleRoot && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Merkle Root (Cryptographic Proof)</span>
                  </div>
                  <code className="text-xs bg-muted p-2 rounded block break-all">
                    {batchInfo.merkleRoot}
                  </code>
                </div>
              )}
            </Card>

            {/* Product ID Verification */}
            {batchInfo.merkleRoot && (
              <Card className="p-6 bg-gradient-subtle">
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Verify Individual Product</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter a product identifier to verify if it's part of this authenticated batch
                </p>
                
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      placeholder="e.g., SN-CT-2024-001-001"
                      onKeyPress={(e) => e.key === 'Enter' && handleVerifyProduct()}
                    />
                  </div>
                  <Button 
                    onClick={() => handleVerifyProduct()}
                    disabled={isVerifyingProduct}
                  >
                    {isVerifyingProduct ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>

                {productVerified !== null && (
                  <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
                    productVerified 
                      ? 'bg-success/10 border border-success' 
                      : 'bg-destructive/10 border border-destructive'
                  }`}>
                    {productVerified ? (
                      <>
                        <CheckCircle className="h-6 w-6 text-success flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-success">Authentic Product ✓</div>
                          <div className="text-sm text-muted-foreground">
                            This product is verified and part of batch {batchInfo.code}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-6 w-6 text-destructive flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-destructive">Verification Failed ✗</div>
                          <div className="text-sm text-muted-foreground">
                            Product could not be verified in this batch
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* Supply Chain Journey */}
            <BatchMovementCard movements={movements} />

            {/* Footer branding */}
            <div className="text-center py-4 text-sm text-muted-foreground border-t">
              <p>🔗 Powered by <span className="font-semibold text-primary">ChainTrack</span></p>
              <p className="text-xs mt-1">Blockchain-verified supply chain transparency</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Consumer;
