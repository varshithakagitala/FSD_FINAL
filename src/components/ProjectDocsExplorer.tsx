import React, { useState } from 'react';
import { BookOpen, Download, Code, CheckSquare, FileText, Copy, Check, ExternalLink } from 'lucide-react';
import { generateProjectZip } from '../utils/zipGenerator';

// File dictionary for instant code inspection and download
import { PROJECT_FILES } from '../utils/projectFiles';

export const ProjectDocsExplorer: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'report' | 'tests' | 'code'>('report');
  const [selectedFile, setSelectedFile] = useState<string>('pom.xml');
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const handleCopyCode = () => {
    const content = PROJECT_FILES[selectedFile] || '';
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const blob = await generateProjectZip(PROJECT_FILES);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'RescueGrid-FSD2-FullStack-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Could not generate ZIP archive: ' + e);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hub Header */}
      <div className="bg-slate-900 border border-slate-700 text-white rounded-xl p-6 shadow-md flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30">
              ACADEMIC DELIVERABLES & EVALUATION HUB
            </span>
          </div>
          <h1 className="text-2xl font-black">FSD-2 Mini Project Documentation & Code</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
            Complete academic project deliverables: 31-page formal project report, 18-case test suite, MySQL 8 schemas, Java Servlets, JDBC DAOs, and one-click ZIP download.
          </p>
        </div>

        {/* Big Download ZIP Button */}
        <button
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer transition-all"
        >
          <Download className="w-5 h-5" />
          <span>{isZipping ? 'Bundling Project ZIP...' : 'Download Complete Java Maven Project (.ZIP)'}</span>
        </button>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveSubTab('report')}
          className={`px-4 py-2 text-sm font-bold border-b-2 cursor-pointer transition-colors ${
            activeSubTab === 'report'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📄 31-Page Academic Report
        </button>

        <button
          onClick={() => setActiveSubTab('tests')}
          className={`px-4 py-2 text-sm font-bold border-b-2 cursor-pointer transition-colors ${
            activeSubTab === 'tests'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🧪 18 Test Cases Specification
        </button>

        <button
          onClick={() => setActiveSubTab('code')}
          className={`px-4 py-2 text-sm font-bold border-b-2 cursor-pointer transition-colors ${
            activeSubTab === 'code'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          💻 Java / JSP / SQL Source Code Inspector
        </button>
      </div>

      {/* Tab 1: 31-Page Academic Report */}
      {activeSubTab === 'report' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap justify-between items-center border-b border-slate-200 pb-3 gap-2">
            <div>
              <h2 className="font-extrabold text-lg text-slate-900">
                Academic Mini Project Report Draft (31 Pages Allocation)
              </h2>
              <p className="text-xs text-slate-500">
                Formatted for Microsoft Word / College Submissions with exact page allocations
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(PROJECT_FILES['docs/project-report.md'] || '');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Full 31-Page Markdown'}</span>
            </button>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 max-h-[600px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {PROJECT_FILES['docs/project-report.md']}
          </div>
        </div>
      )}

      {/* Tab 2: Test Cases */}
      {activeSubTab === 'tests' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3">
            <div>
              <h2 className="font-extrabold text-lg text-slate-900">
                RescueGrid Complete 18-Item Test Suite
              </h2>
              <p className="text-xs text-slate-500">
                Covers edge cases: duplicate emails, bad OTPs, expired tokens, cooldowns, role escalation
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(PROJECT_FILES['docs/test-cases.md'] || '');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>Copy Test Cases Markdown</span>
            </button>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 max-h-[600px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {PROJECT_FILES['docs/test-cases.md']}
          </div>
        </div>
      )}

      {/* Tab 3: Source Code Inspector */}
      {activeSubTab === 'code' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[580px]">
          {/* File Tree Sidebar */}
          <div className="w-full md:w-80 bg-slate-50 border-r border-slate-200 p-4 space-y-4 shrink-0">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Project File Hierarchy
            </div>

            <div className="space-y-1 text-xs">
              {Object.keys(PROJECT_FILES).map((path) => (
                <button
                  key={path}
                  onClick={() => setSelectedFile(path)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md font-mono text-[11px] truncate flex items-center gap-2 cursor-pointer transition-colors ${
                    selectedFile === path
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{path}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Code Viewer */}
          <div className="flex-1 flex flex-col bg-slate-950 text-slate-100">
            <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex justify-between items-center text-xs">
              <span className="font-mono text-emerald-400 font-bold">{selectedFile}</span>
              <button
                onClick={handleCopyCode}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy File'}</span>
              </button>
            </div>

            <pre className="p-4 overflow-auto flex-1 font-mono text-xs leading-relaxed text-slate-300">
              <code>{PROJECT_FILES[selectedFile] || '// Select a file from the tree'}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
