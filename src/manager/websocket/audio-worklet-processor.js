class AudioInputProcessor extends AudioWorkletProcessor {
  // 状态管理
  static STATES = {
    IDLE: 'idle',
    STARTING: 'starting',
    PROCESSING: 'processing',
    STOPPING: 'stopping'
  };

  _state = AudioInputProcessor.STATES.IDLE;
  _stateTransitionCount = 0;
  _maxStateTransitions = 5; // 防止状态异常

  // 音频处理参数
  _frameCount = 0;
  _audioBuffer = [];
  _currentBufferLength = 0;
  static FRAME_SIZE_IN_SAMPLES = 4096;
  static SILENCE_THRESHOLD = 0.0001;
  static SILENCE_FRAME_COUNT_THRESHOLD = 5;

  // 去重和质量控制
  _lastSentFrameSum = null;
  _lastFullFrameData = null;
  _consecutiveSilentFrames = 0;
  _qualityControlEnabled = true;

  constructor() {
    super();
    this.port.onmessage = this._handlePortMessage.bind(this);
  }

  _handlePortMessage(event) {
    switch (event.data) {
      case 'start':
        this._transitionState(AudioInputProcessor.STATES.STARTING);
        break;
      case 'stop':
        this._transitionState(AudioInputProcessor.STATES.STOPPING);
        break;
      case 'reset':
        this._reset();
        break;
    }
  }

  _transitionState(newState) {
    if (this._stateTransitionCount >= this._maxStateTransitions) {
      console.error('❌ 状态转换次数过多，强制重置');
      this._reset();
      return;
    }

    this._state = newState;
    this._stateTransitionCount++;

    switch (newState) {
      case AudioInputProcessor.STATES.STARTING:
        this._reset();
        this._state = AudioInputProcessor.STATES.PROCESSING;
        this.port.postMessage({ type: 'state', state: 'active' });
        break;
      case AudioInputProcessor.STATES.STOPPING:
        this._reset();
        this._state = AudioInputProcessor.STATES.IDLE;
        this.port.postMessage({ type: 'state', state: 'inactive' });
        break;
    }
  }

  _reset() {
    this._audioBuffer = [];
    this._currentBufferLength = 0;
    this._frameCount = 0;
    this._lastSentFrameSum = null;
    this._lastFullFrameData = null;
    this._consecutiveSilentFrames = 0;
    this._stateTransitionCount = 0;
  }

  _sumSamples(data) {
    return data.reduce((sum, sample) => sum + Math.abs(sample), 0);
  }

  _isFrameIdentical(frame1, frame2, threshold = 0.001) {
    if (!frame1 || !frame2 || frame1.length !== frame2.length) return false;
    
    return frame1.every((sample, index) => 
      Math.abs(sample - frame2[index]) <= threshold
    );
  }

  process(inputs, outputs, parameters) {
    // 状态检查
    if (this._state !== AudioInputProcessor.STATES.PROCESSING) {
      return this._state !== AudioInputProcessor.STATES.STOPPING;
    }

    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const channelData = input[0];
    const int16DataChunk = new Int16Array(channelData.map(sample => 
      Math.max(-1, Math.min(1, sample)) * 32767
    ));

    // 音量和静默检测
    const audioLevel = this._sumSamples(channelData) / channelData.length;
    if (audioLevel < AudioInputProcessor.SILENCE_THRESHOLD) {
      this._consecutiveSilentFrames++;
      if (this._consecutiveSilentFrames > AudioInputProcessor.SILENCE_FRAME_COUNT_THRESHOLD) {
        return true;
      }
    } else {
      this._consecutiveSilentFrames = 0;
    }

    this._audioBuffer.push(int16DataChunk);
    this._currentBufferLength += int16DataChunk.length;

    // 处理音频帧
    while (this._currentBufferLength >= AudioInputProcessor.FRAME_SIZE_IN_SAMPLES) {
      const combinedInt16Data = new Int16Array(AudioInputProcessor.FRAME_SIZE_IN_SAMPLES);
      let samplesCopied = 0;
      const newAudioBuffer = [];

      while (samplesCopied < AudioInputProcessor.FRAME_SIZE_IN_SAMPLES) {
        const chunk = this._audioBuffer.shift();
        const samplesToCopy = Math.min(chunk.length, AudioInputProcessor.FRAME_SIZE_IN_SAMPLES - samplesCopied);
        
        combinedInt16Data.set(chunk.subarray(0, samplesToCopy), samplesCopied);
        samplesCopied += samplesToCopy;

        if (samplesToCopy < chunk.length) {
          newAudioBuffer.push(chunk.subarray(samplesToCopy));
        }
      }

      const currentFrameSum = this._sumSamples(combinedInt16Data);

      // 质量控制和去重
      const isDuplicateFrame = this._qualityControlEnabled && (
        (this._lastSentFrameSum !== null && Math.abs(currentFrameSum - this._lastSentFrameSum) < 0.01) ||
        (this._lastFullFrameData && this._isFrameIdentical(this._lastFullFrameData, combinedInt16Data))
      );

      if (!isDuplicateFrame) {
        this._frameCount++;
        this.port.postMessage({ 
          type: 'audioFrame', 
          frameId: this._frameCount, 
          data: combinedInt16Data, // 直接发送 Int16Array
          audioLevel: audioLevel 
        });

        this._lastSentFrameSum = currentFrameSum;
        this._lastFullFrameData = combinedInt16Data;
      }

      // 更新缓冲区
      this._audioBuffer = newAudioBuffer;
      this._currentBufferLength = this._audioBuffer.reduce((sum, chunk) => sum + chunk.length, 0);
    }

    return true;
  }
}

registerProcessor('audio-input-processor', AudioInputProcessor);
