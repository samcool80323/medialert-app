import React, { useState } from 'react';
import { FileText, Copy, Download, AlertCircle, CheckCircle, ArrowRight, Lightbulb } from 'lucide-react';

interface ComplianceIssue {
  type: string;
  rule: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  originalText: string;
  issue: string;
  suggestion: string;
  compliantRewrite: string;
}

export function AdCreatorPage() {
  const [originalContent, setOriginalContent] = useState('');
  const [compliantContent, setCompliantContent] = useState('');
  const [violations, setViolations] = useState<ComplianceIssue[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!originalContent.trim()) {
      setError('Please enter some content to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await fetch('/api/ad-creator/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: originalContent.trim(),
          sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze content');
      }

      const data = await response.json();
      setCompliantContent(data.draft.compliantContent);
      setViolations(data.draft.violationsDetected);
      setHasAnalyzed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze content');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const handleReset = () => {
    setOriginalContent('');
    setCompliantContent('');
    setViolations([]);
    setHasAnalyzed(false);
    setError('');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-purple-100 rounded-full">
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Safe-Harbour Ad Creator
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Draft your marketing copy and receive AI-filtered, compliance-checked versions 
            ready for publication. Ensure AHPRA compliance before you publish.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Your Original Content
              </h2>
              <textarea
                value={originalContent}
                onChange={(e) => setOriginalContent(e.target.value)}
                placeholder="Enter your marketing copy, ad content, or website text here...

Example:
'Get 50% off all cosmetic treatments this month! Our award-winning clinic guarantees amazing results. Book your free consultation today - limited spots available!'"
                className="textarea-field h-64 text-sm"
                disabled={isAnalyzing}
              />
              
              {error && (
                <div className="mt-3 flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="mt-4 flex space-x-3">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !originalContent.trim()}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Check Compliance</span>
                    </>
                  )}
                </button>

                {hasAnalyzed && (
                  <button
                    onClick={handleReset}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>New Analysis</span>
                  </button>
                )}
              </div>
            </div>

            {/* Example Content */}
            <div className="card bg-blue-50 border-blue-200">
              <h3 className="text-lg font-medium text-blue-900 mb-3 flex items-center space-x-2">
                <Lightbulb className="h-5 w-5" />
                <span>Example Content to Try</span>
              </h3>
              <div className="space-y-3">
                {[
                  "Save $500 on Invisalign treatment! Limited time offer - book this week only!",
                  "Our whitening system is proven in clinical trials to be the best on the market.",
                  "Patient Sarah says: 'I'm so happy with my results! Best decision ever!'",
                  "Guaranteed permanent hair removal results with our advanced laser technology."
                ].map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setOriginalContent(example)}
                    className="text-left w-full p-3 bg-white border border-blue-200 rounded-lg hover:border-blue-300 transition-colors text-sm"
                    disabled={isAnalyzing}
                  >
                    "{example}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {hasAnalyzed ? (
              <>
                {/* Compliant Version */}
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Compliant Version
                    </h2>
                    <button
                      onClick={() => handleCopy(compliantContent)}
                      className="btn-secondary text-sm flex items-center space-x-1"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </button>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-gray-800 whitespace-pre-wrap">{compliantContent}</p>
                  </div>

                  <div className="flex items-center space-x-2 text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>This version complies with AHPRA, TGA, and ACL regulations</span>
                  </div>
                </div>

                {/* Violations Found */}
                {violations.length > 0 && (
                  <div className="card">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Issues Fixed ({violations.length})
                    </h2>
                    
                    <div className="space-y-4">
                      {violations.map((violation, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg p-4 ${getSeverityColor(violation.severity)}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${getSeverityColor(violation.severity)}`}>
                                {violation.severity.toUpperCase()}
                              </span>
                              <span className="text-sm font-medium">{violation.type.replace('_', ' ').toUpperCase()}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Original:</span>
                              <span className="ml-2 italic">"{violation.originalText}"</span>
                            </div>
                            <div>
                              <span className="font-medium">Issue:</span>
                              <span className="ml-2">{violation.issue}</span>
                            </div>
                            <div>
                              <span className="font-medium">Rule:</span>
                              <span className="ml-2">{violation.rule}</span>
                            </div>
                            <div>
                              <span className="font-medium">Fixed to:</span>
                              <span className="ml-2 text-green-700">"{violation.compliantRewrite}"</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {violations.length === 0 && (
                  <div className="card bg-green-50 border-green-200">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-green-900">
                          No Violations Found!
                        </h3>
                        <p className="text-green-700">
                          Your content appears to comply with AHPRA, TGA, and ACL regulations.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="card bg-gray-50 border-gray-200">
                <div className="text-center py-12">
                  <ArrowRight className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Ready to Analyze
                  </h3>
                  <p className="text-gray-600">
                    Enter your content on the left and click "Check Compliance" 
                    to see the compliant version and any issues that were fixed.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 card bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="p-2 bg-purple-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How It Works
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">AI Analysis Process</h4>
                  <ul className="space-y-1">
                    <li>• Analyzes content against AHPRA National Law Section 133</li>
                    <li>• Checks TGA Code Section 12 compliance</li>
                    <li>• Validates Australian Consumer Law Section 18</li>
                    <li>• Identifies context-specific violations</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">What Gets Fixed</h4>
                  <ul className="space-y-1">
                    <li>• Prohibited inducements and discounts</li>
                    <li>• Misleading or guaranteed outcome claims</li>
                    <li>• Patient testimonials and reviews</li>
                    <li>• Unsubstantiated therapeutic claims</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}