import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getAmoyNetworkConfig, validateAmoyNetwork } from '@/lib/blockchain';

export interface MetaMaskState {
  isConnected: boolean;
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  chainId: number | null;
  isLoading: boolean;
  error: string | null;
}

export const useMetaMask = () => {
  const [state, setState] = useState<MetaMaskState>({
    isConnected: false,
    account: null,
    provider: null,
    signer: null,
    chainId: null,
    isLoading: false,
    error: null,
  });

  const checkConnection = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      setState(prev => ({
        ...prev,
        error: 'MetaMask not installed. Please install MetaMask browser extension.',
      }));
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
        const network = await provider.getNetwork();
        const signer = await provider.getSigner();
        
        setState(prev => ({
          ...prev,
          isConnected: true,
          account: accounts[0].address,
          provider,
          signer,
          chainId: Number(network.chainId),
          error: null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isConnected: false,
          account: null,
          provider: null,
          signer: null,
          chainId: null,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to check wallet connection',
        isConnected: false,
        account: null,
        provider: null,
        signer: null,
        chainId: null,
      }));
    }
  }, []);

  const connect = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      setState(prev => ({
        ...prev,
        error: 'MetaMask not installed. Please install MetaMask to continue.',
      }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();

      setState(prev => ({
        ...prev,
        isConnected: true,
        account: address,
        provider,
        signer,
        chainId: Number(network.chainId),
        isLoading: false,
        error: null,
      }));

      return true;
    } catch (error: any) {
      let errorMessage = 'Failed to connect to MetaMask';
      
      if (error.code === 4001) {
        errorMessage = 'Connection rejected by user';
      } else if (error.code === -32002) {
        errorMessage = 'Connection request already pending';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return false;
    }
  }, []);

  const switchToPolygonAmoy = useCallback(async () => {
    if (!window.ethereum) return false;

    const networkConfig = getAmoyNetworkConfig();
    
    try {
      // First try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }],
      });
      
      // Verify the switch by validating the network
      const isValid = await validateAmoyNetwork();
      if (isValid) {
        await checkConnection(); // Refresh connection state
        return true;
      }
      
      return false;
    } catch (error: any) {
      // If network doesn't exist, add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [networkConfig],
          });
          
          // Verify the addition and switch
          const isValid = await validateAmoyNetwork();
          if (isValid) {
            await checkConnection(); // Refresh connection state
            return true;
          }
          
          return false;
        } catch (addError) {
          console.error('Failed to add Amoy network:', addError);
          return false;
        }
      }
      console.error('Failed to switch network:', error);
      return false;
    }
  }, [checkConnection]);

  useEffect(() => {
    checkConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', checkConnection);
      window.ethereum.on('chainChanged', checkConnection);

      return () => {
        window.ethereum.removeListener('accountsChanged', checkConnection);
        window.ethereum.removeListener('chainChanged', checkConnection);
      };
    }
  }, [checkConnection]);

  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      account: null,
      provider: null,
      signer: null,
      chainId: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    connect,
    switchToPolygonAmoy,
    disconnect,
  };
};