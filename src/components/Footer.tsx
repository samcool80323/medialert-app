import React from 'react';
import { Shield, ExternalLink } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-8 w-8 text-blue-400" />
              <div>
                <h3 className="text-xl font-bold">MediGuard AI</h3>
                <p className="text-sm text-gray-400">AHPRA Compliance Scanner</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Helping Australian medical and aesthetic practitioners ensure their digital marketing 
              complies with AHPRA National Law, TGA Code, and Australian Consumer Law.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://github.com/mediguard-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="/scanner" className="text-gray-300 hover:text-white transition-colors">
                  Website Scanner
                </a>
              </li>
              <li>
                <a href="/ad-creator" className="text-gray-300 hover:text-white transition-colors">
                  Ad Creator
                </a>
              </li>
              <li>
                <a href="/about" className="text-gray-300 hover:text-white transition-colors">
                  About
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.ahpra.gov.au/Publications/Advertising-resources/Advertising-guidelines.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <span>AHPRA Guidelines</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.tga.gov.au/resources/resource/guidance/advertising-therapeutic-goods-guidance"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <span>TGA Advertising Code</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.accc.gov.au/business/advertising-promoting-your-business/false-or-misleading-claims"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <span>ACL Guidelines</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/mediguard-ai/mediguard/blob/main/docs/API.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <span>API Documentation</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © {currentYear} MediGuard AI. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="/contact" className="text-gray-400 hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
          
          {/* Disclaimer */}
          <div className="mt-6 p-4 bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-400 leading-relaxed">
              <strong className="text-gray-300">Disclaimer:</strong> MediGuard AI is a compliance assistance tool. 
              While we strive for accuracy, this tool does not constitute legal advice. Users should consult 
              with qualified legal professionals for specific compliance matters. The final responsibility 
              for compliance with AHPRA, TGA, and ACL regulations remains with the practitioner.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}