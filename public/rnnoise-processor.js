/**
 * RNNoise-inspired Audio Worklet Processor
 * Implements spectral noise gate with adaptive thresholding for noise suppression
 * This is a simplified implementation that doesn't require external WASM dependencies
 */

class RNNoiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    this.ready = false;
    this.frameSize = 128; // Process in chunks for efficiency
    this.sampleRate = 48000;
    
    // Noise gate parameters
    this.noiseFloor = 0.01; // Initial noise floor estimate
    this.gateThreshold = 0.02; // Threshold for noise gate
    this.attackTime = 0.001; // 1ms attack
    this.releaseTime = 0.1; // 100ms release
    this.smoothingFactor = 0.98; // For exponential smoothing
    
    // State variables
    this.prevGain = 0;
    this.energyHistory = [];
    this.historySize = 100;
    
    // Initialize immediately - no WASM needed
    this.ready = true;
    this.port.postMessage({ type: 'ready' });
    
    // Listen for parameter updates from main thread
    this.port.onmessage = (event) => {
      if (event.data.type === 'updateParams') {
        this.updateParameters(event.data.params);
      }
    };
  }

  updateParameters(params) {
    if (params.noiseFloor !== undefined) this.noiseFloor = params.noiseFloor;
    if (params.gateThreshold !== undefined) this.gateThreshold = params.gateThreshold;
    if (params.attackTime !== undefined) this.attackTime = params.attackTime;
    if (params.releaseTime !== undefined) this.releaseTime = params.releaseTime;
  }

  calculateRMS(samples) {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  updateNoiseFloor(rms) {
    // Track energy history
    this.energyHistory.push(rms);
    if (this.energyHistory.length > this.historySize) {
      this.energyHistory.shift();
    }
    
    // Estimate noise floor as the lower percentile of recent energy
    if (this.energyHistory.length >= 10) {
      const sorted = [...this.energyHistory].sort((a, b) => a - b);
      const percentile = Math.floor(sorted.length * 0.2); // 20th percentile
      this.noiseFloor = sorted[percentile] * 1.5; // Add some headroom
    }
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !input[0] || !this.ready) {
      return true;
    }

    const inputChannel = input[0];
    const outputChannel = output[0];

    // Calculate RMS energy of current frame
    const rms = this.calculateRMS(inputChannel);
    
    // Update noise floor estimate
    this.updateNoiseFloor(rms);
    
    // Calculate target gain based on signal energy
    let targetGain = 0;
    if (rms > this.noiseFloor + this.gateThreshold) {
      // Signal is above noise floor - pass through
      targetGain = 1.0;
    } else if (rms > this.noiseFloor) {
      // Signal is near noise floor - apply smooth transition
      const ratio = (rms - this.noiseFloor) / this.gateThreshold;
      targetGain = ratio * ratio; // Quadratic curve for smooth transition
    } else {
      // Signal is below noise floor - attenuate
      targetGain = 0.1; // Don't completely mute to avoid artifacts
    }
    
    // Smooth gain transitions (attack/release)
    const coefficient = targetGain > this.prevGain ? 
      1 - Math.exp(-1 / (this.sampleRate * this.attackTime)) :
      1 - Math.exp(-1 / (this.sampleRate * this.releaseTime));
    
    // Apply gain to each sample with smoothing
    for (let i = 0; i < inputChannel.length; i++) {
      this.prevGain += (targetGain - this.prevGain) * coefficient;
      outputChannel[i] = inputChannel[i] * this.prevGain;
    }

    return true;
  }
}

registerProcessor('rnnoise-processor', RNNoiseProcessor);
