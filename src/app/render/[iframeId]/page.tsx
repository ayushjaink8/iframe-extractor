"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// Function to remove CSP meta tags from HTML string - Improved Regex
const removeCspMetaTags = (html: string): string => {
    // Remove <meta http-equiv="Content-Security-Policy" ...> tags
    // More robust regex handling various attribute orders and quotes
    const cspHttpEquivRegex = /<meta\s+[^>]*?http-equiv\s*=\s*["']?Content-Security-Policy["']?[^>]*?>/gi;
    let cleanedHtml = html.replace(cspHttpEquivRegex, '');

    // Also remove potential <meta name="Content-Security-Policy" ...>
    const cspNameRegex = /<meta\s+[^>]*?name\s*=\s*["']?Content-Security-Policy["']?[^>]*?>/gi;
    cleanedHtml = cleanedHtml.replace(cspNameRegex, '');

    return cleanedHtml;
};

// Function to add a <base> tag inside the <head> or create a <head> if needed
const ensureBaseTag = (html: string): string => {
    // Use the root path as the base URL. This assumes resources like CSS/JS
    // are served relative to the domain root (e.g., /auraFW, /jslibrary).
    const baseTag = '<base href="/">';

    // Avoid adding if base tag already exists
    if (/<base\s+/i.test(html)) {
        console.log("Base tag already exists, skipping insertion.");
        return html;
    }

    // Try to insert within existing <head>
    if (/<head\s*[^>]*>/i.test(html)) { // Allow attributes in <head> tag
        // Insert after <head ...> opening tag
        console.log("Inserting base tag into existing head.");
        return html.replace(/(<head\s*[^>]*>)/i, `$1\n${baseTag}`);
    } else {
        // No <head>, try to insert before <body> or <html>, or prepend if neither exist
        if (/<body\s*[^>]*>/i.test(html)) { // Allow attributes in <body>
             console.log("Creating head and inserting base tag before body.");
             return html.replace(/(<body\s*[^>]*>)/i, `<head>\n${baseTag}\n</head>\n$1`);
        } else if (/<html\s*[^>]*>/i.test(html)) { // Allow attributes in <html>
             console.log("Creating head and inserting base tag after html.");
             return html.replace(/(<html\s*[^>]*>)/i, `$1\n<head>\n${baseTag}\n</head>`);
        } else {
            // If no html or body tag found, just prepend (might be a fragment)
             // Wrap the fragment in basic HTML structure along with the base tag
             console.log("Wrapping fragment and inserting base tag.");
             return `<!DOCTYPE html>\n<html>\n<head>\n${baseTag}\n<meta charset="UTF-8">\n<title>Rendered Content</title>\n</head>\n<body>\n${html}\n</body>\n</html>`;
        }
    }
};


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
      const storedData = localStorage.getItem('iframeData');
      if (storedData) {
        const allIframes: Array<{ id: string; srcdoc: string }> = JSON.parse(storedData);
        const foundIframe = allIframes.find(iframe => iframe.id === iframeId);

        if (foundIframe) {
           // 1. Clean the srcdoc content to remove CSP tags
           let processedSrcdoc = removeCspMetaTags(foundIframe.srcdoc);
           // 2. Ensure the base tag is present and set correctly to resolve relative paths.
           processedSrcdoc = ensureBaseTag(processedSrcdoc);
           setHtmlContent(processedSrcdoc);
        } else {
          setError(`Iframe with ID "${iframeId}" not found.`);
           toast({ variant: 'destructive', title: 'Error', description: `Iframe with ID "${iframeId}" not found.` });
        }
      } else {
        setError("No iframe data found. Please re-upload the file on the main page.");
         toast({ variant: 'destructive', title: 'Error', description: 'No iframe data found. Please re-upload the file on the main page.' });
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


  // Render the processed HTML content directly using dangerouslySetInnerHTML
  // Use a key based on iframeId to ensure React replaces the div content on ID change
  // Add suppressHydrationWarning to handle potential minor mismatches caused by scripts etc.
  return (
    <div key={iframeId} dangerouslySetInnerHTML={{ __html: htmlContent }} suppressHydrationWarning={true} />
  );
}