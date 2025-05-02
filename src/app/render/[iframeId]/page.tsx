"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function RenderIframePage() {
  const params = useParams();
  const iframeId = params.iframeId as string | undefined;
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!iframeId) {
      setError("Iframe ID is missing.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Attempt to retrieve the stored srcdoc from localStorage
      // This relies on the main page having stored the data.
      const storedData = localStorage.getItem('iframeData'); // NOTE: This is a temporary simplification
      if (storedData) {
        const allIframes: Array<{ id: string; srcdoc: string }> = JSON.parse(storedData);
        const foundIframe = allIframes.find(iframe => iframe.id === iframeId);

        if (foundIframe) {
           // Set the raw srcdoc content directly
           setHtmlContent(foundIframe.srcdoc);
        } else {
          setError(`Iframe with ID "${iframeId}" not found.`);
           toast({ variant: 'destructive', title: 'Error', description: `Iframe with ID "${iframeId}" not found.` });
        }
      } else {
        setError("No iframe data found. Please re-upload the file.");
         toast({ variant: 'destructive', title: 'Error', description: 'No iframe data found. Please re-upload the file.' });
      }
    } catch (err) {
      console.error("Error loading iframe content:", err);
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      setError(`Failed to load iframe content: ${message}`);
      toast({ variant: 'destructive', title: 'Loading Error', description: `Failed to load content: ${message}` });
    } finally {
      setIsLoading(false);
    }

  }, [iframeId, toast]);


  if (isLoading) {
    // Keep the skeleton for loading state
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (error) {
    // Keep the error display
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 border border-destructive bg-destructive/10 rounded-md">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
          <p className="text-destructive-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (htmlContent === null) { // Check specifically for null
     // Fallback if content is null after loading and no error occurred
     return (
       <div className="flex items-center justify-center min-h-screen">
         <p>No content available for this iframe.</p>
       </div>
     );
   }


  // Render the content inside an iframe using srcDoc
  // This mimics the preview environment and handles relative URLs within the content better.
  return (
    <iframe
      srcDoc={htmlContent}
      style={{ width: '100%', height: '100vh', border: 'none' }} // Basic styling to fill viewport
      title={`Rendered Content - ${iframeId}`}
      // Sandbox attribute removed completely as requested to minimize restrictions
      aria-label={`Rendered content for iframe ${iframeId}`}
    />
  );
}