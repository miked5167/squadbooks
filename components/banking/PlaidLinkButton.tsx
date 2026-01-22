'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { Loader2, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type {
  PlaidLinkOnSuccessMetadata,
  PlaidLinkOnExitMetadata,
  ExchangeTokenResponse,
} from '@/lib/types/banking';

interface PlaidLinkButtonProps {
  onSuccess?: (data: ExchangeTokenResponse, metadata: PlaidLinkOnSuccessMetadata) => void;
  onExit?: (error: Error | null, metadata?: PlaidLinkOnExitMetadata) => void;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost';
  className?: string;
  disabled?: boolean;
}

export function PlaidLinkButton({
  onSuccess,
  onExit,
  buttonText = 'Connect Bank',
  buttonVariant = 'default',
  className,
  disabled = false,
}: PlaidLinkButtonProps) {
  const { toast } = useToast();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExchanging, setIsExchanging] = useState(false);

  // Fetch Link token
  const fetchLinkToken = useCallback(async () => {
    if (linkToken) return; // Already have a token

    setIsLoading(true);
    try {
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          teamId: 'demo-team',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create Link token');
      }

      const data = await response.json();
      setLinkToken(data.link_token);
    } catch (error) {
      console.error('Error fetching Link token:', error);
      toast({
        variant: 'destructive',
        title: 'Connection Error',
        description: 'Failed to initialize bank connection. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [linkToken, toast]);

  // Only fetch link token when user clicks the button, not on mount
  // This prevents console errors when Plaid credentials aren't configured

  // Handle successful bank connection
  const handleOnSuccess = useCallback(
    async (public_token: string, metadata: any) => {
      console.log('🎉 Plaid Link success!', metadata);
      setIsExchanging(true);

      try {
        // Exchange public token for access token
        const response = await fetch('/api/plaid/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publicToken: public_token,
            metadata,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to exchange token');
        }

        const data: ExchangeTokenResponse = await response.json();

        toast({
          title: 'Bank Connected!',
          description: `Successfully connected to ${metadata.institution?.name || 'your bank'}.`,
        });

        // Call parent success handler
        if (onSuccess) {
          onSuccess(data, metadata);
        }
      } catch (error) {
        console.error('Token exchange error:', error);
        toast({
          variant: 'destructive',
          title: 'Connection Failed',
          description: 'Bank was connected but we couldn\'t complete the setup. Please try again.',
        });
      } finally {
        setIsExchanging(false);
      }
    },
    [onSuccess, toast]
  );

  // Handle Link exit (user closed or error occurred)
  const handleOnExit = useCallback(
    (error: Error | null, metadata: PlaidLinkOnExitMetadata) => {
      console.log('Plaid Link exit', { error, metadata });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Connection Cancelled',
          description: error.message || 'Bank connection was not completed.',
        });
      }

      if (onExit) {
        onExit(error, metadata);
      }
    },
    [onExit, toast]
  );

  // Initialize Plaid Link
  const config: Parameters<typeof usePlaidLink>[0] = {
    token: linkToken,
    onSuccess: handleOnSuccess,
    onExit: handleOnExit,
  };

  const { open, ready } = usePlaidLink(config);

  // Handle button click - fetch token first if needed
  const handleClick = async () => {
    if (!linkToken) {
      await fetchLinkToken();
      return; // Token will be set, user needs to click again
    }
    if (ready) {
      open();
    }
  };

  const isButtonDisabled = disabled || isLoading || isExchanging;
  const showLoading = isLoading || isExchanging;

  return (
    <Button
      variant={buttonVariant}
      className={className}
      onClick={handleClick}
      disabled={isButtonDisabled}
    >
      {showLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isExchanging ? 'Connecting...' : 'Loading...'}
        </>
      ) : (
        <>
          <Building2 className="mr-2 h-4 w-4" />
          {buttonText}
        </>
      )}
    </Button>
  );
}
