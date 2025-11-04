/**
 * Export pipeline for WebM and PNG sequence
 * Will implement:
 * - WebM export via captureStream and MediaRecorder
 * - PNG sequence export as fallback
 * - Deterministic frame rendering at 25 fps
 */

import type { Project } from '../types/project';

export interface ExportOptions {
  format: 'webm' | 'pngSequence';
  fps: number;
  includeAlpha: boolean;
}

export class VideoExporter {
  private canvas: HTMLCanvasElement;
  private project: Project | null = null;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }
  
  setProject(project: Project): void {
    this.project = project;
  }
  
  async exportVideo(_options: ExportOptions): Promise<Blob> {
    // To be implemented in prompt #12
    return new Blob();
  }
  
  async exportPNGSequence(_options: ExportOptions): Promise<Blob[]> {
    // To be implemented in prompt #12
    return [];
  }
}
