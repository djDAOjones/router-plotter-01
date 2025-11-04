import { createDefaultProject, createSampleProject } from './core/defaultProject';
import { ProjectSchema } from './types/project';
import type { Project } from './types/project';
import { runGeometryTests, generateSmoothPath, buildArcLengthTable, getPositionAtArcLength, type Point } from './engine/geometry';
import { runTimingTests } from './engine/timing';
import { runRuntimeDemo } from './engine/runtime';

// Initialize the application
class RoutePlotterV2 {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentProject: Project;
  
  constructor() {
    // Get canvas element
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }
    
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = ctx;
    
    // Initialize with default project
    this.currentProject = createDefaultProject();
    
    // Setup canvas size
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Initial render
    this.render();
    
    // Log project info
    this.logProjectInfo();
  }
  
  private resizeCanvas(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  private render(): void {
    const { ctx, canvas } = this;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw geometry demo
    this.drawGeometryDemo();
    
    // Draw welcome message
    ctx.fillStyle = '#eee';
    ctx.font = '24px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Route Plotter v2 - Geometry Engine', canvas.width / 2, 40);
    
    // Show project info
    ctx.textAlign = 'left';
    ctx.font = '14px monospace';
    ctx.fillStyle = '#666';
    const info = [
      `Schema Version: ${this.currentProject.schemaVersion}`,
      `Title: ${this.currentProject.meta.title}`,
      `Tracks: ${this.currentProject.tracks.length}`,
      `Assets: ${this.currentProject.assets.length}`,
      `FPS: ${this.currentProject.settings.fps}`
    ];
    
    info.forEach((line, i) => {
      ctx.fillText(line, 20, canvas.height - 120 + (i * 20));
    });
  }
  
  private drawGeometryDemo(): void {
    const { ctx, canvas } = this;
    
    // Create a test path
    const points: Point[] = [
      { x: 100, y: 200 },
      { x: 250, y: 150 },
      { x: 400, y: 250 },
      { x: 550, y: 200 },
      { x: 700, y: 300 }
    ];
    
    // Generate smooth path
    const smoothPath = generateSmoothPath(points, 20);
    const distances = buildArcLengthTable(smoothPath);
    
    // Draw original points
    ctx.fillStyle = '#FF6B6B';
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw smooth path
    ctx.strokeStyle = '#4ECDC4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    smoothPath.forEach((point, i) => {
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
    
    // Draw position markers at intervals
    const totalLength = distances[distances.length - 1];
    const markers = [0.25, 0.5, 0.75];
    
    markers.forEach(ratio => {
      const targetLength = totalLength * ratio;
      const pos = getPositionAtArcLength(smoothPath, distances, targetLength);
      
      ctx.fillStyle = '#FFE66D';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Label
      ctx.fillStyle = '#fff';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(ratio * 100)}%`, pos.x, pos.y - 15);
    });
    
    // Legend
    ctx.fillStyle = '#888';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('Red dots: Original waypoints', 20, canvas.height - 180);
    ctx.fillText('Cyan line: Smooth Catmull-Rom path', 20, canvas.height - 160);
    ctx.fillText('Yellow dots: Position at arc-length percentages', 20, canvas.height - 140);
  }
  
  private logProjectInfo(): void {
    console.group('🚀 Route Plotter v2 Initialized');
    console.log('Current Project:', this.currentProject);
    
    // Validate schema
    try {
      const validated = ProjectSchema.parse(this.currentProject);
      console.log('✅ Schema validation passed');
      console.log('Validated project:', validated);
    } catch (error) {
      console.error('❌ Schema validation failed:', error);
    }
    
    console.log('📁 Project Structure:');
    console.log('  - src/core/       Core functionality');
    console.log('  - src/engine/     Animation and timing engine');
    console.log('  - src/renderer/   Canvas rendering');
    console.log('  - src/ui/         User interface components');
    console.log('  - src/persistence/ Save/load functionality');
    console.log('  - src/export/     Export pipelines');
    console.log('  - src/types/      TypeScript type definitions');
    console.groupEnd();
  }
  
  // Public API
  public loadProject(project: Project): void {
    try {
      const validated = ProjectSchema.parse(project);
      this.currentProject = validated;
      this.render();
      console.log('Project loaded successfully');
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  }
  
  public getProject(): Project {
    return this.currentProject;
  }
  
  public createSample(): void {
    this.loadProject(createSampleProject());
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    (window as any).app = new RoutePlotterV2();
    // Run tests on startup
    runGeometryTests();
    runTimingTests();
    runRuntimeDemo();
  });
} else {
  (window as any).app = new RoutePlotterV2();
  // Run tests on startup
  runGeometryTests();
  runTimingTests();
  runRuntimeDemo();
}

// Export for module usage
export { RoutePlotterV2 };
