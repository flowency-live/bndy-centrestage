'use client';

import React, { useState, useEffect } from 'react';

// Client-side only component wrapper
export default function DiagnosticPage() {
  // Use this state to track if we're on the client
  const [mounted, setMounted] = useState(false);
  
  // Only run once on the client after hydration
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Show a simple loading state during SSR and initial client render
  if (!mounted) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Authentication Diagnostic Tool</h1>
        <p>Loading diagnostic tools...</p>
      </div>
    );
  }
  
  // Only render the actual content on the client
  return <DiagnosticContent />;
}

// Define types for our state
interface BrowserInfo {
  userAgent: string;
  cookiesEnabled: boolean;
  protocol: string;
  hostname: string;
  port: string;
}

interface Results {
  browserInfo: BrowserInfo | null;
  timestamp?: string;
}

interface CertResult {
  success?: boolean;
  message?: string;
  serverInfo?: {
    protocol?: string;
    hostname?: string;
    host?: string;
    secureContext?: boolean;
  };
  headers?: Record<string, string | null>;
  cookieInfo?: {
    cookiesAllowed?: boolean;
    sameSiteNoneSupported?: boolean;
    crossDomainSupported?: boolean;
  };
  certTestCookieSet?: boolean;
  responseStatus?: number;
  error?: string;
}

interface CookieResult {
  testCookieSet?: boolean;
  responseStatus?: number;
  error?: string;
}

// The actual diagnostic component that only runs on the client
function DiagnosticContent() {
  const [results, setResults] = useState<Results>({
    browserInfo: null,
  });
  const [certResults, setCertResults] = useState<CertResult>({});
  const [cookieResults, setCookieResults] = useState<CookieResult>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cookies, setCookies] = useState<string[]>([]);

  // Function to check if cookies are enabled in the browser
  const checkCookiesEnabled = () => {
    try {
      document.cookie = "testcookie=1; path=/";
      const cookieEnabled = document.cookie.indexOf("testcookie") !== -1;
      document.cookie = "testcookie=1; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
      return cookieEnabled;
    } catch (e) {
      console.error("Error checking cookies:", e);
      return false;
    }
  };

  // Function to check if SameSite=None cookies are supported
  const checkSameSiteNone = async () => {
    try {
      const response = await fetch('/api/cookieTest', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Cookie test failed: ${response.status}`);
      }
      
      // Check if the test cookie was set
      const hasCookie = document.cookie.includes('test-cookie=');
      
      return {
        testCookieSet: hasCookie,
        responseStatus: response.status,
      };
    } catch (e) {
      console.error("Error testing SameSite=None:", e);
      return {
        testCookieSet: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  };

  // Function to check certificate
  const checkCertificate = async () => {
    try {
      const response = await fetch('/api/certCheck', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Certificate check failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check if the cert-test-cookie was set
      const hasCookie = document.cookie.includes('cert-test-cookie=');
      
      return {
        ...data,
        certTestCookieSet: hasCookie,
        responseStatus: response.status,
      };
    } catch (e) {
      console.error("Error checking certificate:", e);
      return {
        error: e instanceof Error ? e.message : String(e),
      };
    }
  };

  // Function to run all diagnostic tests
  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Update cookies list
      updateCookiesList();
      
      // Basic browser checks
      const cookiesEnabled = checkCookiesEnabled();
      
      // Set initial results
      setResults({
        browserInfo: {
          userAgent: navigator.userAgent,
          cookiesEnabled,
          protocol: window.location.protocol,
          hostname: window.location.hostname,
          port: window.location.port,
        },
        timestamp: new Date().toISOString(),
      });
      
      // Check certificate
      const certResults = await checkCertificate();
      setCertResults(certResults);
      
      // Check SameSite=None cookies
      const cookieResults = await checkSameSiteNone();
      setCookieResults(cookieResults);
      
      // Update cookies list again after tests
      updateCookiesList();
      
    } catch (e) {
      console.error("Diagnostic error:", e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  // Function to update the cookies list
  const updateCookiesList = () => {
    const cookiesList = document.cookie
      .split(';')
      .map(cookie => cookie.trim())
      .filter(cookie => cookie.length > 0);
    
    setCookies(cookiesList);
  };

  // Run diagnostics on component mount
  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Authentication Diagnostic Tool</h1>
      
      <div className="mb-6">
        <button 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={runDiagnostics}
          disabled={loading}
        >
          {loading ? 'Running Tests...' : 'Run Diagnostics'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded p-6">
          <h2 className="text-xl font-bold mb-4">Browser Information</h2>
          {results.browserInfo ? (
            <div className="space-y-2">
              <p><strong>User Agent:</strong> {results.browserInfo.userAgent}</p>
              <p><strong>Cookies Enabled:</strong> {results.browserInfo.cookiesEnabled ? 'Yes' : 'No'}</p>
              <p><strong>Protocol:</strong> {results.browserInfo.protocol}</p>
              <p><strong>Hostname:</strong> {results.browserInfo.hostname}</p>
              <p><strong>Port:</strong> {results.browserInfo.port}</p>
            </div>
          ) : (
            <p>Loading browser information...</p>
          )}
        </div>
        
        <div className="bg-white shadow-md rounded p-6">
          <h2 className="text-xl font-bold mb-4">Certificate Check</h2>
          {Object.keys(certResults).length > 0 ? (
            <div className="space-y-2">
              <p><strong>Secure Context:</strong> {certResults.serverInfo?.secureContext ? 'Yes' : 'No'}</p>
              <p><strong>Protocol:</strong> {certResults.serverInfo?.protocol}</p>
              <p><strong>Host:</strong> {certResults.serverInfo?.host}</p>
              <p><strong>Test Cookie Set:</strong> {certResults.certTestCookieSet ? 'Yes' : 'No'}</p>
              {certResults.error && (
                <p className="text-red-500"><strong>Error:</strong> {certResults.error}</p>
              )}
            </div>
          ) : (
            <p>Loading certificate information...</p>
          )}
        </div>
        
        <div className="bg-white shadow-md rounded p-6">
          <h2 className="text-xl font-bold mb-4">Cookie Test</h2>
          {Object.keys(cookieResults).length > 0 ? (
            <div className="space-y-2">
              <p><strong>Test Cookie Set:</strong> {cookieResults.testCookieSet ? 'Yes' : 'No'}</p>
              <p><strong>Response Status:</strong> {cookieResults.responseStatus}</p>
              {cookieResults.error && (
                <p className="text-red-500"><strong>Error:</strong> {cookieResults.error}</p>
              )}
            </div>
          ) : (
            <p>Loading cookie test results...</p>
          )}
        </div>
        
        <div className="bg-white shadow-md rounded p-6">
          <h2 className="text-xl font-bold mb-4">Current Cookies</h2>
          <div className="space-y-2">
            {cookies.length > 0 ? (
              <ul className="list-disc pl-5">
                {cookies.map((cookie, index) => (
                  <li key={index}>{cookie}</li>
                ))}
              </ul>
            ) : (
              <p>No cookies found</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-white shadow-md rounded p-6">
        <h2 className="text-xl font-bold mb-4">Manual Certificate Check Instructions</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Click on the padlock icon in your browser's address bar</li>
          <li>Select "Certificate" or "Connection is secure" to view certificate details</li>
          <li>Check if the certificate is trusted by your browser</li>
          <li>Verify that the certificate covers all subdomains (*.local.bndy.test)</li>
          <li>Check the certificate's expiration date</li>
        </ol>
        
        <h3 className="text-lg font-bold mt-4 mb-2">Common Certificate Issues:</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Self-signed certificates are not trusted by default</li>
          <li>Certificate doesn't include all required subdomains</li>
          <li>Certificate has expired</li>
          <li>Certificate was issued for a different domain</li>
          <li>Intermediate certificates are missing</li>
        </ul>
        
        <h3 className="text-lg font-bold mt-4 mb-2">Common Cookie Issues:</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>SameSite=None requires a secure context (HTTPS with trusted certificate)</li>
          <li>Third-party cookies might be blocked by browser settings</li>
          <li>Cookie domain must match or be a parent domain of the current site</li>
          <li>Some browsers restrict cross-site cookies even with SameSite=None</li>
        </ul>
      </div>
    </div>
  );
}
