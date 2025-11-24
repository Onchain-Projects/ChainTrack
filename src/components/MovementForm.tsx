import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMetaMask } from "@/hooks/useMetaMask";
import { ChainTrackContract, getPolygonscanUrl } from "@/lib/blockchain";
import { supabase } from "@/integrations/supabase/client";
import { Truck, Loader2, Shield, Info, Package, CheckCircle, XCircle, ExternalLink, Hash, Calendar, User, MapPin } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { normalizeAddress } from "@/lib/ethUtils";
import { useAuth } from "@/contexts/AuthContext";

interface MovementFormProps {
  onMovementCreated?: () => void;
  hideTitle?: boolean; // Option to hide title when used in dialog
}

export const MovementForm = ({ onMovementCreated, hideTitle = false }: MovementFormProps) => {
  const { toast } = useToast();
  const { signer, isConnected, account } = useMetaMask();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [batches, setBatches] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    batchId: '',
    fromUser: '',
    toUser: '',
    location: '',
  });
  const [currentOwner, setCurrentOwner] = useState<string | null>(null);
  const [isLoadingOwner, setIsLoadingOwner] = useState(false);
  const [batchVerification, setBatchVerification] = useState<{
    batchDetails: any;
    blockchainVerified: boolean | null;
    movements: any[];
    isLoading: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      console.log('🔄 MovementForm: Starting to fetch data...');
      setIsFetchingData(true);
      try {
        // Fetch available batches
        console.log('📦 Fetching batches...');
        const { data: batchData, error: batchError } = await supabase
          .from('batches')
          .select('id, batch_code, product_type')
          .order('created_at', { ascending: false });

        if (batchError) {
          console.error('❌ Error fetching batches:', batchError);
          toast({
            title: "Error Loading Batches",
            description: batchError.message,
            variant: "destructive",
          });
        } else {
          console.log('✅ Batches fetched:', batchData?.length || 0, batchData);
          setBatches(batchData || []);
          if (batchData && batchData.length === 0) {
            console.warn('⚠️ No batches found');
            toast({
              title: "No Batches Available",
              description: "Please create a batch first before recording movements.",
              variant: "default",
            });
          }
        }

        // Fetch users with wallet addresses
        console.log('👥 Fetching users...');
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, email, role, wallet_address')
          .order('name');

        if (userError) {
          console.error('❌ Error fetching users:', userError);
          toast({
            title: "Error Loading Users",
            description: userError.message,
            variant: "destructive",
          });
        } else {
          console.log('✅ Users fetched:', userData?.length || 0, userData);
          setUsers(userData || []);
          if (userData && userData.length === 0) {
            console.warn('⚠️ No users found');
            toast({
              title: "No Users Available",
              description: "Please ensure users are registered in the system.",
              variant: "default",
            });
          }
        }
      } catch (error) {
        console.error('❌ Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load form data",
          variant: "destructive",
        });
      } finally {
        setIsFetchingData(false);
        console.log('✅ MovementForm: Data fetch complete');
      }
    };

    fetchData();
  }, [toast]);

  // Function to get current owner/custodian of a batch
  const getCurrentOwner = async (batchId: string) => {
    if (!batchId) {
      setCurrentOwner(null);
      setFormData(prev => ({ ...prev, fromUser: '' }));
      return;
    }

    setIsLoadingOwner(true);
    try {
      // Get batch info to find manufacturer
      const { data: batchData, error: batchError } = await supabase
        .from('batches')
        .select('id, manufacturer_id, batch_code')
        .eq('id', batchId)
        .single();

      if (batchError || !batchData) {
        console.error('Error fetching batch:', batchError);
        setIsLoadingOwner(false);
        return;
      }

      // Get all movements for this batch, ordered by timestamp (newest first)
      const { data: movements, error: movementsError } = await supabase
        .from('movements')
        .select('to_user, timestamp')
        .eq('batch_id', batchId)
        .order('timestamp', { ascending: false })
        .limit(1);

      let ownerId: string;

      if (movementsError || !movements || movements.length === 0) {
        // No movements exist - current owner is the manufacturer
        console.log('📦 No movements found, owner is manufacturer');
        ownerId = batchData.manufacturer_id;
      } else {
        // Latest movement's "to_user" is the current owner
        console.log('📦 Latest movement found, owner is:', movements[0].to_user);
        ownerId = movements[0].to_user;
      }

      setCurrentOwner(ownerId);
      setFormData(prev => ({ ...prev, fromUser: ownerId }));
      console.log('✅ Current owner set to:', ownerId);
    } catch (error) {
      console.error('❌ Error getting current owner:', error);
    } finally {
      setIsLoadingOwner(false);
    }
  };

  // When batch is selected, automatically determine current owner and verify batch
  const handleBatchChange = async (batchId: string) => {
    console.log('📦 Batch selected:', batchId);
    setFormData(prev => ({ ...prev, batchId, fromUser: '', toUser: '' }));
    setBatchVerification({ batchDetails: null, blockchainVerified: null, movements: [], isLoading: true });
    
    // Get current owner
    await getCurrentOwner(batchId);
    
    // Verify batch details
    await verifyBatchDetails(batchId);
  };

  // Verify batch details before shipment
  const verifyBatchDetails = async (batchId: string) => {
    try {
      // Fetch batch details
      const { data: batchData, error: batchError } = await supabase
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

      if (batchError || !batchData) {
        console.error('Error fetching batch details:', batchError);
        setBatchVerification(null);
        return;
      }

      // Fetch movement history
      const { data: movements, error: movementsError } = await supabase
        .from('movements')
        .select(`
          *,
          from_user:users!movements_from_user_fkey (name, role),
          to_user:users!movements_to_user_fkey (name, role)
        `)
        .eq('batch_id', batchId)
        .order('timestamp', { ascending: true });

      // Verify on blockchain (read-only, no wallet needed)
      let blockchainVerified: boolean | null = null;
      try {
        const { getReadOnlyProvider } = await import("@/lib/blockchain");
        const readOnlyProvider = getReadOnlyProvider();
        const contract = new ChainTrackContract(readOnlyProvider);
        const blockchainBatch = await contract.getBatch(batchData.batch_code);
        
        if (blockchainBatch && blockchainBatch.exists) {
          blockchainVerified = 
            blockchainBatch.batchCode === batchData.batch_code &&
            blockchainBatch.productType === batchData.product_type &&
            blockchainBatch.merkleRoot.toLowerCase() === (batchData.merkle_root || '').toLowerCase();
        } else {
          blockchainVerified = false;
        }
      } catch (blockchainError) {
        console.error('Blockchain verification error:', blockchainError);
        blockchainVerified = false;
      }

      setBatchVerification({
        batchDetails: batchData,
        blockchainVerified,
        movements: movements || [],
        isLoading: false
      });

      console.log('✅ Batch verification complete:', {
        verified: blockchainVerified,
        movements: movements?.length || 0
      });
    } catch (error) {
      console.error('❌ Error verifying batch:', error);
      setBatchVerification(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 MovementForm: Form submitted', formData);
    
    // Validate form fields
    if (!formData.batchId) {
      console.warn('⚠️ Validation failed: No batch selected');
      toast({
        title: "Validation Error",
        description: "Please select a batch",
        variant: "destructive",
      });
      return;
    }

    if (!formData.fromUser) {
      toast({
        title: "Validation Error",
        description: "Current owner not determined. Please select a batch first.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.toUser) {
      toast({
        title: "Validation Error",
        description: "Please select a recipient",
        variant: "destructive",
      });
      return;
    }

    if (formData.fromUser === formData.toUser) {
      toast({
        title: "Validation Error",
        description: "Sender and recipient cannot be the same",
        variant: "destructive",
      });
      return;
    }

    if (!formData.location.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a location",
        variant: "destructive",
      });
      return;
    }
    
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Create contract instance (reused for verification and movement recording)
      const normalizedAddress = normalizeAddress(account);
      const contract = new ChainTrackContract(signer);
      
      // Verify user is registered on blockchain (distributor or retailer)
      const [isDistributor, isRetailer] = await Promise.all([
        contract.isDistributor(normalizedAddress),
        contract.isRetailer(normalizedAddress),
      ]);

      if (!isDistributor && !isRetailer) {
        throw new Error("You must be registered as a distributor or retailer on the blockchain to record movements. Please complete blockchain registration first.");
      }

      // Security check: Verify the logged-in user is either the sender or receiver
      // This prevents unauthorized users from recording movements
      if (user && formData.fromUser !== user.id && formData.toUser !== user.id) {
        throw new Error("Security Error: You can only record movements where you are either the sender or receiver.");
      }

      // Security check: Verify batch is verified on blockchain before allowing movement
      if (batchVerification && !batchVerification.isLoading && !batchVerification.blockchainVerified) {
        const proceed = window.confirm(
          "⚠️ WARNING: This batch is not verified on the blockchain.\n\n" +
          "This could indicate:\n" +
          "• Batch was not properly recorded on blockchain\n" +
          "• Data mismatch between database and blockchain\n" +
          "• Potential security issue\n\n" +
          "Do you want to proceed anyway? (Not recommended)"
        );
        if (!proceed) {
          throw new Error("Movement cancelled: Batch verification required");
        }
      }

      // Get batch info
      const selectedBatch = batches.find(batch => batch.id === formData.batchId);
      if (!selectedBatch) {
        throw new Error("Batch not found");
      }

      // First save to Supabase
      const { data: movementData, error: dbError } = await supabase
        .from('movements')
        .insert({
          batch_id: formData.batchId,
          from_user: formData.fromUser,
          to_user: formData.toUser,
          location: formData.location,
          status: 'created',
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Get user wallet addresses for blockchain recording
      const fromUserData = users.find(u => u.id === formData.fromUser);
      const toUserData = users.find(u => u.id === formData.toUser);
      
      // Use actual wallet addresses from user profiles
      if (!fromUserData?.wallet_address) {
        throw new Error(`User ${fromUserData?.name || 'sender'} does not have a wallet address. Please connect wallet and sync.`);
      }
      
      if (!toUserData?.wallet_address) {
        throw new Error(`User ${toUserData?.name || 'recipient'} does not have a wallet address. Please ask them to connect wallet.`);
      }
      
      const fromAddress = normalizeAddress(fromUserData.wallet_address);
      const toAddress = normalizeAddress(toUserData.wallet_address);
      
      // Then record on blockchain (reuse contract instance)
      const result = await contract.recordMovement(
        selectedBatch.batch_code,
        fromAddress,
        toAddress,
        formData.location
      );

      if (result.success) {
        // Update Supabase with blockchain hash
        await supabase
          .from('movements')
          .update({ blockchain_hash: result.hash })
          .eq('id', movementData.id);

        toast({
          title: "Movement Recorded Successfully",
          description: `Movement for batch ${selectedBatch.batch_code} recorded on blockchain`,
        });

        // Reset form
        setFormData({
          batchId: '',
          fromUser: '',
          toUser: '',
          location: '',
        });

        onMovementCreated?.();
      } else {
        throw new Error(result.error || "Failed to record movement on blockchain");
      }
    } catch (error) {
      console.error('Error recording movement:', error);
      
      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        if (error.message.includes("Invalid address")) {
          errorMessage = "Invalid wallet address format. Please check and retry.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error Recording Movement",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  console.log('🎨 MovementForm: Rendering', { 
    isFetchingData, 
    batchesCount: batches.length, 
    usersCount: users.length,
    formData 
  });

  return (
    <div className="space-y-4">
      {!hideTitle && (
        <div className="flex items-center space-x-3 mb-6">
          <Truck className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Record Movement</h2>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isFetchingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span className="text-muted-foreground">Loading form data...</span>
          </div>
        ) : (
          <>
            <div>
              <Label htmlFor="batchId">Select Batch</Label>
              <Select 
                value={formData.batchId || undefined} 
                onValueChange={handleBatchChange}
              >
                <SelectTrigger 
                  id="batchId" 
                  className="w-full"
                  onClick={() => console.log('🖱️ Batch trigger clicked')}
                >
                  <SelectValue placeholder="Select a batch" />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  {batches.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No batches available
                    </div>
                  ) : (
                    batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.batch_code} - {batch.product_type}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Batch Verification Panel - Shows when batch is selected */}
            {formData.batchId && batchVerification && (
              <Collapsible defaultOpen={true}>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>Verify Batch Details Before Shipment</span>
                      {batchVerification.isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      ) : batchVerification.blockchainVerified ? (
                        <CheckCircle className="h-4 w-4 text-success ml-2" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive ml-2" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">Click to expand/collapse</span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <Card className="border-2">
                    <ScrollArea className="max-h-[400px]">
                      <CardContent className="p-4 space-y-4">
                      {/* Blockchain Verification Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="font-semibold text-sm">Blockchain Verification</div>
                            <div className="text-xs text-muted-foreground">
                              {batchVerification.isLoading 
                                ? "Verifying..." 
                                : batchVerification.blockchainVerified 
                                  ? "Verified on blockchain" 
                                  : "Not verified"}
                            </div>
                          </div>
                        </div>
                        <Badge variant={batchVerification.blockchainVerified ? "default" : "destructive"} className="flex-shrink-0">
                          {batchVerification.isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : batchVerification.blockchainVerified ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {batchVerification.isLoading 
                            ? "Verifying..." 
                            : batchVerification.blockchainVerified 
                              ? "Verified" 
                              : "Not Verified"}
                        </Badge>
                      </div>

                      {/* Batch Details */}
                      {batchVerification.batchDetails && (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Batch Code</div>
                            <div className="font-mono text-xs font-semibold break-all">{batchVerification.batchDetails.batch_code}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Product Type</div>
                            <div className="font-semibold text-sm">{batchVerification.batchDetails.product_type}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Manufacturer</div>
                            <div className="font-semibold text-sm">{batchVerification.batchDetails.manufacturer?.name || 'Unknown'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Quantity</div>
                            <div className="font-semibold text-sm">{batchVerification.batchDetails.quantity} Units</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Production</div>
                            <div className="font-semibold text-xs">
                              {new Date(batchVerification.batchDetails.production_date).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Expiry</div>
                            <div className="font-semibold text-xs">
                              {new Date(batchVerification.batchDetails.expiry_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Merkle Root */}
                      {batchVerification.batchDetails?.merkle_root && (
                        <div className="pt-3 border-t">
                          <div className="flex items-center gap-2 mb-2">
                            <Hash className="h-3 w-3 text-primary" />
                            <span className="text-xs font-semibold">Merkle Root</span>
                          </div>
                          <code className="text-[10px] bg-muted p-2 rounded block break-all max-h-16 overflow-y-auto">
                            {batchVerification.batchDetails.merkle_root}
                          </code>
                        </div>
                      )}

                      {/* Movement History */}
                      {batchVerification.movements.length > 0 && (
                        <div className="pt-3 border-t">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-3 w-3 text-primary" />
                            <span className="text-xs font-semibold">Movement History ({batchVerification.movements.length})</span>
                          </div>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {batchVerification.movements.map((movement: any, index: number) => (
                              <div key={index} className="p-2 bg-muted/50 rounded text-xs">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium">#{index + 1}</span>
                                  {movement.blockchain_hash && (
                                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                                      <Shield className="h-2 w-2 mr-0.5" />
                                      On-Chain
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-muted-foreground space-y-0.5">
                                  <div className="text-[10px]">From: {movement.from_user?.name || 'Unknown'}</div>
                                  <div className="text-[10px]">To: {movement.to_user?.name || 'Unknown'}</div>
                                  <div className="text-[10px]">📍 {movement.location}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Blockchain Transaction Link */}
                      {batchVerification.batchDetails?.blockchain_hash && (
                        <div className="pt-3 border-t">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => window.open(getPolygonscanUrl(batchVerification.batchDetails.blockchain_hash), '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View on Blockchain
                          </Button>
                        </div>
                      )}

                      {/* Warning if not verified */}
                      {!batchVerification.isLoading && !batchVerification.blockchainVerified && (
                        <Alert variant="destructive" className="mt-3">
                          <XCircle className="h-3 w-3" />
                          <AlertDescription className="text-xs">
                            <strong>Warning:</strong> Batch not verified on blockchain. Verify details before proceeding.
                          </AlertDescription>
                        </Alert>
                      )}
                      </CardContent>
                    </ScrollArea>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromUser">
                  From User (Current Owner)
                  {isLoadingOwner && (
                    <span className="ml-2 text-xs text-muted-foreground">(Loading...)</span>
                  )}
                </Label>
                <Select 
                  value={formData.fromUser || undefined} 
                  onValueChange={(value) => {
                    // Prevent manual changes - this should be auto-set
                    console.warn('⚠️ Attempted to manually change From User - this is auto-determined');
                    toast({
                      title: "Cannot Change",
                      description: "From User is automatically determined based on batch ownership",
                      variant: "default",
                    });
                  }}
                  disabled={!formData.batchId || isLoadingOwner}
                >
                  <SelectTrigger 
                    id="fromUser" 
                    className="w-full bg-muted"
                    title="Automatically determined - cannot be changed"
                  >
                    <SelectValue placeholder={isLoadingOwner ? "Loading current owner..." : "Select batch first"} />
                  </SelectTrigger>
                  <SelectContent className="z-[200]">
                    {formData.fromUser && users.find(u => u.id === formData.fromUser) ? (
                      <SelectItem value={formData.fromUser}>
                        {users.find(u => u.id === formData.fromUser)?.name} ({users.find(u => u.id === formData.fromUser)?.role})
                      </SelectItem>
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {!formData.batchId ? "Select a batch first" : "Loading..."}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="toUser">To User (Receiver)</Label>
                <Select 
                  value={formData.toUser || undefined} 
                  onValueChange={(value) => {
                    console.log('👤 To user selected:', value);
                    setFormData(prev => ({ ...prev, toUser: value }));
                  }}
                >
                  <SelectTrigger 
                    id="toUser" 
                    className="w-full"
                    onClick={() => console.log('🖱️ To user trigger clicked')}
                  >
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent className="z-[200]">
                    {users.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No users available
                      </div>
                    ) : (
                      users
                        .filter(u => u.id !== formData.fromUser) // Exclude current owner (can't send to yourself)
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.role})
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Distribution Center A"
                required
              />
            </div>
          </>
        )}

        <Button 
          type="submit" 
          disabled={isLoading || !isConnected || isFetchingData || batches.length === 0 || users.length === 0} 
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Recording Movement...
            </>
          ) : (
            "Record Movement"
          )}
        </Button>
        
        {!isFetchingData && (batches.length === 0 || users.length === 0) && (
          <p className="text-sm text-muted-foreground text-center">
            {batches.length === 0 && "No batches available. "}
            {users.length === 0 && "No users available. "}
            Please ensure data is available before recording movements.
          </p>
        )}
      </form>
    </div>
  );
};