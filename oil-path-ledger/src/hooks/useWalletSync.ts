import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMetaMask } from './useMetaMask';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useWalletSync = () => {
  const { user } = useAuth();
  const { account, isConnected } = useMetaMask();
  const { toast } = useToast();

  useEffect(() => {
    const syncWalletAddress = async () => {
      if (!user || !isConnected || !account) return;

      try {
        const { error } = await supabase
          .from('users')
          .update({ wallet_address: account })
          .eq('id', user.id);

        if (error) {
          console.error('Failed to sync wallet address:', error);
        }
      } catch (error) {
        console.error('Error syncing wallet address:', error);
      }
    };

    syncWalletAddress();
  }, [user, account, isConnected]);

  return { account, isConnected };
};