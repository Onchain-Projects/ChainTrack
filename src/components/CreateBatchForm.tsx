import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMetaMask } from "@/hooks/useMetaMask";
import { ChainTrackContract } from "@/lib/blockchain";
import { supabase } from "@/integrations/supabase/client";
import { Package, Loader2, Hash, Copy, Check, Sparkles, ChevronDown } from "lucide-react";
import { MerkleTree } from "@/lib/merkleTree";
import QRCode from "qrcode";
import { normalizeAddress } from "@/lib/ethUtils";
import { getBaseUrl } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CreateBatchFormProps {
  onBatchCreated?: () => void;
  hideTitle?: boolean; // Option to hide title when used in dialog
  hideButton?: boolean; // Option to hide button (for dialog footer)
  showButtonOnly?: boolean; // Option to show only the button (for dialog footer)
}

export const CreateBatchForm = ({ onBatchCreated, hideTitle = false, hideButton = false, showButtonOnly = false }: CreateBatchFormProps) => {
  const { toast } = useToast();
  const { signer, isConnected, account } = useMetaMask();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    productType: '',
    productionDate: '',
    expiryDate: '',
    quantity: '',
  });

  const [productItems, setProductItems] = useState<string[]>([]);
  const [merkleRoot, setMerkleRoot] = useState<string>('');
  const [generatedBatchCode, setGeneratedBatchCode] = useState<string>('');
  const [showProductIds, setShowProductIds] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const generateBatchCode = (productType: string): string => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    const typeCode = productType.substring(0, 3).toUpperCase() || 'PRD';
    return `BATCH-${typeCode}-${timestamp}-${randomId}`;
  };

  const generateUniqueProductId = (productType: string, batchCode: string, index: number): string => {
    const typeCode = productType.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'PRD';
    // Extract unique parts from batch code (timestamp and random ID)
    const batchParts = batchCode.split('-');
    const batchShort = batchParts.length >= 3 ? `${batchParts[batchParts.length - 2]}-${batchParts[batchParts.length - 1]}` : batchCode;
    // Generate a unique suffix incorporating index for guaranteed uniqueness
    // Use a combination of index and random value to ensure uniqueness
    const seed = (index + 1) * 1000 + Math.floor(Math.random() * 1000);
    const randomSuffix = seed.toString(36).toUpperCase().padStart(6, '0').substring(0, 6);
    // Format: PROD-TIMESTAMP-RANDOM-000001-ABC123
    // Sequential number + unique suffix ensures each product ID is unique
    return `${typeCode}-${batchShort}-${String(index + 1).padStart(6, '0')}-${randomSuffix}`;
  };

  // Auto-generate product IDs when quantity changes
  useEffect(() => {
    const quantity = parseInt(formData.quantity);
    if (quantity > 0 && formData.productType.trim() !== '') {
      // Generate a temporary batch code for ID generation (will be regenerated on submit)
      const tempBatchCode = generateBatchCode(formData.productType);
      const generatedIds: string[] = [];
      
      for (let i = 0; i < quantity; i++) {
        generatedIds.push(generateUniqueProductId(formData.productType, tempBatchCode, i));
      }
      
      setProductItems(generatedIds);
    } else {
      setProductItems([]);
    }
  }, [formData.quantity, formData.productType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !signer || !account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your MetaMask wallet",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Normalize wallet address
      const normalizedAddress = normalizeAddress(account);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Create contract instance (reused for verification and batch creation)
      const contract = new ChainTrackContract(signer);
      
      // Verify user is registered as manufacturer on blockchain
      const isManufacturer = await contract.isManufacturer(normalizedAddress);
      
      if (!isManufacturer) {
        throw new Error("You must be registered as a manufacturer on the blockchain to create batches. Please complete blockchain registration first.");
      }

      // Validate quantity
      const quantity = parseInt(formData.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error("Please enter a valid quantity greater than 0");
      }

      // Generate unique batch code
      const batchCode = generateBatchCode(formData.productType);
      setGeneratedBatchCode(batchCode);

      // Generate unique product IDs based on quantity
      const generatedProductIds: string[] = [];
      for (let i = 0; i < quantity; i++) {
        generatedProductIds.push(generateUniqueProductId(formData.productType, batchCode, i));
      }
      
      const validItems = generatedProductIds;
      
      if (validItems.length === 0) {
        throw new Error("Failed to generate product identifiers");
      }

      // Generate Merkle tree and root
      const merkleTree = new MerkleTree(validItems);
      const generatedRoot = merkleTree.getRoot();
      setMerkleRoot(generatedRoot);

      // First save to Supabase
      const { data: batchData, error: dbError } = await supabase
        .from('batches')
        .insert({
          batch_code: batchCode,
          product_type: formData.productType,
          production_date: formData.productionDate,
          expiry_date: formData.expiryDate,
          quantity: parseFloat(formData.quantity),
          manufacturer_id: user.id,
          merkle_root: generatedRoot,
        })
        .select()
        .single();

      if (dbError) {
        if (dbError.code === '23505') {
          throw new Error("Batch code already exists. Please try again.");
        }
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Then create on blockchain with Merkle root (reuse contract instance)
      const result = await contract.createBatch(
        batchCode,
        formData.productType,
        new Date(formData.productionDate),
        new Date(formData.expiryDate),
        generatedRoot
      );

      if (result.success) {
        // Update Supabase with blockchain hash
        await supabase
          .from('batches')
          .update({ blockchain_hash: result.hash })
          .eq('id', batchData.id);

        // Generate and store QR codes + Merkle proofs for each product item
        // Use utility function to get base URL (supports environment variable)
        const baseUrl = getBaseUrl();
        console.log('🔗 Generating QR codes with base URL:', baseUrl);
        
        for (const item of validItems) {
          // Generate Merkle proof for this product
          const merkleProof = merkleTree.getProof(item);
          
          // Use absolute URL for QR codes to ensure they work when scanned from any device
          const verifyUrl = `${baseUrl}/verify?productId=${encodeURIComponent(item)}&batchCode=${encodeURIComponent(batchCode)}`;
          
          console.log(`📱 QR Code URL for ${item}:`, verifyUrl);
          
          // Generate QR code as data URL
          const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
            width: 400,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });

          // Convert data URL to blob
          const response = await fetch(qrDataUrl);
          const blob = await response.blob();

          // Upload to Supabase storage
          const fileName = `${batchData.id}/${item.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
          const { error: uploadError } = await supabase.storage
            .from('qr-codes')
            .upload(fileName, blob, {
              contentType: 'image/png',
              upsert: true
            });

          if (uploadError) {
            console.error('Error uploading QR code:', uploadError);
            continue;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('qr-codes')
            .getPublicUrl(fileName);

          // Store product in database with QR code URL and Merkle proof
          const { error: productError } = await supabase
            .from('products')
            .insert({
              batch_id: batchData.id,
              product_identifier: item,
              qr_code_url: urlData.publicUrl,
              merkle_proof: {
                leaf: merkleProof.leaf,
                proof: merkleProof.proof,
                root: merkleProof.root
              }
            });

          if (productError) {
            console.error(`Error inserting product ${item}:`, productError);
            // Continue with other products even if one fails
            // But log the error for debugging
          }
        }

        toast({
          title: "Batch Created Successfully",
          description: `Batch ${batchCode} created with ${validItems.length} QR codes generated`,
        });

        // Reset form
        setFormData({
          productType: '',
          productionDate: '',
          expiryDate: '',
          quantity: '',
        });
        setProductItems([]);
        setMerkleRoot('');
        setGeneratedBatchCode('');
        setShowProductIds(false);

        onBatchCreated?.();
      } else {
        throw new Error(result.error || "Failed to create batch on blockchain");
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      
      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        if (error.message.includes("Invalid address")) {
          errorMessage = "Invalid wallet address format. Please check and retry.";
        } else if (error.message.includes("Batch code already exists")) {
          errorMessage = "Batch code already exists. Please try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error Creating Batch",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (showButtonOnly) {
    return (
      <form onSubmit={handleSubmit} id="create-batch-form">
        <Button 
          type="submit" 
          disabled={isLoading || !isConnected} 
          className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Creating Batch...
            </>
          ) : (
            <>
              <Package className="h-5 w-5 mr-2" />
              Create Batch
            </>
          )}
        </Button>
        {!isConnected && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Please connect your wallet to create a batch
          </p>
        )}
      </form>
    );
  }

  return (
    <div className={hideTitle ? "" : "p-6"}>
      <form onSubmit={handleSubmit} className="space-y-5" id="create-batch-form">
        <div className="space-y-2">
          <Label htmlFor="productType" className="text-sm font-medium">Product Type</Label>
          <Input
            id="productType"
            name="productType"
            placeholder="e.g., OIL, Electronics, Pharmaceuticals"
            value={formData.productType}
            onChange={handleChange}
            required
            className="h-10"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="productionDate" className="text-sm font-medium">Production Date</Label>
            <Input
              id="productionDate"
              name="productionDate"
              type="date"
              value={formData.productionDate}
              onChange={handleChange}
              required
              className="h-10"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expiryDate" className="text-sm font-medium">Expiry Date</Label>
            <Input
              id="expiryDate"
              name="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={handleChange}
              required
              className="h-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity" className="text-sm font-medium">Quantity</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="e.g., 1000"
            required
            className="h-10"
          />
        </div>

        {productItems.length > 0 && (
          <Collapsible open={showProductIds} onOpenChange={setShowProductIds}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-between text-sm text-muted-foreground hover:text-foreground"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>{productItems.length} product IDs will be generated</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${showProductIds ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 p-3 bg-muted/30 rounded-lg border space-y-2 max-h-48 overflow-y-auto">
                {productItems.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex gap-2 items-center text-xs">
                    <span className="text-muted-foreground font-mono">{index + 1}.</span>
                    <code className="text-xs font-mono flex-1 break-all">{item}</code>
                  </div>
                ))}
                {productItems.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center pt-1">
                    ... and {productItems.length - 5} more
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        <div className="pt-2">
          <Button 
            type="submit" 
            disabled={isLoading || !isConnected} 
            className="w-full h-10 text-base font-medium"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Batch...
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Create Batch
              </>
            )}
          </Button>
          {!isConnected && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Please connect your wallet to create a batch
            </p>
          )}
        </div>
      </form>
    </div>
  );
};
