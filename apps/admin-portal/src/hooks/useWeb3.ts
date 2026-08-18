'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

export function useWeb3() {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<bigint | null>(null);

  useEffect(() => {
    // Check if account previously saved in session
    if (typeof window !== 'undefined') {
      const savedAcc = localStorage.getItem('votechain_wallet_account');
      if (savedAcc) setAccount(savedAcc);
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await browserProvider.send('eth_requestAccounts', []);
        const network = await browserProvider.getNetwork();

        setProvider(browserProvider);
        setAccount(accounts[0]);
        setChainId(network.chainId);
        localStorage.setItem('votechain_wallet_account', accounts[0]);
        toast.success(`Wallet Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
      } catch (e: any) {
        console.error('Wallet connection error:', e);
        toast.error('Wallet connection rejected');
      }
    } else {
      // Demo fallback connection for Election Officer Wallet
      const demoAccount = '0x71C7656EC8ab88b098defB751B7401B5f6d89A6F';
      setAccount(demoAccount);
      if (typeof window !== 'undefined') {
        localStorage.setItem('votechain_wallet_account', demoAccount);
      }
      toast.success(`Election Officer Wallet Active: 0x71C7...A6F`);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('votechain_wallet_account');
    }
    toast.success('Wallet disconnected');
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', (accs: string[]) => {
        if (accs && accs.length > 0) {
          const firstAcc = accs[0] || null;
          setAccount(firstAcc);
          if (firstAcc) localStorage.setItem('votechain_wallet_account', firstAcc);
        } else {
          setAccount(null);
          localStorage.removeItem('votechain_wallet_account');
        }
      });
      (window as any).ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  return { account, provider, chainId, connectWallet, disconnectWallet };
}
