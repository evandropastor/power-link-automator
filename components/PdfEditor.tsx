import React from 'react';
import { AnnotationsMap, AnnotationRect } from '../types';
import PageRenderer from './PageRenderer';

interface PdfEditorProps {
  pdfDoc: any; // pdf.js document proxy
  annotations: AnnotationsMap;
  addAnnotation: (page: number, annotation: AnnotationRect) => void;
  removeAnnotation: (page: number, id: string) => void;
  updateAnnotation: (page: number, annotation: AnnotationRect) => void;
  zoomLevel: number;
}

export default function PdfEditor({
  pdfDoc,
  annotations,
  addAnnotation,
  removeAnnotation,
  updateAnnotation,
  zoomLevel,
}: PdfEditorProps): React.ReactNode {
  const pageNumbers = Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1);

  return (
    <div className="w-full h-full flex justify-center overflow-y-auto bg-slate-200 dark:bg-slate-700 rounded-lg">
      <div className="flex flex-col items-center gap-8 py-8 w-full max-w-5xl px-2">
        {pageNumbers.map(pageNumber => (
          <PageRenderer
            key={pageNumber}
            pdfDoc={pdfDoc}
            pageNumber={pageNumber}
            annotations={annotations[pageNumber] || []}
            onAddAnnotation={(annotation) => addAnnotation(pageNumber, annotation)}
            onRemoveAnnotation={(id) => removeAnnotation(pageNumber, id)}
            onUpdateAnnotation={(annotation) => updateAnnotation(pageNumber, annotation)}
            zoomLevel={zoomLevel}
          />
        ))}
         <p className="py-4 text-md text-slate-600 dark:text-slate-400 font-medium text-center px-4">
            Clique e arraste para criar uma área de link. Clique em uma área para movê-la ou redimensioná-la.
        </p>
      </div>
    </div>
  );
}
