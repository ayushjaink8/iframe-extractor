import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { IframeData } from '@/types/iframeData';

interface IframeState {
  iframeData: IframeData[];
  setIframeData: (data: IframeData[]) => void;
  getIframeById: (id: string) => IframeData | undefined;
}

// Only include id and srcdoc for persistence to avoid storing redundant/large data
type PersistedIframeData = Pick<IframeData, 'id' | 'srcdoc'>;

export const useIframeDataStore = create<IframeState>()(
  persist(
    (set, get) => ({
      iframeData: [],
      setIframeData: (data: IframeData[]) => set({ iframeData: data }),
      getIframeById: (id: string): IframeData | undefined => {
        const data = get().iframeData;
        // The persisted state might only have id/srcdoc, find based on id
        // We might need to enhance this if other properties are crucial on the render page
        // For now, assuming finding by ID is enough and srcdoc is what's primarily needed
        const found = data.find(iframe => iframe.id === id);
        // Return a minimal structure if needed, or potentially fetch full data if required
        // Returning the found object as is, assuming srcdoc is the main requirement
        return found;
      },
    }),
    {
      name: 'iframe-storage', // Unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // Use localStorage
      // Persist only id and srcdoc to keep storage lean
      partialize: (state): { iframeData: PersistedIframeData[] } => ({
         iframeData: state.iframeData.map(({ id, srcdoc }) => ({ id, srcdoc })),
      }),
       // Define how to merge the persisted state back into the full state
       merge: (persistedState, currentState) => {
        const typedPersistedState = persistedState as { iframeData: PersistedIframeData[] };
        // Create a map for quick lookup of persisted data
        const persistedMap = new Map(typedPersistedState.iframeData.map(item => [item.id, item.srcdoc]));

        // Rehydrate iframeData by merging persisted srcdoc back into potentially more complete current state objects
        // Or, if the current state is empty, just use the persisted data.
        // Since the render page might only have the persisted data initially,
        // we primarily rely on what's loaded from storage.
        const rehydratedData = typedPersistedState.iframeData.map(pItem => {
          const currentItem = currentState.iframeData.find(cItem => cItem.id === pItem.id);
          return {
            ...currentItem, // Keep other properties if they exist in current state
            id: pItem.id,
            srcdoc: pItem.srcdoc,
            // Add default values for missing properties if necessary
            path: currentItem?.path || '',
            displayName: currentItem?.displayName || `Iframe #${pItem.id.split('-')[1] || '?'}`
          };
        });

        return {
          ...currentState,
          iframeData: rehydratedData,
        };
       },
    }
  )
);
