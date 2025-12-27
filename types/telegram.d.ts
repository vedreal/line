interface AdsgramAdController {
  show(): Promise<{ done: boolean; description?: string; state?: string }>;
}

interface AdsgramSDK {
  init(params: { blockId: string }): AdsgramAdController;
}

declare global {
  interface Window {
    Telegram: any;
    Adsgram?: AdsgramSDK;
  }
}

export {};
