import { AnnotationsMap } from './types';

// Access pdf-lib library from the window object, loaded via CDN
const { PDFLib } = window as any;
const { PDFDocument } = PDFLib;

/**
 * Adds URL link annotations to a PDF document based on user-defined rectangles.
 * @param originalPdfBytes The ArrayBuffer of the original PDF file.
 * @param annotationsByPage A map of annotations, keyed by page number.
 * @returns A Promise that resolves with a Uint8Array of the modified PDF.
 */
export const exportPdfWithAnnotations = async (
  originalPdfBytes: ArrayBuffer,
  annotationsByPage: AnnotationsMap
): Promise<Uint8Array> => {
  if (!PDFDocument) {
    throw new Error('pdf-lib is not loaded!');
  }

  // Load the original PDF document
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const pages = pdfDoc.getPages();

  // Iterate over the pages that have annotations
  for (const pageNumberStr in annotationsByPage) {
    const pageNumber = parseInt(pageNumberStr, 10);
    // Page numbers in the map are 1-based, array is 0-based
    const pageIndex = pageNumber - 1; 

    if (pageIndex >= 0 && pageIndex < pages.length) {
      const page = pages[pageIndex];
      const annotationsForPage = annotationsByPage[pageNumber];
      const { width: pageWidth, height: pageHeight } = page.getSize();

      annotationsForPage.forEach(annotation => {
        // Convert ratio-based coordinates to PDF points
        const rect = {
          x: annotation.x * pageWidth,
          y: pageHeight - (annotation.y * pageHeight) - (annotation.height * pageHeight), // pdf-lib y-origin is bottom-left
          width: annotation.width * pageWidth,
          height: annotation.height * pageHeight,
        };
        
        // Create the link annotation
        const linkAnnotation = pdfDoc.context.obj({
            Type: 'Annot',
            Subtype: 'Link',
            Rect: [rect.x, rect.y, rect.x + rect.width, rect.y + rect.height],
            Border: [0, 0, 1], // Optional: defines border width, here a thin blue border
            C: [0, 0, 1], // Optional: set border color to blue
            A: {
                Type: 'Action',
                S: 'URI',
                URI: PDFLib.PDFString.of(annotation.url),
            },
        });

        // Add the annotation to the page
        page.node.addAnnot(page.doc.context.register(linkAnnotation));
      });
    }
  }

  // Serialize the modified PDFDocument to bytes (a Uint8Array)
  return pdfDoc.save();
};
