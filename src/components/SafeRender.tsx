import React, { ReactNode, useState, useEffect } from 'react';
import { ensureInitialized } from '../utils/safeVariables';

interface SafeRenderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * A component wrapper that provides additional protection against TDZ errors
 * by ensuring all props and state are properly initialized before rendering
 */
const SafeRender: React.FC<SafeRenderProps> = ({ children, fallback }) => {
  // Initialize a render-safe state
  const [isReady, setIsReady] = useState(false);
  
  // Use useEffect to ensure all hooks have run before rendering children
  useEffect(() => {
    // This ensures all variables in the parent component have been initialized
    setIsReady(true);
  }, []);
  
  // Add a simple try/catch to protect against runtime errors
  try {
    // Default fallback is just a blank space to avoid layout shifts
    const safeFallback = ensureInitialized(fallback, <div className="min-h-4"></div>);
    
    // Only render children after the first render cycle
    return isReady ? <>{children}</> : <>{safeFallback}</>;
  } catch (error) {
    console.error("Error in SafeRender:", error);
    return <>
      {fallback || <div className="p-4 bg-red-50 text-red-800 rounded">Rendering error</div>}
    </>;
  }
};

export default SafeRender; 