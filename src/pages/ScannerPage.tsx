import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scan, Globe, AlertCircle, CheckCircle, Clock, ExternalLink } from 'lucide-react';

export function ScannerPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!url.trim()) {
      setError('Please enter a website URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setIsScanning(true);

    try {
      const response = await fetch('/api/scanner/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          config: {
            maxPages: 10,
            maxDepth: 2,
            respectRobotsTxt: true,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start scan');
      }

      const data = await response.json();
      navigate(`/scan/${data.scanId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start scan');
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-blue-100 rounded-full">
              <Scan className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Website Compliance Scanner
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Scan your medical practice website for AHPRA, TGA, and ACL compliance violations. 
            Get detailed analysis with actionable recommendations.
          </p>
        </div>

        {/* Scan Form */}
        <div className="card max-w-2xl mx-auto mb-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-medical-practice.com.au"
                  className="input-field pl-10"
                  disabled={isScanning}
                />
              </div>
              {error && (
                <div className="mt-2 flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">What we'll analyze:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Up to 10 pages from your website</li>
                <li>• All text content, headings, and links</li>
                <li>• Images with alt text and titles</li>
                <li>• Forms and call-to-action elements</li>
                <li>• Compliance with AHPRA, TGA, and ACL regulations</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isScanning || !url.trim()}
              className="w-full btn-primary text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isScanning ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Starting Scan...</span>
                </>
              ) : (
                <>
                  <Scan className="h-5 w-5" />
                  <span>Start Compliance Scan</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Real Content Analysis
            </h3>
            <p className="text-gray-600 text-sm">
              Scans your actual website content, including JavaScript-rendered elements 
              and dynamic content.
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Fast Results
            </h3>
            <p className="text-gray-600 text-sm">
              Get comprehensive compliance analysis in under 2 minutes. 
              Real-time progress updates during scanning.
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <div className="p-2 bg-purple-100 rounded-full">
                <ExternalLink className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Detailed Reports
            </h3>
            <p className="text-gray-600 text-sm">
              Professional PDF reports with specific violations, 
              compliant rewrites, and implementation guidance.
            </p>
          </div>
        </div>

        {/* Compliance Info */}
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="p-2 bg-blue-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Comprehensive Compliance Checking
              </h3>
              <p className="text-gray-700 mb-4">
                Our AI analyzes your website content against Australian healthcare regulations:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">AHPRA National Law Section 133</h4>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Prohibited inducements</li>
                    <li>• Misleading claims</li>
                    <li>• Prohibited testimonials</li>
                    <li>• Unreasonable expectations</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">TGA Code & ACL Section 18</h4>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Therapeutic goods advertising</li>
                    <li>• Misleading or deceptive conduct</li>
                    <li>• False representations</li>
                    <li>• Consumer protection</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Example URLs */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Not sure what to scan? Try these example medical practice websites:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'https://www.example-dental.com.au',
              'https://www.sample-aesthetics.com.au',
              'https://www.demo-medical.com.au',
            ].map((exampleUrl) => (
              <button
                key={exampleUrl}
                onClick={() => setUrl(exampleUrl)}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
                disabled={isScanning}
              >
                {exampleUrl}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}