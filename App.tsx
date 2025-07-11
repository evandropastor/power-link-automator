
import React, { useState, useCallback } from 'react';
import { AnnotationsMap, AnnotationRect } from './types';
import { exportPdfWithAnnotations } from './services/pdfService';
import PdfEditor from './components/PdfEditor';
import { UploadCloudIcon, LockIcon, ZoomInIcon, ZoomOutIcon } from './components/Icons';

// Access pdf.js library from the window object, loaded via CDN
const { pdfjsLib } = window as any;

export default function App(): React.ReactNode {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null); // Using 'any' for pdfjs document proxy
  const [annotations, setAnnotations] = useState<AnnotationsMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%

  const processFile = useCallback(async (file: File | undefined) => {
    if (file && file.type === 'application/pdf') {
      setIsLoading(true);
      setError(null);
      setPdfFile(file);
      setAnnotations({});
      setZoomLevel(1); // Reset zoom on new file

      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDocProxy = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setPdfDoc(pdfDocProxy);
      } catch (e) {
        setError('Falha ao carregar o PDF. O arquivo pode estar corrompido.');
        console.error(e);
        setPdfFile(null);
      } finally {
        setIsLoading(false);
      }
    } else if (file) {
      setError("Por favor, solte um arquivo PDF válido.");
    }
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    await processFile(file);
     // Reset file input to allow re-uploading the same file
    if (event.target) {
        event.target.value = '';
    }
  }, [processFile]);
  
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.types.includes('Files')) {
        setIsDraggingOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
    
    const file = event.dataTransfer.files?.[0];
    await processFile(file);
  }, [processFile]);

  const addAnnotation = useCallback((page: number, annotation: AnnotationRect) => {
    setAnnotations(prev => ({
      ...prev,
      [page]: [...(prev[page] || []), annotation],
    }));
  }, []);

  const removeAnnotation = useCallback((page: number, id: string) => {
    setAnnotations(prev => ({
      ...prev,
      [page]: (prev[page] || []).filter(a => a.id !== id),
    }));
  }, []);

  const updateAnnotation = useCallback((page: number, updatedAnnotation: AnnotationRect) => {
    setAnnotations(prev => {
      const pageAnnotations = (prev[page] || []).map(anno => 
        anno.id === updatedAnnotation.id ? updatedAnnotation : anno
      );
      return {
        ...prev,
        [page]: pageAnnotations,
      };
    });
  }, []);

  const handleExport = async () => {
    if (!pdfFile) return;
    setIsExporting(true);
    setError(null);
    try {
      const originalPdfBytes = await pdfFile.arrayBuffer();
      const modifiedPdfBytes = await exportPdfWithAnnotations(originalPdfBytes, annotations);
      
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `linked-${pdfFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (e) {
      console.error("Export failed:", e);
      setError("Falha ao exportar o PDF. Por favor, tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.25));

  return (
    <div 
      className="min-h-screen flex flex-col font-sans"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <header className="bg-white dark:bg-slate-800 shadow-md p-4 flex justify-between items-center z-20 shrink-0">
        <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">Power Link Automator</h1>
        <div className="flex items-center gap-4">
          {pdfFile && (
            <>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                  <button onClick={handleZoomOut} title="Diminuir Zoom" className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" aria-label="Diminuir zoom">
                      <ZoomOutIcon className="w-5 h-5"/>
                  </button>
                  <span className="font-semibold text-sm w-12 text-center select-none" aria-live="polite">{Math.round(zoomLevel * 100)}%</span>
                  <button onClick={handleZoomIn} title="Aumentar Zoom" className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" aria-label="Aumentar zoom">
                      <ZoomInIcon className="w-5 h-5"/>
                  </button>
              </div>
              <label htmlFor="file-upload" className="cursor-pointer bg-slate-600 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                Trocar PDF
              </label>
              <button
                onClick={handleExport}
                disabled={isExporting || Object.keys(annotations).length === 0}
                className="bg-blue-600 text-white hover:bg-blue-700 font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:dark:bg-slate-600"
              >
                {isExporting ? 'Exportando...' : 'Exportar PDF com Links'}
              </button>
            </>
          )}
          <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf" />
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center p-4 lg:p-8 overflow-auto">
        {error && <div className="absolute top-20 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md z-30" role="alert">{error}</div>}
        
        {!pdfFile && !isLoading && (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <label
             htmlFor="file-upload"
             className={`w-full max-w-2xl h-full max-h-[50vh] min-h-[300px] rounded-2xl border-4 border-dashed flex flex-col items-center justify-center text-center p-8 cursor-pointer transition-colors duration-300 ${
               isDraggingOver
                 ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/30'
                 : 'border-slate-400/80 dark:border-slate-600/80 hover:border-blue-500/80 hover:bg-slate-50 dark:hover:bg-slate-800/40'
             }`}
           >
             <UploadCloudIcon className="mx-auto h-24 w-24 text-slate-400 dark:text-slate-500 mb-4" />
             <h2 className="mt-4 text-2xl font-semibold">
               Arraste e solte seu PDF aqui
             </h2>
             <p className="mt-2 text-slate-600 dark:text-slate-400">
               ou <span className="text-blue-600 dark:text-blue-400 font-semibold">clique para selecionar</span>
             </p>
           </label>
           <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
             <LockIcon className="h-4 w-4" />
             <span>Seus arquivos são processados localmente e nunca são enviados para um servidor.</span>
           </div>
          </div>
        )}

        {isLoading && (
           <div className="flex flex-col items-center justify-center my-auto">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-lg font-semibold">Carregando PDF...</p>
          </div>
        )}

        {!isLoading && pdfDoc && (
          <PdfEditor
            pdfDoc={pdfDoc}
            annotations={annotations}
            addAnnotation={addAnnotation}
            removeAnnotation={removeAnnotation}
            updateAnnotation={updateAnnotation}
            zoomLevel={zoomLevel}
          />
        )}
      </main>
    </div>
  );
}
