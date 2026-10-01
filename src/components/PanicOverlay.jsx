import React, { useState } from 'react';
import { FileText, Share2, MessageSquare, History, EyeOff } from 'lucide-react';

export const PanicOverlay = ({ onExitPanic }) => {
  const [docContent, setDocContent] = useState(
    `Cellular Respiration and Photosynthesis in C3 Plants: A Comparative Synthesis

1. Overview and Energetics
Photosynthesis and cellular respiration are complementary biochemical pathways that drive the global carbon cycle. In eukaryotic autotrophs, photosynthetic light reactions harvest photons within thylakoid membranes, generating ATP and NADPH via non-cyclic electron transport. These high-energy intermediates fuel the Calvin-Benson cycle in the chloroplast stroma, where ribulose-1,5-bisphosphate carboxylase/oxygenase (RuBisCO) fixes atmospheric CO2 into 3-phosphoglycerate.

2. Glycolysis and the Citric Acid Cycle
Concurrently, cellular respiration liberates metabolic energy stored in hexose monomers through progressive enzymatic oxidation. Glycolysis converts glucose into pyruvate in the cytoplasm, yielding a net 2 ATP and 2 NADH. Under aerobic conditions, pyruvate enters mitochondrial matrices for oxidative decarboxylation, feeding acetyl-CoA into the tricarboxylic acid (TCA) cycle.

3. Oxidative Phosphorylation and Chemiosmosis
The electron transport chain (Complexes I-IV) on inner mitochondrial cristae establishes a steep electrochemical proton gradient across the intermembrane space. Proton flux through F0F1-ATP synthase couples exergonic chemiosmotic dissipation with ADP phosphorylation, generating approximately 30-32 moles of ATP per mole of oxidized glucose.

Notes for Discussion:
- Review enzyme regulation kinetics (phosphofructokinase-1 allosteric inhibitors: ATP, citrate)
- Prepare cross-section diagram of chloroplast vs mitochondrion for laboratory seminar.`
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#f8f9fa] text-slate-800 flex flex-col font-sans select-text">
      {/* Google Docs Style Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#1a73e8] flex items-center justify-center text-white">
            <FileText className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-medium text-slate-800 leading-tight">
                Cellular Respiration Essay Draft 2
              </span>
              <span className="text-2xs text-slate-400">Saved to Drive</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-600 mt-0.5">
              <span className="cursor-pointer hover:bg-slate-100 px-1 py-0.5 rounded">File</span>
              <span className="cursor-pointer hover:bg-slate-100 px-1 py-0.5 rounded">Edit</span>
              <span className="cursor-pointer hover:bg-slate-100 px-1 py-0.5 rounded">View</span>
              <span className="cursor-pointer hover:bg-slate-100 px-1 py-0.5 rounded">Insert</span>
              <span className="cursor-pointer hover:bg-slate-100 px-1 py-0.5 rounded">Format</span>
              <span className="cursor-pointer hover:bg-slate-100 px-1 py-0.5 rounded">Tools</span>
              <span className="cursor-pointer hover:bg-slate-100 px-1 py-0.5 rounded">Extensions</span>
              <span className="cursor-pointer hover:bg-slate-100 px-1 py-0.5 rounded">Help</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-slate-600 text-xs">
            <History className="w-4 h-4 cursor-pointer hover:text-slate-900" />
            <MessageSquare className="w-4 h-4 cursor-pointer hover:text-slate-900" />
          </div>

          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c2e7ff] hover:bg-[#b0dcfa] text-[#001d35] rounded-full text-xs font-medium transition-colors">
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {/* Discreet Exit Button */}
          <button
            onClick={onExitPanic}
            className="flex items-center gap-1 px-2.5 py-1 text-2xs text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer"
            title="Return to UnblockZone (or press ESC)"
          >
            <EyeOff className="w-3 h-3" />
            <span>Close View</span>
          </button>
        </div>
      </div>

      {/* Ribbon Toolbar */}
      <div className="bg-[#edf2fa] border-b border-slate-200 px-4 py-1.5 flex items-center gap-3 text-xs text-slate-600 overflow-x-auto">
        <span className="px-2 py-0.5 bg-white rounded border border-slate-200 font-serif">Times New Roman</span>
        <span className="px-2 py-0.5 bg-white rounded border border-slate-200">12</span>
        <div className="h-4 w-px bg-slate-300" />
        <span className="font-bold cursor-pointer">B</span>
        <span className="italic cursor-pointer">I</span>
        <span className="underline cursor-pointer">U</span>
        <div className="h-4 w-px bg-slate-300" />
        <span className="text-slate-500">100% Zoom</span>
        <span className="text-slate-400 ml-auto text-2xs">Press ESC to un-cloak</span>
      </div>

      {/* Paper Canvas */}
      <div className="flex-1 bg-[#f0f4f9] p-4 sm:p-8 overflow-y-auto flex justify-center">
        <div className="w-full max-w-[816px] min-h-[1056px] bg-white shadow-md p-12 sm:p-16 rounded-xs">
          <textarea
            value={docContent}
            onChange={(e) => setDocContent(e.target.value)}
            className="w-full h-full min-h-[800px] border-0 outline-hidden font-serif text-[15px] leading-relaxed text-slate-900 resize-none bg-transparent"
          />
        </div>
      </div>
    </div>
  );
};
