'use client';

import { createContext, useCallback, useContext, useState } from 'react';

interface LoaderCtx {
  isDone: boolean;
  markDone: () => void;
}

const LoaderContext = createContext<LoaderCtx>({ isDone: false, markDone: () => {} });

export function LoaderProvider({ children }: { children: React.ReactNode }) {
  const [isDone, setIsDone] = useState(false);
  const markDone = useCallback(() => setIsDone(true), []);
  return (
    <LoaderContext.Provider value={{ isDone, markDone }}>
      {children}
    </LoaderContext.Provider>
  );
}

export const useLoader = () => useContext(LoaderContext);
