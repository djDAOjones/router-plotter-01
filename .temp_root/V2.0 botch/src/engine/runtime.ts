/**
 * Deterministic runtime engine
 * Provides frame-perfect consistency between preview and export
 * Uses fixed-step clock for deterministic behavior
 */

import type { SegmentTimingMap } from './timing';
import { getNormalizedProgressAtTime, getTimeAtNormalizedProgress, getCurrentSegment, buildTimingMap } from './timing';
import type { Waypoint } from '../types/project';

export interface RuntimeState {
  time: number;
  normalizedProgress: number;
  currentSegmentIndex: number;
  isPlaying: boolean;
  speed: number;
  frame: number;
  fps: number;
}

export interface RuntimeConfig {
  fps: number;
  totalDuration: number;
}

/**
 * Deterministic runtime with fixed-step clock
 */
export class DeterministicRuntime {
  private config: RuntimeConfig;
  private timingMap: SegmentTimingMap | null = null;
  private state: RuntimeState;
  private accumulatedTime: number = 0;
  private lastTimestamp: number | null = null;
  
  constructor(config: RuntimeConfig) {
    this.config = config;
    this.state = {
      time: 0,
      normalizedProgress: 0,
      currentSegmentIndex: 0,
      isPlaying: false,
      speed: 1.0,
      frame: 0,
      fps: config.fps
    };
  }
  
  /**
   * Set the timing map for the runtime
   */
  setTimingMap(timingMap: SegmentTimingMap): void {
    this.timingMap = timingMap;
    this.config.totalDuration = timingMap.totalDuration;
    this.reset();
  }
  
  /**
   * Reset runtime to initial state
   */
  reset(): void {
    this.state.time = 0;
    this.state.normalizedProgress = 0;
    this.state.currentSegmentIndex = 0;
    this.state.frame = 0;
    this.accumulatedTime = 0;
    this.lastTimestamp = null;
  }
  
  /**
   * Get fixed time step based on FPS
   */
  getFixedTimeStep(): number {
    return 1.0 / this.config.fps;
  }
  
  /**
   * Advance simulation by one fixed step
   */
  step(): void {
    if (!this.timingMap) return;
    
    const dt = this.getFixedTimeStep() * this.state.speed;
    
    if (this.state.isPlaying) {
      this.state.time += dt;
      
      // Clamp to total duration
      if (this.state.time >= this.config.totalDuration) {
        this.state.time = this.config.totalDuration;
        this.state.isPlaying = false;
      }
      
      // Update normalized progress
      this.state.normalizedProgress = getNormalizedProgressAtTime(this.timingMap, this.state.time);
      
      // Update current segment
      const segment = getCurrentSegment(this.timingMap, this.state.time);
      if (segment) {
        this.state.currentSegmentIndex = this.timingMap.segments.indexOf(segment);
      }
      
      this.state.frame++;
    }
  }
  
  /**
   * Seek to specific time
   */
  seekToTime(time: number): void {
    if (!this.timingMap) return;
    
    this.state.time = Math.max(0, Math.min(time, this.config.totalDuration));
    this.state.normalizedProgress = getNormalizedProgressAtTime(this.timingMap, this.state.time);
    
    const segment = getCurrentSegment(this.timingMap, this.state.time);
    if (segment) {
      this.state.currentSegmentIndex = this.timingMap.segments.indexOf(segment);
    }
    
    this.state.frame = Math.floor(this.state.time * this.config.fps);
  }
  
  /**
   * Seek to normalized progress [0,1]
   */
  seekToNormalizedProgress(progress: number): void {
    if (!this.timingMap) return;
    
    this.state.normalizedProgress = Math.max(0, Math.min(progress, 1));
    this.state.time = getTimeAtNormalizedProgress(this.timingMap, this.state.normalizedProgress);
    
    const segment = getCurrentSegment(this.timingMap, this.state.time);
    if (segment) {
      this.state.currentSegmentIndex = this.timingMap.segments.indexOf(segment);
    }
    
    this.state.frame = Math.floor(this.state.time * this.config.fps);
  }
  
  /**
   * Start playback
   */
  play(): void {
    this.state.isPlaying = true;
  }
  
  /**
   * Pause playback
   */
  pause(): void {
    this.state.isPlaying = false;
  }
  
  /**
   * Toggle play/pause
   */
  togglePlayPause(): void {
    this.state.isPlaying = !this.state.isPlaying;
  }
  
  /**
   * Set playback speed multiplier
   */
  setSpeed(speed: number): void {
    this.state.speed = Math.max(0.25, Math.min(speed, 8.0));
  }
  
  /**
   * Jump to start
   */
  seekToStart(): void {
    this.seekToTime(0);
  }
  
  /**
   * Jump to end
   */
  seekToEnd(): void {
    this.seekToTime(this.config.totalDuration);
  }
  
  /**
   * Get current runtime state
   */
  getCurrentState(): RuntimeState {
    return { ...this.state };
  }
  
  /**
   * Check if runtime has reached the end
   */
  isAtEnd(): boolean {
    return this.state.time >= this.config.totalDuration - 0.001;
  }
  
  /**
   * Get total number of frames
   */
  getTotalFrames(): number {
    return Math.ceil(this.config.totalDuration * this.config.fps);
  }
  
  /**
   * Get current frame number
   */
  getCurrentFrame(): number {
    return this.state.frame;
  }
  
  /**
   * Seek to specific frame number
   */
  seekToFrame(frame: number): void {
    const time = frame / this.config.fps;
    this.seekToTime(time);
  }
  
  /**
   * Update runtime with timestamp (for real-time preview)
   * Uses fixed-step accumulation for deterministic behavior
   */
  update(timestamp: number): void {
    if (!this.state.isPlaying) return;
    
    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp;
    }
    
    const deltaTime = (timestamp - this.lastTimestamp) / 1000; // Convert to seconds
    this.lastTimestamp = timestamp;
    
    // Accumulate time
    this.accumulatedTime += deltaTime * this.state.speed;
    
    // Step simulation in fixed increments
    const fixedStep = this.getFixedTimeStep();
    while (this.accumulatedTime >= fixedStep) {
      this.step();
      this.accumulatedTime -= fixedStep;
    }
  }
}

// Test function
export function runRuntimeDemo(): void {
  console.group('🕐 Deterministic Runtime Demo');
  
  try {
    // Create test timing map with 3 majors
    const waypoints: Waypoint[] = [
      { id: 'wp1', x: 0, y: 0, isMajor: true },
      { id: 'wp2', x: 100, y: 0, isMajor: false },
      { id: 'wp3', x: 200, y: 0, isMajor: true },
      { id: 'wp4', x: 300, y: 0, isMajor: false },
      { id: 'wp5', x: 400, y: 0, isMajor: true },
      { id: 'wp6', x: 500, y: 0, isMajor: false },
      { id: 'wp7', x: 600, y: 0, isMajor: true }
    ];
    
    // Build timing map
    const timingMap = buildTimingMap(waypoints, {
      mode: 'constantTime',
      baseSpeedPxPerSec: 200,
      pauseMode: 'seconds',
      pauseSeconds: 2,
      easeInOut: true
    });
    
    // Create runtime
    const runtime = new DeterministicRuntime({
      fps: 25,
      totalDuration: timingMap.totalDuration
    });
    
    runtime.setTimingMap(timingMap);
    
    console.log(`Runtime initialized:`);
    console.log(`  FPS: ${runtime.getCurrentState().fps}`);
    console.log(`  Total duration: ${timingMap.totalDuration.toFixed(1)}s`);
    console.log(`  Total frames: ${runtime.getTotalFrames()}`);
    console.log(`  Fixed time step: ${(runtime.getFixedTimeStep() * 1000).toFixed(1)}ms`);
    
    // Demo 1: Step through animation
    console.log('\nDemo 1: Stepping through animation');
    runtime.play();
    
    for (let i = 0; i < 10; i++) {
      runtime.step();
      const state = runtime.getCurrentState();
      console.log(`  Frame ${state.frame}: t=${state.time.toFixed(2)}s, progress=${state.normalizedProgress.toFixed(3)}, segment=${state.currentSegmentIndex}`);
    }
    
    // Demo 2: Seek operations
    console.log('\nDemo 2: Seek operations');
    
    runtime.seekToTime(5);
    let state = runtime.getCurrentState();
    console.log(`  Seek to 5s: progress=${state.normalizedProgress.toFixed(3)}, frame=${state.frame}`);
    
    runtime.seekToNormalizedProgress(0.5);
    state = runtime.getCurrentState();
    console.log(`  Seek to 50%: time=${state.time.toFixed(2)}s, frame=${state.frame}`);
    
    runtime.seekToFrame(100);
    state = runtime.getCurrentState();
    console.log(`  Seek to frame 100: time=${state.time.toFixed(2)}s, progress=${state.normalizedProgress.toFixed(3)}`);
    
    // Demo 3: Speed multipliers
    console.log('\nDemo 3: Speed multipliers');
    runtime.reset();
    runtime.play();
    
    console.log(`  Normal speed (1x):`);
    for (let i = 0; i < 5; i++) {
      runtime.step();
    }
    console.log(`    After 5 steps: time=${runtime.getCurrentState().time.toFixed(2)}s`);
    
    runtime.reset();
    runtime.setSpeed(2.0);
    console.log(`  Double speed (2x):`);
    for (let i = 0; i < 5; i++) {
      runtime.step();
    }
    console.log(`    After 5 steps: time=${runtime.getCurrentState().time.toFixed(2)}s`);
    
    // Demo 4: Deterministic test
    console.log('\nDemo 4: Deterministic behavior test');
    runtime.reset();
    runtime.setSpeed(1.0);
    
    // Run simulation twice with same operations
    const results1: number[] = [];
    const results2: number[] = [];
    
    // First run
    runtime.seekToNormalizedProgress(0.25);
    runtime.play();
    for (let i = 0; i < 10; i++) {
      runtime.step();
      results1.push(runtime.getCurrentState().normalizedProgress);
    }
    
    // Second run (should be identical)
    runtime.reset();
    runtime.seekToNormalizedProgress(0.25);
    runtime.play();
    for (let i = 0; i < 10; i++) {
      runtime.step();
      results2.push(runtime.getCurrentState().normalizedProgress);
    }
    
    // Check consistency
    let isDeterministic = true;
    for (let i = 0; i < results1.length; i++) {
      if (Math.abs(results1[i] - results2[i]) > 0.0001) {
        isDeterministic = false;
        break;
      }
    }
    
    console.log(`  Deterministic check: ${isDeterministic ? '✅ PASSED' : '❌ FAILED'}`);
    if (isDeterministic) {
      console.log(`    Both runs produced identical results`);
    }
    
    console.log('\n✅ Runtime demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Runtime demo failed:', error);
  }
  
  console.groupEnd();
}
