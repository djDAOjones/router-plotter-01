/**
 * Canvas 2D renderer with layered drawing system
 * Will implement:
 * - Base image layer
 * - Contrast overlay  
 * - Mask/unmask layer
 * - Vector paths, labels, and head markers
 */

import type { Project } from '../types/project';

export interface RenderState {
  time: number;
  normalizedProgress: number;
  currentSegmentIndex: number;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private project: Project | null = null;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = ctx;
  }
  
  setProject(project: Project): void {
    this.project = project;
  }
  
  drawFrame(_state: RenderState): void {
    // To be implemented in prompt #5
    // Will draw layers in order:
    // 1. Base image
    // 2. Contrast overlay
    // 3. Mask/unmask
    // 4. Vector paths/labels/head
  }
  
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
