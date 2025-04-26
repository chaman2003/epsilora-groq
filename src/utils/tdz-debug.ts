/**
 * Utilities to help debug Temporal Dead Zone (TDZ) issues in production builds
 */

/**
 * Install a global error handler to catch and report TDZ errors
 * Call this function early in your application initialization
 */
export function installTDZErrorHandler(): void {
  if (typeof window !== 'undefined') {
    // Save the original error handler
    const originalOnError = window.onerror;

    // Install our custom error handler
    window.onerror = function(message, source, lineno, colno, error) {
      // Check if this is a TDZ error
      if (message && typeof message === 'string' && 
          (message.includes('Cannot access') && message.includes('before initialization'))) {
        
        // Log detailed info about the error
        console.error('=== TDZ ERROR DETECTED ===');
        console.error('Message:', message);
        console.error('Source:', source);
        console.error('Line/Col:', lineno, colno);
        console.error('Error object:', error);
        console.error('Stack:', error?.stack);
        
        // Create a more descriptive error message for the user
        const errorInfo = document.createElement('div');
        errorInfo.style.position = 'fixed';
        errorInfo.style.bottom = '20px';
        errorInfo.style.left = '20px';
        errorInfo.style.backgroundColor = 'rgba(200, 0, 0, 0.9)';
        errorInfo.style.color = 'white';
        errorInfo.style.padding = '10px';
        errorInfo.style.borderRadius = '5px';
        errorInfo.style.maxWidth = '400px';
        errorInfo.style.zIndex = '9999';
        errorInfo.style.fontSize = '14px';
        errorInfo.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
        
        errorInfo.innerHTML = `
          <strong>Initialization Error</strong><br>
          A variable was accessed before it was fully initialized. This has been logged for debugging.<br>
          <small>${message}</small><br>
          <button id="dismiss-tdz-error" style="background: white; color: black; border: none; padding: 3px 8px; margin-top: 5px; border-radius: 3px; cursor: pointer;">Dismiss</button>
        `;
        
        document.body.appendChild(errorInfo);
        
        document.getElementById('dismiss-tdz-error')?.addEventListener('click', () => {
          document.body.removeChild(errorInfo);
        });
      }
      
      // Call the original error handler if it exists
      if (typeof originalOnError === 'function') {
        return originalOnError.call(window, message, source, lineno, colno, error);
      }
      
      // Return false to allow the default error handling
      return false;
    };
    
    console.log('TDZ error handler installed');
  }
}

/**
 * Wrap a component with this HOC to log render cycles and detect TDZ issues
 */
export function withTDZProtection<T>(Component: React.ComponentType<T>, componentName: string = 'Component') {
  return (props: T) => {
    console.log(`[TDZ Protection] ${componentName} rendering with props:`, props);
    
    try {
      return Component(props);
    } catch (error) {
      console.error(`[TDZ Protection] Error in ${componentName}:`, error);
      
      // Create a fallback UI for errors
      return (
        <div style={{ 
          padding: '20px', 
          margin: '10px', 
          backgroundColor: 'rgba(255, 0, 0, 0.1)', 
          border: '1px solid red',
          borderRadius: '5px'
        }}>
          <h3>Component Error</h3>
          <p>There was an error rendering {componentName}</p>
          <details>
            <summary>Technical details</summary>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
              {error?.toString()}
              {error?.stack}
            </pre>
          </details>
        </div>
      );
    }
  };
} 