import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Scan, FileText, Info } from 'lucide-react';

export function Header() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">MediGuard AI</h1>
              <p className="text-xs text-gray-500">AHPRA Compliance Scanner</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>Home</span>
            </Link>

            <Link
              to="/scanner"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/scanner')
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <Scan className="h-4 w-4" />
              <span>Website Scanner</span>
            </Link>

            <Link
              to="/ad-creator"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/ad-creator')
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Ad Creator</span>
            </Link>

            <Link
              to="/about"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/about')
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <Info className="h-4 w-4" />
              <span>About</span>
            </Link>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600"
              aria-label="Open menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            to="/"
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
              isActive('/')
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            <Shield className="h-5 w-5" />
            <span>Home</span>
          </Link>

          <Link
            to="/scanner"
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
              isActive('/scanner')
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            <Scan className="h-5 w-5" />
            <span>Website Scanner</span>
          </Link>

          <Link
            to="/ad-creator"
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
              isActive('/ad-creator')
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="h-5 w-5" />
            <span>Ad Creator</span>
          </Link>

          <Link
            to="/about"
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
              isActive('/about')
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            <Info className="h-5 w-5" />
            <span>About</span>
          </Link>
        </div>
      </div>
    </header>
  );
}