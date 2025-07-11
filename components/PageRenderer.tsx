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
  const [renderCounter, setRenderCounter] = useState(0); // Used to force re-render of annotations

  // --- Callbacks & Effects ---
  const renderPage = useCallback(async () => {
    if (!pdfDoc) return;
    const page = await pdfDoc.getPage(pageNumber);
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const dpr = window.devicePixelRatio || 1;
    // Use the zoomLevel prop to control the scale of the viewport
    const viewport = page.getViewport({ scale: zoomLevel });
    
    canvas.height = viewport.height * dpr;
    canvas.width = viewport.width * dpr;
    context.scale(dpr, dpr);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    await page.render({ canvasContext: context, viewport: viewport }).promise;
    setRenderCounter(c => c + 1); // Force re-render of annotations
  }, [pdfDoc, pageNumber, zoomLevel]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // --- Mouse Event Handlers ---
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, anno?: AnnotationRect, handle?: ResizeHandle) => {
    // Prevent starting a move/resize/draw if an edit is in progress
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
    
    // Force a re-render to show live updates
    setRenderCounter(c => c + 1);
  }, [interactionState]);
  
  const handleMouseUp = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const { mode, activeAnno, startPoint, currentPoint } = interactionState;
    
    if (mode === 'drawing' && startPoint && currentPoint) {
      const { width, height } = getDrawingRectStyle();
      if (width > 5 && height > 5) {
        const style = getDrawingRectStyle();
        setNewAnnoCoords(new DOMRect(style.left, style.top, style.width, style.height));
      }
    } else if ((mode === 'moving' || mode === 'resizing') && activeAnno && interactionRef.current) {
        const finalRect = getUpdatedRect();
        const { clientWidth, clientHeight } = interactionRef.current;

        onUpdateAnnotation({
            ...activeAnno,
            x: finalRect.left / clientWidth,
            y: finalRect.top / clientHeight,
            width: finalRect.width / clientWidth,
            height: finalRect.height / clientHeight,
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
  }, [interactionState, onUpdateAnnotation, handleMouseMove]);


  // --- Annotation Logic ---
  const handleSaveAnnotation = (url: string) => {
    if (!newAnnoCoords || !interactionRef.current) return;
    const { clientWidth, clientHeight } = interactionRef.current;
    
    onAddAnnotation({
        id: `anno-${Date.now()}`,
        x: newAnnoCoords.x / clientWidth,
        y: newAnnoCoords.y / clientHeight,
        width: newAnnoCoords.width / clientWidth,
        height: newAnnoCoords.height / clientHeight,
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
  
  const getUpdatedRect = () => {
      const { mode, activeAnno, resizeHandle, startPoint, currentPoint } = interactionState;
      if (!interactionRef.current || !activeAnno) return { left: 0, top: 0, width: 0, height: 0 };
      const { clientWidth, clientHeight } = interactionRef.current;

      const initialRect = {
          left: activeAnno.x * clientWidth,
          top: activeAnno.y * clientHeight,
          width: activeAnno.width * clientWidth,
          height: activeAnno.height * clientHeight,
          right: (activeAnno.x + activeAnno.width) * clientWidth,
          bottom: (activeAnno.y + activeAnno.height) * clientHeight,
      };

      if (!startPoint || !currentPoint) return initialRect;
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
  
  const getAnnoStyle = (anno: AnnotationRect) => {
    if (interactionRef.current) {
        if (interactionState.mode !== 'none' && anno.id === interactionState.activeAnno?.id) {
            return getUpdatedRect();
        }
        const { clientWidth, clientHeight } = interactionRef.current;
        return {
            left: anno.x * clientWidth,
            top: anno.y * clientHeight,
            width: anno.width * clientWidth,
            height: anno.height * clientHeight,
        };
    }
    return { left: 0, top: 0, width: 0, height: 0 }; // fallback
  };

   const getAnnoDomRect = (anno: AnnotationRect): DOMRect => {
    const style = getAnnoStyle(anno);
    return new DOMRect(style.left, style.top, style.width, style.height);
  };

  const handleWrapperClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If we click the background but not starting a drag, deselect any active annotation
    if (e.target === e.currentTarget) {
      setSelectedAnnoId(null);
    }
  };

  const handles: ResizeHandle[] = ['top-left', 'top', 'top-right', 'left', 'right', 'bottom-left', 'bottom', 'bottom-right'];
  const canvasWidth = canvasRef.current?.style.width;
  const canvasHeight = canvasRef.current?.style.height;

  // --- Render ---
  return (
    <div
      ref={interactionRef}
      className="relative select-none"
      onMouseDown={handleMouseDown}
      onClick={handleWrapperClick}
      style={{
          width: canvasWidth,
          height: canvasHeight,
          cursor: interactionState.mode === 'drawing' ? 'crosshair' : 'default',
      }}
    >
      <canvas ref={canvasRef} className="absolute top-0 left-0" />
      
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
  );
}