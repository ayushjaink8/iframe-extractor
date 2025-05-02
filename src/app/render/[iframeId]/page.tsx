"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useIframeDataStore } from '@/store/iframeStore'; // Import the Zustand store
import type { IframeData } from '@/types/iframeData';

// Function to decode HTML entities using the DOM
const decodeHtmlEntities = (html: string): string => {
  if (typeof document === 'undefined') {
    // Cannot use DOM on the server
    return html;
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = html;
    return textarea.value;
  } catch (e) {
    console.error("Error decoding HTML entities:", e);
    return html; // Return original string on error
  }
};


export default function RenderIframePage() {
  const params = useParams();
  const iframeId = params.iframeId as string | undefined;
  const [srcdocContent, setSrcdocContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Access the store, including the hydration status if available/needed
  // The `persist` middleware handles rehydration automatically, but we might need to wait
  const { getIframeById } = useIframeDataStore();

  useEffect(() => {
    if (!iframeId) {
      setError("Iframe ID is missing.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Zustand's persist middleware rehydrates asynchronously.
    // We need to ensure hydration is complete before accessing the store.
    // A common pattern is to use a short delay or listen to rehydration status if the library provides it.
    // Let's try a simple check/retry approach.
    const checkStoreAndLoadData = () => {
      try {
        const foundIframe = getIframeById(iframeId); // Use the store's selector function

        if (foundIframe) {
          let processedSrcdoc = decodeHtmlEntities(foundIframe.srcdoc);
          setSrcdocContent(processedSrcdoc);
          setError(null); // Clear any previous error
          setIsLoading(false); // Data loaded
        } else {
          // If store is rehydrated but item not found
          setError(`Iframe with ID "${iframeId}" not found in store.`);
          toast({ variant: 'destructive', title: 'Error', description: `Iframe with ID "${iframeId}" not found. Please re-upload the file on the main page.` });
          setIsLoading(false); // Stop loading, show error
        }
      } catch (err) {
        console.error("Error loading iframe content from store:", err);
        const message = err instanceof Error ? err.message : "An unknown error occurred";
        setError(`Failed to load iframe content: ${message}`);
        toast({ variant: 'destructive', title: 'Loading Error', description: `Failed to load content: ${message}` });
        setIsLoading(false); // Stop loading on error
      }
    };

    // Wait for Zustand to potentially rehydrate from localStorage
    // This uses setTimeout as a simple way to delay execution slightly.
    // A more robust solution might involve Zustand's `onRehydrateStorage` or checking a hydration flag.
    const hydrationTimeout = setTimeout(checkStoreAndLoadData, 100); // Wait 100ms

    // Cleanup function to clear the timeout if the component unmounts
    return () => clearTimeout(hydrationTimeout);

  }, [iframeId, getIframeById, toast]); // Added getIframeById to dependencies


  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 border border-destructive bg-destructive/10 rounded-md">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
          <p className="text-destructive-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (srcdocContent === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>No content available for this iframe.</p>
      </div>
    );
  }


  // Render the content directly using dangerouslySetInnerHTML
  // Add suppressHydrationWarning to handle potential minor mismatches
  // that might arise from browser extensions or the content itself.
  return (

    <div dangerouslySetInnerHTML={{ __html: srcdocContent }}
      aria-label={`Rendered content for iframe ${iframeId}`}
      style={{ width: '100%', height: '100%' }}
    >
    </div>
);
}
