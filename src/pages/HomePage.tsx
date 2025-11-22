import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Scan, FileText, CheckCircle, AlertTriangle, Clock, Users } from 'lucide-react';

export function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Shield className="h-16 w-16 text-blue-600" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              MediGuard AI
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              AHPRA compliance platform for Australian medical practitioners with 
              <span className="text-blue-600 font-semibold"> real website scanning</span>
            </p>
            <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto">
              Automatically identify compliance violations and receive actionable, 
              ready-to-publish compliant alternatives for your medical practice website and marketing content.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/scanner"
                className="btn-primary text-lg px-8 py-3 inline-flex items-center space-x-2"
              >
                <Scan className="h-5 w-5" />
                <span>Scan Website</span>
              </Link>
              <Link
                to="/ad-creator"
                className="btn-secondary text-lg px-8 py-3 inline-flex items-center space-x-2"
              >
                <FileText className="h-5 w-5" />
                <span>Check Ad Copy</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive AHPRA Compliance
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform analyzes your content against Australian healthcare regulations 
              to help you stay compliant and avoid costly violations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Real Website Scanning */}
            <div className="card text-center">
              <div className="flex justify-center mb-4">
                <Scan className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Real Website Scanning
              </h3>
              <p className="text-gray-600 mb-4">
                Scan your actual website content with our advanced web scraping engine. 
                Analyzes multiple pages, JavaScript content, and dynamic elements.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Multi-page analysis</li>
                <li>• JavaScript rendering</li>
                <li>• Content categorization</li>
                <li>• Violation location mapping</li>
              </ul>
            </div>

            {/* AI-Powered Analysis */}
            <div className="card text-center">
              <div className="flex justify-center mb-4">
                <Shield className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                AI-Powered Analysis
              </h3>
              <p className="text-gray-600 mb-4">
                Context-aware AI analyzes your content against AHPRA National Law, 
                TGA Code, and Australian Consumer Law with precision.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• AHPRA Section 133 compliance</li>
                <li>• TGA Code Section 12</li>
                <li>• ACL Section 18</li>
                <li>• Context-aware detection</li>
              </ul>
            </div>

            {/* Compliant Alternatives */}
            <div className="card text-center">
              <div className="flex justify-center mb-4">
                <FileText className="h-12 w-12 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Ready-to-Use Rewrites
              </h3>
              <p className="text-gray-600 mb-4">
                Get specific, compliant alternatives for every violation found. 
                Copy-paste ready content that maintains your message while ensuring compliance.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Specific violation fixes</li>
                <li>• Compliant rewrites</li>
                <li>• Implementation guidance</li>
                <li>• Professional PDF reports</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Rules Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What We Check
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive analysis covers all major Australian healthcare compliance requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Prohibited Inducements (Section 133(1)(e))
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Identifies discounts, special offers, gifts, and time-limited promotions 
                    that encourage unnecessary use of regulated health services.
                  </p>
                  <div className="text-sm text-gray-500">
                    <strong>Examples:</strong> "$500 off", "Limited time offer", "Free consultation*"
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-6 w-6 text-orange-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Misleading Claims (Section 133(1)(a) & (b))
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Detects false or misleading statements, guaranteed outcomes, 
                    and unsubstantiated comparative claims.
                  </p>
                  <div className="text-sm text-gray-500">
                    <strong>Examples:</strong> "Guaranteed results", "Best in Australia", "Clinically proven"
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-6 w-6 text-yellow-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Prohibited Testimonials (Section 133(1)(c))
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Identifies patient testimonials, before/after photos without disclaimers, 
                    and celebrity endorsements.
                  </p>
                  <div className="text-sm text-gray-500">
                    <strong>Examples:</strong> Patient quotes, success stories, review content
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Therapeutic Goods (TGA Code Section 12)
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Checks for unsubstantiated therapeutic claims, missing disclaimers, 
                    and restricted therapeutic language.
                  </p>
                  <div className="text-sm text-gray-500">
                    <strong>Examples:</strong> "Cures", "Treats", unregistered product claims
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by Medical Professionals
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Join hundreds of Australian medical practitioners who trust MediGuard AI 
              to keep their marketing compliant.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="flex justify-center mb-2">
                <Users className="h-8 w-8 text-blue-200" />
              </div>
              <div className="text-3xl font-bold mb-1">500+</div>
              <div className="text-blue-200">Practitioners</div>
            </div>
            <div>
              <div className="flex justify-center mb-2">
                <Scan className="h-8 w-8 text-blue-200" />
              </div>
              <div className="text-3xl font-bold mb-1">10,000+</div>
              <div className="text-blue-200">Websites Scanned</div>
            </div>
            <div>
              <div className="flex justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-blue-200" />
              </div>
              <div className="text-3xl font-bold mb-1">50,000+</div>
              <div className="text-blue-200">Violations Fixed</div>
            </div>
            <div>
              <div className="flex justify-center mb-2">
                <Clock className="h-8 w-8 text-blue-200" />
              </div>
              <div className="text-3xl font-bold mb-1">24/7</div>
              <div className="text-blue-200">Availability</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Ensure Compliance?
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Start scanning your website or checking your ad copy today. 
            Get instant results with actionable compliance recommendations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/scanner"
              className="btn-primary text-lg px-8 py-3 inline-flex items-center space-x-2"
            >
              <Scan className="h-5 w-5" />
              <span>Start Website Scan</span>
            </Link>
            <Link
              to="/ad-creator"
              className="btn-secondary text-lg px-8 py-3 inline-flex items-center space-x-2"
            >
              <FileText className="h-5 w-5" />
              <span>Check Ad Content</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}