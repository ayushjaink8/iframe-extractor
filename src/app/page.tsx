
"use client";

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { DragEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, Copy, ExternalLink, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IframeData {
  id: string; // Unique ID for React key and routing (e.g., "iframe-1", "iframe-2")
  srcdoc: string;
  path: string; // Hierarchical path (e.g., "0", "0.1", "1") used for sorting
  displayName: string; // User-friendly name (e.g., "Iframe #1", "Iframe #2 (nested)")
}

export default function Home() {
  const [srcdocList, setSrcdocList] = useState<IframeData[]>([]);
  const [selectedIframeIndex, setSelectedIframeIndex] = useState<string>(''); // Stores the *array index* of the selected iframe
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const { toast } = useToast();


   // Memoized calculation for the currently selected iframe's data object
   const selectedIframeData = useMemo(() => {
     if (selectedIframeIndex === '' || srcdocList.length === 0) return null;
     const index = parseInt(selectedIframeIndex, 10);
     // Ensure index is valid
     if (isNaN(index) || index < 0 || index >= srcdocList.length) {
         console.warn(`Invalid selectedIframeIndex: ${selectedIframeIndex}`);
         // Reset selection if index becomes invalid after list changes
         setSelectedIframeIndex('');
         return null;
     }
     return srcdocList[index];
   }, [selectedIframeIndex, srcdocList]);

    // Function remains the same, responsible for wrapping if needed
    const formatSrcdocForDisplay = useCallback((srcdoc: string | undefined): string => {
        if (!srcdoc) return '';
        let out = srcdoc.trim();
        // Basic check if it looks like a full HTML document already
        if (!/^\s*<!DOCTYPE/i.test(out) && !/^\s*<html/i.test(out)) {
        // Simple wrap if it doesn't look like a full document
        out = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Iframe Content</title>\n</head>\n<body>\n${out}\n</body>\n</html>`;
        }
        return out;
    }, []); // No dependencies, it's a pure function of its input

   // Memoized calculation for the srcdoc content to be displayed (potentially formatted)
  const displayedSrcdoc = useMemo(() => {
     // Use selectedIframeData which is already memoized
     return formatSrcdocForDisplay(selectedIframeData?.srcdoc);
   }, [selectedIframeData, formatSrcdocForDisplay]); // Added formatSrcdocForDisplay dependency


  // Effect to handle iframe srcdoc sanitization and auto-selection
  useEffect(() => {
    // Auto-select the first iframe if the list is populated and nothing is selected
    if (srcdocList.length > 0 && selectedIframeIndex === '') {
      setSelectedIframeIndex('0'); // Select by index 0
    }
    // Reset selection if list becomes empty
    if (srcdocList.length === 0) {
      setSelectedIframeIndex('');
    }

    // Check if the currently selected index is still valid
    if (selectedIframeIndex !== '' && parseInt(selectedIframeIndex, 10) >= srcdocList.length) {
        setSelectedIframeIndex(srcdocList.length > 0 ? '0' : ''); // Select first or clear
    }


    // Save to localStorage whenever srcdocList changes
    // This is a temporary solution for passing data to the render page. See notes in render/[iframeId]/page.tsx
    if (srcdocList.length > 0) {
        try {
          // Store only the data needed by the render page (id and srcdoc)
          localStorage.setItem('iframeData', JSON.stringify(srcdocList.map(item => ({ id: item.id, srcdoc: item.srcdoc }))));
        } catch (e) {
          console.error("Failed to save iframe data to localStorage", e);
          toast({
            variant: "destructive",
            title: "Storage Error",
            description: "Could not save iframe data for cross-page rendering. 'Open in New Tab' might not work.",
          });
        }
      } else {
        localStorage.removeItem('iframeData');
      }

  }, [srcdocList, selectedIframeIndex, toast]); // Added toast to dependencies


  const extractIframes = useCallback((html: string): IframeData[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const iframesWithPath: IframeData[] = [];
    let counter = 0;

    function findIframesRecursive(element: Element | Document, currentPath: string): void {
        // Find direct iframe children of the current element
        const directIframes = Array.from(element.querySelectorAll(':scope > iframe'));

        for (let i = 0; i < directIframes.length; i++) {
            const iframeElement = directIframes[i];
            // Construct path based on sibling index among *all* children, not just iframes
            const allChildren = Array.from(element.children);
            const indexAmongAll = allChildren.indexOf(iframeElement);
            const newPath = currentPath ? `${currentPath}.${indexAmongAll}` : `${indexAmongAll}`;

            const srcdoc = iframeElement.getAttribute('srcdoc');
            if (srcdoc) {
                counter++;
                const uniqueId = `iframe-${counter}`; // Temporary ID
                const isNested = newPath.includes('.');
                const displayName = `Iframe #${counter}${isNested ? ' (nested)' : ''}`; // Temporary name

                iframesWithPath.push({
                    id: uniqueId,
                    srcdoc: srcdoc,
                    path: newPath,
                    displayName: displayName
                });

                 // Parse the srcdoc and recursively find iframes within *its* body
                 try {
                    const innerParser = new DOMParser();
                    const innerDoc = innerParser.parseFromString(srcdoc, 'text/html');
                    // Check if innerDoc.body exists before recursing
                    if (innerDoc.body) {
                      findIframesRecursive(innerDoc.body, newPath); // Recurse into the *body* of the srcdoc
                    } else if(innerDoc.documentElement) {
                        // Fallback for srcdoc that might just have content without a body
                        findIframesRecursive(innerDoc.documentElement, newPath);
                    }
                 } catch (parseError) {
                    console.error(`Error parsing srcdoc for iframe at path ${newPath}:`, parseError);
                    // Optionally, still recurse into the iframe's *own* direct children
                    // findIframesRecursive(iframeElement, newPath);
                 }
            } else {
                // If iframe has no srcdoc, still recurse into its direct children
                findIframesRecursive(iframeElement, newPath);
            }
        }

        // Also recurse into non-iframe direct children to find nested iframes deeper down
        const nonIframeChildren = element.querySelectorAll(':scope > *:not(iframe)');
        for (let i = 0; i < nonIframeChildren.length; i++) {
             const childElement = nonIframeChildren[i];
             const allChildren = Array.from(element.children);
             const indexAmongAll = allChildren.indexOf(childElement);
             const childPath = currentPath ? `${currentPath}.${indexAmongAll}` : `${indexAmongAll}`;
             findIframesRecursive(childElement, childPath);
        }
    }


    // Start recursion from the document body or root element
    const startElement = doc.body || doc.documentElement;
    if (startElement) {
        findIframesRecursive(startElement, '');
    }


    // Sort iframes based on their hierarchical path
     iframesWithPath.sort((a, b) => {
         const pathA = a.path.split('.').map(Number);
         const pathB = b.path.split('.').map(Number);
         for (let i = 0; i < Math.max(pathA.length, pathB.length); i++) {
             const valA = pathA[i] ?? -Infinity; // Handle different lengths
             const valB = pathB[i] ?? -Infinity;
             if (valA !== valB) return valA - valB;
         }
         return 0; // Paths are identical (shouldn't happen with unique indices)
     });

      // Re-assign IDs and display names based on the final sorted order
     return iframesWithPath.map((iframe, idx) => ({
         ...iframe,
         id: `iframe-${idx + 1}`, // Stable ID based on final order
         displayName: `Iframe #${idx + 1}${iframe.path.includes('.') ? ' (nested)' : ''}` // Consistent naming
     }));

  }, []);


  const processFile = useCallback(
    (file: File) => {
      if (!file || !file.type.includes('html')) {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload an HTML file.',
        });
        setSrcdocList([]); // Clear list on invalid file type
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const html = event.target?.result as string;
          if (typeof html !== 'string') { // Check if html is a string
              throw new Error("Failed to read file content.");
          }
          const extracted = extractIframes(html);

          if (extracted.length === 0) {
            toast({
              // Keep variant default or use 'info' if you add it
              title: 'No Iframes Found',
              description: 'No iframes with a `srcdoc` attribute were found in the uploaded file.',
            });
            setSrcdocList([]); // Ensure list is cleared
          } else {
            setSrcdocList(extracted);
             toast({
               title: 'Extraction Successful',
               description: `${extracted.length} iframe(s) with srcdoc found.`,
             });
             // setSelectedIframeIndex('0'); // Let useEffect handle selection
          }
        } catch (error) {
            console.error("Error processing file:", error);
            toast({
              variant: 'destructive',
              title: 'Processing Error',
              description: `An error occurred while processing the file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
            setSrcdocList([]); // Clear list on error
        }
      };
      reader.onerror = () => {
        toast({
            variant: 'destructive',
            title: 'File Read Error',
            description: 'Could not read the selected file.',
          });
        setSrcdocList([]); // Clear list on error
      }
      reader.readAsText(file);
    },
    [extractIframes, toast]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
     // Reset file input to allow re-uploading the same file
     event.target.value = '';
  };

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // Check if files are being dragged
    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
       setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // Check if the mouse is leaving the drop zone element entirely
     const relatedTarget = event.relatedTarget as Node | null;
     if (!event.currentTarget.contains(relatedTarget)) {
       setIsDragging(false);
     }
  }, []);

  const handleSelectChange = (value: string) => {
    // Value from Select is the *array index* (as a string)
    setSelectedIframeIndex(value);
  };

  const copyToClipboard = useCallback(() => {
     // Use selectedIframeData derived from selectedIframeIndex
    if (!selectedIframeData) {
      toast({
        variant: 'destructive',
        title: 'Nothing to Copy',
        description: 'Please select an iframe first.',
      });
      return;
    }
    // Use the already formatted displayedSrcdoc
    navigator.clipboard.writeText(displayedSrcdoc)
      .then(() => {
        toast({ title: 'Copied to Clipboard!' });
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        toast({
          variant: 'destructive',
          title: 'Copy Failed',
          description: 'Could not copy the content to the clipboard.',
        });
      });
  }, [selectedIframeData, displayedSrcdoc, toast]); // Depend on derived/formatted data


  return (
    <main className="container mx-auto p-4 md:p-8 flex flex-col min-h-screen">
       <Card className="max-w-6xl mx-auto shadow-lg flex-grow flex flex-col relative"> {/* Added relative positioning */}
        {/* Instructions Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="absolute top-4 right-4 z-10">
              <Info className="mr-2 h-4 w-4" /> Instructions
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-xl">How to Use IframeXtractor</DialogTitle>
              <DialogDescription>
                Follow these steps to extract and utilize iframe content:
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 text-sm">
                <p>
                    <strong>1. Save the Webpage:</strong> Use the{' '}
                    <a href="https://chromewebstore.google.com/detail/save-page-we/dhhpefjklgkmgeafimnjhojgjamoafof" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
                        Save Page WE
                    </a>{' '}
                    Chrome extension to download the complete HTML file of the webpage containing the iframes you need.
                </p>
                <p>
                    <strong>2. Upload the HTML File:</strong> Drag and drop the downloaded HTML file onto the upload area below, or click to browse and select the file.
                </p>
                <p>
                    <strong>3. Select and Preview:</strong> If iframes with `srcdoc` content are found, they will appear in the dropdown. Select an iframe to preview its content and view the source code.
                </p>
                <p>
                    <strong>4. Open in New Tab:</strong> Click the "Open in New Tab" button for the selected iframe. This provides the most accurate rendering environment.
                </p>
                <p>
                    <strong>5. Convert to React (Optional):</strong> In the new tab displaying the iframe content, you can use the{' '}
                    <a href="https://chromewebstore.google.com/detail/html-to-react/glefoejbpalgpdgfbbmemfgegepiamnd" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
                        HTML to React
                    </a>{' '}
                    Chrome extension to help convert the visible HTML elements into React components.
                </p>
                 <p className="pt-2 text-muted-foreground">
                    <strong>Need Help?</strong>
                    <br/> {/* Add line break here */}
                    If you encounter any issues, please contact Ayush Jain (<a href="mailto:jain.ayush@turing.com" className="text-primary underline hover:text-primary/80">jain.ayush@turing.com</a>).
                 </p>
            </div>
          </DialogContent>
        </Dialog>

        <CardHeader className="text-center border-b pt-6 pb-6"> {/* Adjusted padding */}
          <CardTitle className="text-3xl font-bold text-primary">
            IframeXtractor
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Upload an HTML file to extract and preview iframe `srcdoc` content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 flex-grow pt-6">
          {/* File Upload Section */}
          <div
            className={cn(
              'border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors duration-200 cursor-pointer',
              isDragging ? 'border-primary bg-accent/10' : 'hover:border-primary/50 hover:bg-secondary/50'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver} // Handle entering the zone as well
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('fileInput')?.click()}
            role="button" // Add role for accessibility
            tabIndex={0} // Make it focusable
             onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('fileInput')?.click(); }} // Keyboard activation
             aria-label="File upload area"
          >
            <input
              type="file"
              id="fileInput"
              accept=".html,.htm" // Accept both .html and .htm
              onChange={handleFileChange}
              className="hidden"
              aria-hidden="true" // Hide from accessibility tree as interaction is via the div
            />
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
            <p className="text-muted-foreground">
              {isDragging ? 'Drop the HTML file here' : 'Drag & drop an HTML file here, or click to select'}
            </p>
             <Button variant="outline" size="sm" className="mt-4 pointer-events-none" tabIndex={-1}> {/* Prevent button focus */}
               Browse Files
             </Button>
          </div>

          {/* Iframe Selection Dropdown */}
          {srcdocList.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="iframeSelect" className="text-base">Select an iframe:</Label>
              <Select onValueChange={handleSelectChange} value={selectedIframeIndex}>
                <SelectTrigger id="iframeSelect" className="w-full" aria-label="Select iframe to preview">
                  <SelectValue placeholder="-- Select an iframe --" />
                </SelectTrigger>
                <SelectContent>
                  {srcdocList.map((iframe, index) => (
                    // Use the array index as the value for the select item
                    <SelectItem key={iframe.id} value={String(index)}>
                      {iframe.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Output and Preview Area */}
          {selectedIframeData !== null ? ( // Check if selectedIframeData is not null
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Srcdoc Output */}
              <div className="space-y-2">
                <Label htmlFor="output" className="text-base">Srcdoc Content</Label>
                <Textarea
                  id="output"
                  readOnly
                  value={displayedSrcdoc} // Use the memoized formatted content
                  className="h-[400px] font-mono text-sm resize-none bg-card border rounded-md shadow-inner"
                  placeholder="Iframe srcdoc will appear here..."
                  aria-label="Extracted srcdoc content"
                />
                 <div className="flex gap-2 mt-2">
                  <Button onClick={copyToClipboard} variant="outline" size="sm" aria-label="Copy srcdoc content">
                    <Copy className="mr-2 h-4 w-4" aria-hidden="true" /> Copy
                  </Button>
                 {selectedIframeData && ( // Check again for safety, though outer check should suffice
                    <Button asChild variant="outline" size="sm">
                      {/* Link uses the unique iframe.id for routing */}
                      <Link href={`/render/${selectedIframeData.id}`} target="_blank" rel="noopener noreferrer" aria-label="Open selected iframe content in a new tab">
                         <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true"/> Open in New Tab
                      </Link>
                     </Button>
                 )}
                 </div>
              </div>

              {/* Iframe Preview */}
              <div className="space-y-2">
                <Label htmlFor="preview" className="text-base">Preview</Label>
                <div className="overflow-auto border bg-white rounded-md shadow-inner h-[400px]"> {/* Added overflow-auto here */}
                    <iframe
                        id="preview"
                        key={selectedIframeData.id} // Add key to force re-render on selection change
                        srcDoc={displayedSrcdoc} // Use potentially wrapped srcdoc
                        className="w-full h-full border-0" // Removed fixed height, border, bg, shadow from iframe itself
                        title="Iframe Preview"
                        // Sandbox attribute removed completely to minimize restrictions
                        aria-label="Preview of selected iframe content"
                    />
                </div>
                 <p className="text-xs text-muted-foreground pt-1" id="preview-description">
                    Note: Preview might differ from actual rendering. Use 'Open in New Tab' for the most accurate view. Sandbox restrictions removed for simplicity.
                 </p>
              </div>
            </div>
           ) : (
              // Placeholder shown when no file is processed or no iframes are found
                 <div className="text-center text-muted-foreground p-8 border rounded-md">
                    {srcdocList.length > 0 ? "Select an iframe from the dropdown to view its content." : "Upload an HTML file to extract iframe `srcdoc` content. The results will appear here."}
                 </div>
           )}


        </CardContent>
         <CardFooter className="justify-center border-t pt-4 pb-4 mt-auto"> {/* Adjusted padding */}
            <p className="text-sm text-muted-foreground">
               Made with ❤️ by Ayush Jain (jain.ayush@turing.com)
            </p>
          </CardFooter>
      </Card>
    </main>
  );
}

    

    