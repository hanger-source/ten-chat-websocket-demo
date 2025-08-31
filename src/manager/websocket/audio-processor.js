// audio-processor.js
// This AudioWorkletProcessor runs in the audio rendering thread, independent of the main JavaScript thread.
// Its purpose is to receive raw audio data (PCM) from the main thread and play it back seamlessly,
// managing its own audio buffer to prevent underruns and ensure precise scheduling.

class AudioPlayerProcessor extends AudioWorkletProcessor {
  audioQueue = [];
  currentBuffer = null;
  currentBufferOffset = 0;
  isPlayingState = false; // 内部播放状态

  constructor() {
    super();
    // Listen for messages from the main thread (AudioStreamPlayer.tsx)
    this.port.onmessage = (event) => {
      // Assuming event.data contains raw PCM data as Float32Array
      if (event.data instanceof Float32Array) {
        this.audioQueue.push(event.data);
      } else if (event.data === 'clear') {
        // Handle clear command to stop and reset playback
        this.audioQueue = [];
        this.currentBuffer = null;
        this.currentBufferOffset = 0;
        if (this.isPlayingState) {
            this.isPlayingState = false;
            this.port.postMessage('stopped');
        }
      }
    };
  }

  // The process method is called repeatedly by the audio rendering thread
  // to fill the output audio buffer.
  process(inputs, outputs, parameters) {
    const output = outputs[0]; // Assuming a single output
    const outputChannelCount = output.length;
    const outputFrameCount = output[0].length; // Typically 128 frames

    let hasAudioToPlay = false; // 标记当前处理周期是否有音频数据

    // Fill output buffers
    for (let channel = 0; channel < outputChannelCount; ++channel) {
      const outputChannel = output[channel];
      for (let i = 0; i < outputFrameCount; ++i) {
        if (!this.currentBuffer) {
          // If currentBuffer is empty, try to get the next one from the queue
          if (this.audioQueue.length > 0) {
            this.currentBuffer = this.audioQueue.shift();
            this.currentBufferOffset = 0;
            hasAudioToPlay = true;
          } else {
            // No data in queue, output silence
            outputChannel[i] = 0;
            continue;
          }
        }

        // Copy data from currentBuffer to outputChannel
        // Handle cases where currentBuffer has fewer frames than outputFrameCount
        if (this.currentBufferOffset < this.currentBuffer.length) {
          outputChannel[i] = this.currentBuffer[this.currentBufferOffset++];
          hasAudioToPlay = true;
        } else {
          // Current buffer exhausted, reset and try to get next on next frame or next process call
          this.currentBuffer = null;
          this.currentBufferOffset = 0;
          outputChannel[i] = 0; // Output silence until next buffer is loaded
        }
      }
    }

    // 根据是否有音频数据播放来更新状态并发送消息
    if (hasAudioToPlay && !this.isPlayingState) {
        this.isPlayingState = true;
        this.port.postMessage('playing');
    } else if (!hasAudioToPlay && this.isPlayingState) {
        this.isPlayingState = false;
        this.port.postMessage('stopped');
    }
    
    // Return true to keep the processor alive.
    return true;
  }
}

registerProcessor('audio-player-processor', AudioPlayerProcessor);
