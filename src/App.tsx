import React, { useState, useEffect } from 'react';
import { TopNavBar } from './components/Header/TopNavBar';
import { AssetPanel } from './components/MediaLibrary/AssetPanel';
import { PreviewCanvas } from './components/Player/PreviewCanvas';
import { PropertiesInspector } from './components/Inspector/PropertiesInspector';
import { Timeline } from './components/Timeline/Timeline';
import { ExportModal } from './components/ExportModal';
import { projectStore } from './state/projectStore';

export const App: React.FC = () => {
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Initialize demo project on initial launch if project has no clips
  useEffect(() => {
    const project = projectStore.getProject();
    if (project.clips.length === 0) {
      projectStore.loadDemoProject();
    }
  }, []);

  return (
    <div className="flex flex-col w-screen h-screen bg-[#0a0c10] text-slate-100 overflow-hidden font-sans">
      {/* 1. Pro Studio Top Navigation Bar */}
      <TopNavBar onOpenExport={() => setIsExportOpen(true)} />

      {/* 2. Main Studio Work Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Media & Assets Studio Panel */}
        <AssetPanel />

        {/* Center Real-Time Video Preview Canvas */}
        <PreviewCanvas />

        {/* Right Pro Inspector Panel */}
        <PropertiesInspector />
      </div>

      {/* 3. Multi-Track Non-Linear Editing (NLE) Timeline */}
      <Timeline />

      {/* 4. High-Definition Video Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
};

export default App;
