'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export function useWeb3() {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<bigint | null>(null);

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await browserProvider.send('eth_requestAccounts', []);
        const network = await browserProvider.getNetwork();

        setProvider(browserProvider);
        setAccount(accounts[0]);
        setChainId(network.chainId);
      } catch (e) {
        console.error('Wallet connection error:', e);
      }
    } else {
      alert('MetaMask or Web3 wallet not detected');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', (accs: string[]) => {
        setAccount(accs[0] || null);
      });
      (window as any).ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  return { account, provider, chainId, connectWallet };
}
