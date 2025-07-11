
/**
 * Represents a single clickable area on a PDF page.
 * Coordinates and dimensions are stored as ratios (0 to 1) of the page's
 * width and height, making them independent of the render scale.
 */
export interface AnnotationRect {
  id: string; // Unique identifier for the annotation
  x: number;      // top-left x coordinate as a ratio
  y: number;      // top-left y coordinate as a ratio
  width: number;  // width as a ratio
  height: number; // height as a ratio
  url: string;    // The destination URL
}

/**
 * A map where keys are page numbers (1-based) and values are arrays
 * of annotations for that specific page.
 */
export type AnnotationsMap = Record<number, AnnotationRect[]>;
