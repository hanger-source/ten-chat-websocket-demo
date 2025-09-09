import audioInputProcessorUrl from '@/manager/websocket/audio-worklet-processor.js?url';
import audioPlayerProcessorUrl from '@/manager/websocket/audio-processor.js?url';

interface AudioWorkletProcessorMessage {
  type: string;
  state?: string;
  frameId?: number;
  data?: Int16Array;
  audioLevel?: number;
}

class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private inputWorkletNode: AudioWorkletNode | null = null;
  private outputWorkletNode: AudioWorkletNode | null = null;
  private mediaStreamSourceNode: MediaStreamAudioSourceNode | null = null;
  private mediaStream: MediaStream | null = null;
  private isInitialized = false;
  private _isInitializing = false; // 新增：防止在初始化过程中被意外关闭
  private _initPromise: Promise<void> | null = null; // 新增：缓存初始化Promise，防止竞态条件
  private inputMessageHandlers: ((message: AudioWorkletProcessorMessage) => void)[] = [];
  private outputMessageHandlers: ((message: AudioWorkletProcessorMessage) => void)[] = [];

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public async init(): Promise<void> {
    if (this._initPromise) {
      return this._initPromise;
    }

    if (this.isInitialized) {
      return Promise.resolve();
    }

    this._initPromise = new Promise<void>(async (resolve, reject) => {
      this._isInitializing = true; // 开始初始化
      try {
        const currentAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 48000 });
        this.audioContext = currentAudioContext;
        
        if (!this.audioContext) {
          console.error("AudioContext is null after creation attempt.");
          throw new Error("AudioContext failed to initialize (instance is null).");
        }
        if (this.audioContext.state === 'suspended') { 
          await this.audioContext.resume();
        }

        if (!this.audioContext.audioWorklet) {
          console.error("AudioContext does not support audioWorklet property.");
          throw new Error("AudioContext does not support audioWorklet.");
        }
        await this.audioContext.audioWorklet.addModule(audioInputProcessorUrl);      
        if (!this.audioContext) {
          console.error("AudioContext became null after adding AudioInputProcessor module.");
          throw new Error("AudioContext became null after adding AudioInputProcessor module.");
        }

        await this.audioContext.audioWorklet.addModule(audioPlayerProcessorUrl);
        this.isInitialized = true;
        resolve(); // 初始化成功，解析 Promise
      } catch (error: any) {
        console.error("Failed to initialize AudioManager. Details:", error?.message || error);
        this.isInitialized = false;
        if (this.audioContext && this.audioContext.state !== 'closed') {
          this.audioContext.close().catch(console.error);
        }
        this.audioContext = null;
        reject(error); // 初始化失败，拒绝 Promise
      } finally {
        this._isInitializing = false; // 无论成功或失败，结束初始化
        this._initPromise = null; // 清除 Promise，允许下次重新初始化
      }
    });
    return this._initPromise;
  }

  public async startMicrophoneStream(stream: MediaStream): Promise<void> {
    if (!this.audioContext || !this.isInitialized) {
      throw new Error("AudioManager is not initialized.");
    }

    if (this.mediaStreamSourceNode) {
      this.stopMicrophoneStream();
    }

    this.mediaStream = stream;
    this.mediaStreamSourceNode = this.audioContext.createMediaStreamSource(stream);

    this.inputWorkletNode = new AudioWorkletNode(this.audioContext, 'audio-input-processor');
    this.inputWorkletNode.port.onmessage = (event) => {
      this.inputMessageHandlers.forEach(handler => handler(event.data));
    };
    this.inputWorkletNode.connect(this.audioContext.destination);
    this.mediaStreamSourceNode.connect(this.inputWorkletNode);
    this.inputWorkletNode.port.postMessage('start');
    // console.log("Microphone stream started.");
  }

  public stopMicrophoneStream(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.mediaStreamSourceNode) {
      this.mediaStreamSourceNode.disconnect();
      this.mediaStreamSourceNode = null;
    }

    if (this.inputWorkletNode) {
      this.inputWorkletNode.port.postMessage('stop');
      this.inputWorkletNode.port.onmessage = null;
      this.inputWorkletNode.disconnect();
      this.inputWorkletNode = null;
    }
    // console.log("Microphone stream stopped.");
  }

  public playAudioFrame(audioData: Float32Array): void {
    if (!this.audioContext || !this.isInitialized) {
      console.warn("AudioManager is not initialized, cannot play audio.");
      return;
    }

    if (!this.outputWorkletNode) {
      this.outputWorkletNode = new AudioWorkletNode(this.audioContext, 'audio-player-processor');
      this.outputWorkletNode.port.onmessage = (event) => {
        this.outputMessageHandlers.forEach(handler => handler(event.data));
      };
      this.outputWorkletNode.connect(this.audioContext.destination);
    }
    this.outputWorkletNode.port.postMessage(audioData);
  }

  public stopAudioPlayback(): void {
    if (this.outputWorkletNode) {
      this.outputWorkletNode.port.postMessage('clear'); // 通知 AudioWorkletNode 清空播放队列
      this.outputWorkletNode.disconnect();
      this.outputWorkletNode = null;
    }
    
  }

  public onInputMessage(handler: (message: AudioWorkletProcessorMessage) => void): () => void {
    this.inputMessageHandlers.push(handler);
    return () => {
      const index = this.inputMessageHandlers.indexOf(handler);
      if (index > -1) this.inputMessageHandlers.splice(index, 1);
    };
  }

  public onOutputMessage(handler: (message: AudioWorkletProcessorMessage) => void): () => void {
    this.outputMessageHandlers.push(handler);
    return () => {
      const index = this.outputMessageHandlers.indexOf(handler);
      if (index > -1) this.outputMessageHandlers.splice(index, 1);
    };
  }

  public getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  public getIsInitialized(): boolean {
    return this.isInitialized;
  }

  public close(): void {
    if (this._isInitializing) {
      console.warn("AudioManager: Attempted to close while initializing. Ignoring.");
      return;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.stopMicrophoneStream();
      this.stopAudioPlayback();
      this.audioContext.close().then(() => {
        
        this.audioContext = null;
        this.isInitialized = false;
      }).catch(error => {
        console.error("Error closing AudioContext:", error);
      });
    }
  }
}

export const audioManager = AudioManager.getInstance();
