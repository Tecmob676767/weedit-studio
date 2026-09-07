import React, { useState, useEffect } from 'react';
import { TopNavBar } from './components/Header/TopNavBar';
import { AssetPanel } from './components/MediaLibrary/AssetPanel';
import { PreviewCanvas } from './components/Player/PreviewCanvas';
import { PropertiesInspector } from './components/Inspector/PropertiesInspector';
import { Timeline } from './components/Timeline/Timeline';
import { ExportModal } from './components/ExportModal';
import { projectStore } from './state/projectStore';
import { Play, Library, Settings, Clock } from 'lucide-react';

export const App: React.FC = () => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  // Mobile tab: 'media' | 'preview' | 'inspector' | 'timeline'
  const [mobileTab, setMobileTab] = useState<'media' | 'preview' | 'inspector' | 'timeline'>('preview');

  // Initialize demo project on initial launch if project has no clips
  useEffect(() => {
    const project = projectStore.getProject();
    if (project.clips.length === 0) {
      projectStore.loadDemoProject();
    }
  }, []);

  const mobileTabs = [
    { id: 'media' as const,     label: 'Media',     icon: Library },
    { id: 'preview' as const,   label: 'Preview',   icon: Play },
    { id: 'timeline' as const,  label: 'Timeline',  icon: Clock },
    { id: 'inspector' as const, label: 'Inspector', icon: Settings },
  ];

  return (
    <div className="flex flex-col w-screen h-[100dvh] bg-[#0a0c10] text-slate-100 overflow-hidden font-sans">
      {/* 1. Top Navigation Bar — always visible */}
      <TopNavBar onOpenExport={() => setIsExportOpen(true)} />

      {/* ── DESKTOP LAYOUT (md+) ── */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Left Media & Assets Panel */}
        <AssetPanel />
        {/* Center Real-Time Video Preview */}
        <PreviewCanvas />
        {/* Right Properties Inspector */}
        <PropertiesInspector />
      </div>
      <div className="hidden md:block flex-none">
        <Timeline />
      </div>

      {/* ── MOBILE LAYOUT (< md) ── */}
      {/* Tab content — fills available height between navbar and bottom tab bar */}
      <div className="md:hidden flex-1 overflow-hidden flex flex-col">
        <div className={`flex-1 overflow-hidden flex flex-col ${mobileTab === 'media'     ? '' : 'hidden'}`}><AssetPanel /></div>
        <div className={`flex-1 overflow-hidden flex flex-col ${mobileTab === 'preview'   ? '' : 'hidden'}`}><PreviewCanvas /></div>
        <div className={`flex-1 overflow-hidden flex flex-col ${mobileTab === 'timeline'  ? '' : 'hidden'}`}><Timeline /></div>
        <div className={`flex-1 overflow-hidden flex flex-col ${mobileTab === 'inspector' ? '' : 'hidden'}`}><PropertiesInspector /></div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden flex-none flex items-stretch bg-[#11141b] border-t border-slate-800 z-40">
        {mobileTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMobileTab(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
              mobileTab === id
                ? 'text-indigo-400 bg-indigo-950/40 border-t-2 border-indigo-500'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* 4. Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
};

export default App;
