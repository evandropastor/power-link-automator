import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnnotationRect } from '../types';
import UrlInput from './UrlInput';
import { Trash2Icon, EditIcon } from './Icons';

// --- Types ---
interface PageRendererProps {
  pdfDoc: any;
  pageNumber: number;
  annotations: AnnotationRect[];
  onAddAnnotation: (annotation: AnnotationRect) => void;
  onRemoveAnnotation: (id: string) => void;
  onUpdateAnnotation: (annotation: AnnotationRect) => void;
  zoomLevel: number;
}
type InteractionMode = 'none' | 'drawing' | 'moving' | 'resizing';
type ResizeHandle = 'top-left' | 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left';

// --- Component ---
export default function PageRenderer({
  pdfDoc,
  pageNumber,
  annotations,
  onAddAnnotation,
  onRemoveAnnotation,
  onUpdateAnnotation,
  zoomLevel,
}: PageRendererProps): React.ReactNode {
  // --- Refs ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const interactionRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null); // To manage pdf.js render tasks
  const interactionState = useRef<{
    mode: InteractionMode;
    startPoint: { x: number, y: number } | null;
    currentPoint: { x: number, y: number } | null;
    activeAnno: AnnotationRect | null;
    resizeHandle: ResizeHandle | null;
  }>({ mode: 'none', startPoint: null, currentPoint: null, activeAnno: null, resizeHandle: null }).current;

  // --- State ---
  const [selectedAnnoId, setSelectedAnnoId] = useState<string | null>(null);
  const [newAnnoCoords, setNewAnnoCoords] = useState<DOMRect | null>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<AnnotationRect | null>(null);
  const [renderCounter, setRenderCounter] = useState(0); // Used to force re-render of annotations for live-dragging
  const [containerWidth, setContainerWidth] = useState(0);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });

  // --- Callbacks & Effects ---
  const renderPage = useCallback(async () => {
    // Cancel any previous render task to avoid conflicts
    if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
    }

    if (!pdfDoc || !interactionRef.current || containerWidth <= 0) return;
    
    try {
        const page = await pdfDoc.getPage(pageNumber);
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) return;

        const dpr = window.devicePixelRatio || 1;
        
        // Calculate scale to fit container width, and apply zoom
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = (containerWidth / unscaledViewport.width) * zoomLevel;
        const viewport = page.getViewport({ scale: scale });
        
        setPageDimensions({ width: viewport.width, height: viewport.height });

        canvas.height = viewport.height * dpr;
        canvas.width = viewport.width * dpr;
        context.scale(dpr, dpr);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const renderTask = page.render({ canvasContext: context, viewport: viewport });
        renderTaskRef.current = renderTask; // Store the new task

        await renderTask.promise;
        renderTaskRef.current = null; // Clear on successful completion
    } catch (error: any) {
        // pdf.js throws a "RenderingCancelledException" when a render is cancelled.
        // We can safely ignore this as it's expected behavior.
        if (error.name !== 'RenderingCancelledException') {
            console.error(`Error rendering page ${pageNumber}:`, error);
        }
    }
  }, [pdfDoc, pageNumber, zoomLevel, containerWidth]);

  // Effect to observe container size changes and clean up
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        window.requestAnimationFrame(() => {
            const newWidth = entry.contentRect.width;
            setContainerWidth(newWidth);
        });
      }
    });

    const currentRef = interactionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    // Cleanup function
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      // Cancel any ongoing render task when the component unmounts
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, []); // Run only once on mount

  // Effect to render the page when dependencies change
  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // --- Mouse Event Handlers ---
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, anno?: AnnotationRect, handle?: ResizeHandle) => {
    if (editingAnnotation || newAnnoCoords) return;

    e.preventDefault();
    e.stopPropagation();

    const interactionEl = interactionRef.current;
    if (!interactionEl) return;
    
    const rect = interactionEl.getBoundingClientRect();
    const startPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    interactionState.startPoint = startPoint;
    interactionState.currentPoint = startPoint;

    if (anno) {
      setSelectedAnnoId(anno.id);
      interactionState.activeAnno = anno;
      if (handle) {
        interactionState.mode = 'resizing';
        interactionState.resizeHandle = handle;
      } else {
        interactionState.mode = 'moving';
      }
    } else {
      setSelectedAnnoId(null);
      interactionState.mode = 'drawing';
    }
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (interactionState.mode === 'none' || !interactionState.startPoint || !interactionRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = interactionRef.current.getBoundingClientRect();
    interactionState.currentPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    
    setRenderCounter(c => c + 1);
  }, [interactionState]);
  
  const handleMouseUp = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const { mode, activeAnno, startPoint, currentPoint } = interactionState;
    const interactionEl = interactionRef.current;
    
    if (mode === 'drawing' && startPoint && currentPoint) {
      const { width, height } = getDrawingRectStyle();
      if (width > 5 && height > 5) {
        const style = getDrawingRectStyle();
        setNewAnnoCoords(new DOMRect(style.left, style.top, style.width, style.height));
      }
    } else if ((mode === 'moving' || mode === 'resizing') && activeAnno && interactionEl) {
        const finalRect = getUpdatedRect(); // container-relative pixels
        const containerWidth = interactionEl.clientWidth;
        const { width: canvasWidth, height: canvasHeight } = pageDimensions;
        
        if (canvasWidth === 0 || canvasHeight === 0) return;

        const offsetX = (containerWidth - canvasWidth) / 2;
        
        const rawX = (finalRect.left - offsetX) / canvasWidth;
        const rawY = finalRect.top / canvasHeight;

        const clamp = (val: number) => Math.max(0, Math.min(val, 1));
        const finalX = clamp(rawX);
        const finalY = clamp(rawY);
        
        const finalWidth = Math.min(finalRect.width / canvasWidth, 1 - finalX);
        const finalHeight = Math.min(finalRect.height / canvasHeight, 1 - finalY);

        onUpdateAnnotation({
            ...activeAnno,
            x: finalX,
            y: finalY,
            width: finalWidth,
            height: finalHeight,
        });
    }

    // Reset interaction state
    interactionState.mode = 'none';
    interactionState.startPoint = null;
    interactionState.currentPoint = null;
    interactionState.activeAnno = null;
    interactionState.resizeHandle = null;

    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [interactionState, onUpdateAnnotation, handleMouseMove, pageDimensions]);


  // --- Annotation Logic ---
  const handleSaveAnnotation = (url: string) => {
    if (!newAnnoCoords || !interactionRef.current) return;
    const containerWidth = interactionRef.current.clientWidth;
    const { width: canvasWidth, height: canvasHeight } = pageDimensions;
    if (canvasWidth === 0 || canvasHeight === 0) return;

    const offsetX = (containerWidth - canvasWidth) / 2;

    onAddAnnotation({
        id: `anno-${Date.now()}`,
        x: (newAnnoCoords.x - offsetX) / canvasWidth,
        y: newAnnoCoords.y / canvasHeight,
        width: newAnnoCoords.width / canvasWidth,
        height: newAnnoCoords.height / canvasHeight,
        url: url,
    });
    setNewAnnoCoords(null);
  };

  const handleStartEdit = (e: React.MouseEvent, anno: AnnotationRect) => {
    e.stopPropagation();
    setEditingAnnotation(anno);
    setSelectedAnnoId(anno.id);
  };

  const handleSaveUrlEdit = (newUrl: string) => {
    if (!editingAnnotation) return;
    onUpdateAnnotation({ ...editingAnnotation, url: newUrl });
    setEditingAnnotation(null);
  };
  
  // --- Style & Geometry Calculations ---
  const getDrawingRectStyle = () => {
    if (interactionState.mode !== 'drawing' || !interactionState.startPoint || !interactionState.currentPoint) {
      return { display: 'none' };
    }
    const { startPoint, currentPoint } = interactionState;
    const left = Math.min(startPoint.x, currentPoint.x);
    const top = Math.min(startPoint.y, currentPoint.y);
    const width = Math.abs(startPoint.x - currentPoint.x);
    const height = Math.abs(startPoint.y - currentPoint.y);
    return { left, top, width, height };
  };
  
  const getUpdatedRect = (): { left: number; top: number; width: number; height: number; right?: number; bottom?: number; } => {
      const { mode, activeAnno, resizeHandle, startPoint, currentPoint } = interactionState;
      const interactionEl = interactionRef.current;
      if (!interactionEl || !activeAnno || !startPoint || !currentPoint) return { left: 0, top: 0, width: 0, height: 0 };
      
      const containerWidth = interactionEl.clientWidth;
      const { width: canvasWidth, height: canvasHeight } = pageDimensions;
      const offsetX = (containerWidth - canvasWidth) / 2;

      const initialRect = {
          left: offsetX + activeAnno.x * canvasWidth,
          top: activeAnno.y * canvasHeight,
          width: activeAnno.width * canvasWidth,
          height: activeAnno.height * canvasHeight,
          right: offsetX + (activeAnno.x + activeAnno.width) * canvasWidth,
          bottom: (activeAnno.y + activeAnno.height) * canvasHeight,
      };

      const dx = currentPoint.x - startPoint.x;
      const dy = currentPoint.y - startPoint.y;

      if (mode === 'moving') {
          return { ...initialRect, left: initialRect.left + dx, top: initialRect.top + dy };
      }

      if (mode === 'resizing') {
          let { left, top, right, bottom } = initialRect;
          if (resizeHandle?.includes('left')) left += dx;
          if (resizeHandle?.includes('right')) right += dx;
          if (resizeHandle?.includes('top')) top += dy;
          if (resizeHandle?.includes('bottom')) bottom += dy;
          
          return { left: Math.min(left, right), top: Math.min(top, bottom), width: Math.abs(left - right), height: Math.abs(top - bottom) };
      }
      return initialRect;
  };
  
  const getAnnoStyle = (anno: AnnotationRect): React.CSSProperties => {
    const interactionEl = interactionRef.current;
    if (interactionEl && pageDimensions.height > 0) {
        if (interactionState.mode !== 'none' && anno.id === interactionState.activeAnno?.id) {
            return getUpdatedRect();
        }
        const containerWidth = interactionEl.clientWidth;
        const { width: canvasWidth, height: canvasHeight } = pageDimensions;
        const offsetX = (containerWidth - canvasWidth) / 2;

        return {
            left: offsetX + anno.x * canvasWidth,
            top: anno.y * canvasHeight,
            width: anno.width * canvasWidth,
            height: anno.height * canvasHeight,
        };
    }
    return { left: 0, top: 0, width: 0, height: 0, display: 'none' }; // fallback
  };

   const getAnnoDomRect = (anno: AnnotationRect): DOMRect => {
    const style = getAnnoStyle(anno);
    return new DOMRect(style.left as number, style.top as number, style.width as number, style.height as number);
  };

  const handleWrapperClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setSelectedAnnoId(null);
    }
  };

  const handles: ResizeHandle[] = ['top-left', 'top', 'top-right', 'left', 'right', 'bottom-left', 'bottom', 'bottom-right'];

  // --- Render ---
  return (
    <div className="w-full bg-white dark:bg-slate-800 shadow-xl rounded-lg p-2 sm:p-4 flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-4 text-slate-600 dark:text-slate-300">
            Página {pageNumber}
        </h3>
        <div
            ref={interactionRef}
            className="relative select-none w-full"
            onMouseDown={handleMouseDown}
            onClick={handleWrapperClick}
            style={{
                height: pageDimensions.height > 0 ? `${pageDimensions.height}px` : 'auto',
                cursor: interactionState.mode === 'drawing' ? 'crosshair' : 'default',
            }}
        >
        <canvas ref={canvasRef} className="absolute top-0 left-1/2 -translate-x-1/2 shadow-lg" />
        
        {/* Live Drawing Rectangle */}
        <div className="absolute border-2 border-dashed border-blue-500 bg-blue-500/20 pointer-events-none" style={getDrawingRectStyle()} />

        {/* Saved Annotation Rectangles */}
        {annotations.map(anno => {
            const isSelected = selectedAnnoId === anno.id;
            const style = getAnnoStyle(anno);
            return (
                <div key={anno.id}
                className="absolute group"
                style={{ ...style, cursor: 'move' }}
                onMouseDown={(e) => handleMouseDown(e, anno)}
                onDoubleClick={(e) => handleStartEdit(e, anno)}
                >
                <div className={`w-full h-full transition-all rounded-sm ${isSelected ? 'bg-blue-500/50 border-2 border-blue-700' : 'bg-blue-500/30 border-2 border-blue-600 group-hover:bg-blue-500/50'}`} />
                
                <div className="absolute -top-3 -right-3 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button onClick={(e) => handleStartEdit(e, anno)} title="Editar URL"
                        className="bg-blue-600 text-white rounded-full p-1 shadow-md hover:bg-blue-700 transition-colors">
                        <EditIcon className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onRemoveAnnotation(anno.id); }} title="Remover"
                        className="bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 transition-colors">
                        <Trash2Icon className="w-4 h-4" />
                    </button>
                </div>

                {isSelected && handles.map(handle => (
                    <div key={handle}
                    className={`absolute w-3 h-3 bg-white border border-blue-700 rounded-full z-10 handle-${handle}`}
                    onMouseDown={(e) => handleMouseDown(e, anno, handle)}
                    />
                ))}
                </div>
            )
        })}

        {/* Input for NEW annotations */}
        {newAnnoCoords && (
            <UrlInput 
                coords={newAnnoCoords} 
                onSave={handleSaveAnnotation} 
                onCancel={() => setNewAnnoCoords(null)} 
            />
        )}
        
        {/* Input for EDITING annotations */}
        {editingAnnotation && (
            <UrlInput
                coords={getAnnoDomRect(editingAnnotation)}
                initialUrl={editingAnnotation.url}
                onSave={handleSaveUrlEdit}
                onCancel={() => setEditingAnnotation(null)}
            />
        )}
        
        <style>{`
            .handle-top-left { top: -6px; left: -6px; cursor: nwse-resize; }
            .handle-top { top: -6px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
            .handle-top-right { top: -6px; right: -6px; cursor: nesw-resize; }
            .handle-left { top: 50%; left: -6px; transform: translateY(-50%); cursor: ew-resize; }
            .handle-right { top: 50%; right: -6px; transform: translateY(-50%); cursor: ew-resize; }
            .handle-bottom-left { bottom: -6px; left: -6px; cursor: nesw-resize; }
            .handle-bottom { bottom: -6px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
            .handle-bottom-right { bottom: -6px; right: -6px; cursor: nwse-resize; }
        `}</style>
        </div>
    </div>
  );
}