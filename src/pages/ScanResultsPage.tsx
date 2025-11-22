import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Globe,
  FileText,
  RefreshCw
} from 'lucide-react';
import { ScanRecord, ComplianceViolation } from '../shared/types';

export function ScanResultsPage() {
  const { scanId } = useParams<{ scanId: string }>();
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedViolations, setExpandedViolations] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!scanId) return;
    
    fetchScanResults();
    
    // Poll for updates if scan is still processing
    const interval = setInterval(() => {
      if (scan?.status === 'processing' || scan?.status === 'pending') {
        fetchScanResults();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [scanId, scan?.status]);

  const fetchScanResults = async () => {
    try {
      const response = await fetch(`/api/scanner/${scanId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch scan results');
      }

      const data = await response.json();
      setScan(data.scan);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scan results');
      setLoading(false);
    }
  };

  const toggleViolation = (violationId: string) => {
    const newExpanded = new Set(expandedViolations);
    if (newExpanded.has(violationId)) {
      newExpanded.delete(violationId);
    } else {
      newExpanded.add(violationId);
    }
    setExpandedViolations(newExpanded);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'violation-critical';
      case 'high': return 'violation-high';
      case 'medium': return 'violation-medium';
      case 'low': return 'violation-low';
      default: return 'bg-gray-50 border-l-4 border-gray-300';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Scan Results</h2>
            <p className="text-gray-600">Please wait while we fetch your compliance analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Results</h2>
            <p className="text-gray-600 mb-6">{error || 'Scan not found'}</p>
            <Link to="/scanner" className="btn-primary">
              Start New Scan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              to="/scanner"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Scanner</span>
            </Link>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Compliance Scan Results
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Globe className="h-4 w-4" />
                  <span>{scan.url}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(scan.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button
                onClick={fetchScanResults}
                className="btn-secondary flex items-center space-x-2"
                disabled={scan.status === 'processing'}
              >
                <RefreshCw className={`h-4 w-4 ${scan.status === 'processing' ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={handleExportPDF}
                className="btn-primary flex items-center space-x-2 no-print"
              >
                <Download className="h-4 w-4" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        {scan.status === 'processing' && (
          <div className="card bg-blue-50 border-blue-200 mb-8">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Scan in Progress</h3>
                <p className="text-blue-700">
                  {scan.progress ? (
                    `Analyzing page ${scan.progress.pagesCompleted + 1} of ${scan.progress.totalPages}...`
                  ) : (
                    'Analyzing your website content...'
                  )}
                </p>
                {scan.progress && (
                  <div className="mt-2 progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${scan.progress.percentage}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {scan.status === 'failed' && (
          <div className="card bg-red-50 border-red-200 mb-8">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-900">Scan Failed</h3>
                <p className="text-red-700">
                  The scan could not be completed. This might be due to website accessibility issues 
                  or robots.txt restrictions.
                </p>
              </div>
            </div>
          </div>
        )}

        {scan.status === 'completed' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="card text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">{scan.pagesScanned}</div>
                <div className="text-sm text-gray-600">Pages Scanned</div>
              </div>
              
              <div className="card text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">{scan.violationsFound}</div>
                <div className="text-sm text-gray-600">Violations Found</div>
              </div>
              
              <div className="card text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {scan.scanResults.filter(v => v.severity === 'critical' || v.severity === 'high').length}
                </div>
                <div className="text-sm text-gray-600">High Priority</div>
              </div>
              
              <div className="card text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {scan.pagesScanned - scan.violationsFound > 0 ? scan.pagesScanned - scan.violationsFound : 0}
                </div>
                <div className="text-sm text-gray-600">Clean Pages</div>
              </div>
            </div>

            {/* Violations List */}
            {scan.scanResults.length > 0 ? (
              <div className="card mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Compliance Violations ({scan.scanResults.length})
                  </h2>
                  <div className="flex space-x-2">
                    {['critical', 'high', 'medium', 'low'].map(severity => {
                      const count = scan.scanResults.filter(v => v.severity === severity).length;
                      if (count === 0) return null;
                      return (
                        <span
                          key={severity}
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityBadgeColor(severity)}`}
                        >
                          {count} {severity}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  {scan.scanResults.map((violation, index) => (
                    <div
                      key={violation.id}
                      className={`rounded-lg p-4 ${getSeverityColor(violation.severity)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityBadgeColor(violation.severity)}`}>
                              {violation.severity.toUpperCase()}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {violation.type.replace(/_/g, ' ').toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {violation.rule}
                            </span>
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                              <ExternalLink className="h-3 w-3" />
                              <span>{violation.pageTitle}</span>
                            </div>
                            <div className="text-xs text-gray-500">{violation.pageUrl}</div>
                          </div>

                          <div className="text-sm">
                            <div className="mb-2">
                              <span className="font-medium text-gray-900">Problematic text:</span>
                              <span className="ml-2 italic text-red-700">"{violation.originalText}"</span>
                            </div>
                            <div className="mb-2">
                              <span className="font-medium text-gray-900">Issue:</span>
                              <span className="ml-2 text-gray-700">{violation.issue}</span>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => toggleViolation(violation.id)}
                          className="ml-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {expandedViolations.has(violation.id) ? 'Hide Fix' : 'Show Fix'}
                        </button>
                      </div>

                      {expandedViolations.has(violation.id) && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="space-y-3 text-sm">
                            <div>
                              <span className="font-medium text-gray-900">Recommendation:</span>
                              <p className="mt-1 text-gray-700">{violation.suggestion}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">Compliant alternative:</span>
                              <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded-md">
                                <p className="text-green-800">"{violation.compliantRewrite}"</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card bg-green-50 border-green-200 mb-8">
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-900 mb-2">
                    No Violations Found!
                  </h3>
                  <p className="text-green-700">
                    Your website appears to comply with AHPRA, TGA, and ACL regulations. 
                    Great job maintaining compliant content!
                  </p>
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Next Steps</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">If violations were found:</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Review each violation and its compliant alternative</li>
                    <li>• Update your website content with the suggested fixes</li>
                    <li>• Consider consulting with legal professionals for complex issues</li>
                    <li>• Run another scan after making changes</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Ongoing compliance:</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Scan your website regularly (monthly recommended)</li>
                    <li>• Use our Ad Creator for new marketing content</li>
                    <li>• Stay updated with AHPRA guideline changes</li>
                    <li>• Train your team on compliance requirements</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link to="/scanner" className="btn-primary flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>Scan Another Website</span>
                </Link>
                <Link to="/ad-creator" className="btn-secondary flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Check Ad Content</span>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}