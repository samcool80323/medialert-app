import React from 'react';
import { Shield, Users, Target, Award, ExternalLink, CheckCircle } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <Shield className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About MediGuard AI
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're dedicated to helping Australian medical and aesthetic practitioners 
            navigate the complex landscape of healthcare compliance with confidence and ease.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                Healthcare compliance shouldn't be a barrier to effective marketing. 
                MediGuard AI bridges the gap between regulatory requirements and 
                practical marketing needs, empowering practitioners to communicate 
                confidently while staying compliant.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                Our AI-powered platform analyzes real website content and marketing 
                materials against Australian healthcare regulations, providing 
                actionable insights and ready-to-use compliant alternatives.
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">AHPRA Compliant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">TGA Approved</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">ACL Compliant</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="card text-center">
                <Target className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Precision</h3>
                <p className="text-sm text-gray-600">
                  AI-powered analysis with context-aware violation detection
                </p>
              </div>
              <div className="card text-center">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Accessibility</h3>
                <p className="text-sm text-gray-600">
                  Easy-to-use platform designed for busy healthcare professionals
                </p>
              </div>
              <div className="card text-center">
                <Shield className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Reliability</h3>
                <p className="text-sm text-gray-600">
                  Comprehensive coverage of Australian healthcare regulations
                </p>
              </div>
              <div className="card text-center">
                <Award className="h-8 w-8 text-orange-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Excellence</h3>
                <p className="text-sm text-gray-600">
                  Continuously updated with latest regulatory changes
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Coverage */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comprehensive Compliance Coverage
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform covers all major Australian healthcare compliance requirements, 
              ensuring your marketing materials meet the highest standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">AHPRA National Law</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Section 133 compliance covering prohibited inducements, misleading claims, 
                testimonials, and unreasonable expectations.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Section 133(1)(a) - False or misleading statements</li>
                <li>• Section 133(1)(b) - Misleading advertising</li>
                <li>• Section 133(1)(c) - Prohibited testimonials</li>
                <li>• Section 133(1)(d) - Unreasonable expectations</li>
                <li>• Section 133(1)(e) - Prohibited inducements</li>
              </ul>
              <div className="mt-4">
                <a
                  href="https://www.ahpra.gov.au/Publications/Advertising-resources/Advertising-guidelines.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                >
                  <span>View AHPRA Guidelines</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Award className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">TGA Code</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Section 12 therapeutic goods advertising compliance, including 
                restricted claims and required disclaimers.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Therapeutic goods advertising restrictions</li>
                <li>• Unsubstantiated therapeutic claims</li>
                <li>• Required disclaimers and warnings</li>
                <li>• Comparative therapeutic claims</li>
                <li>• Restricted ingredient mentions</li>
              </ul>
              <div className="mt-4">
                <a
                  href="https://www.tga.gov.au/resources/resource/guidance/advertising-therapeutic-goods-guidance"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                >
                  <span>View TGA Code</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Australian Consumer Law</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Section 18 consumer protection compliance, preventing misleading 
                or deceptive conduct in healthcare marketing.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Misleading or deceptive conduct</li>
                <li>• False representations about services</li>
                <li>• Misleading pricing information</li>
                <li>• False availability claims</li>
                <li>• Consumer protection standards</li>
              </ul>
              <div className="mt-4">
                <a
                  href="https://www.accc.gov.au/business/advertising-promoting-your-business/false-or-misleading-claims"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                >
                  <span>View ACL Guidelines</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Advanced AI Technology
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines cutting-edge web scraping technology with 
              sophisticated AI analysis to deliver accurate, actionable compliance insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Real Website Scanning</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900">Multi-Page Analysis</h4>
                    <p className="text-gray-600 text-sm">
                      Scans up to 10 pages from your website, including service pages, 
                      about sections, and contact forms.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900">JavaScript Rendering</h4>
                    <p className="text-gray-600 text-sm">
                      Advanced browser automation captures dynamic content and 
                      JavaScript-rendered elements.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900">Content Categorization</h4>
                    <p className="text-gray-600 text-sm">
                      Intelligently categorizes content by page type and context 
                      for more accurate analysis.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">AI-Powered Analysis</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900">Context-Aware Detection</h4>
                    <p className="text-gray-600 text-sm">
                      AI understands the context of content to minimize false positives 
                      and provide accurate violation detection.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900">Severity Assessment</h4>
                    <p className="text-gray-600 text-sm">
                      Automatically ranks violations by severity to help you 
                      prioritize the most critical issues first.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900">Compliant Alternatives</h4>
                    <p className="text-gray-600 text-sm">
                      Generates specific, ready-to-use compliant alternatives 
                      for every violation found.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">Important Disclaimer</h3>
            <p className="text-gray-300 leading-relaxed">
              MediGuard AI is a compliance assistance tool designed to help identify potential 
              regulatory issues in healthcare marketing content. While we strive for accuracy 
              and keep our analysis updated with current regulations, this tool does not 
              constitute legal advice. The final responsibility for compliance with AHPRA, 
              TGA, and ACL regulations remains with the practitioner. We recommend consulting 
              with qualified legal professionals for specific compliance matters and complex 
              regulatory questions.
            </p>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Ensure Compliance?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of Australian medical practitioners who trust MediGuard AI 
            to keep their marketing compliant and effective.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/scanner"
              className="bg-white text-blue-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200 inline-flex items-center justify-center space-x-2"
            >
              <Shield className="h-5 w-5" />
              <span>Start Website Scan</span>
            </a>
            <a
              href="/ad-creator"
              className="bg-blue-700 hover:bg-blue-800 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200 inline-flex items-center justify-center space-x-2"
            >
              <Users className="h-5 w-5" />
              <span>Check Ad Content</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}