export const loadAdsgram = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Adsgram) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://adsgram.ai/sdk.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Adsgram SDK'));
    document.head.appendChild(script);
  });
};

export const showAd = async (
  onReward: () => void, 
  onError?: (err: any) => void
): Promise<void> => {
  try {
    await loadAdsgram();
    
    if (!window.Adsgram) {
      throw new Error('Adsgram SDK not available');
    }

    const blockId = process.env.NEXT_PUBLIC_ADSGRAM_ZONE_ID || '';
    const AdController = window.Adsgram.init({ blockId });
    
    const result = await AdController.show();
    
    if (result.done) {
      onReward();
    }
  } catch (err) {
    console.error('Adsgram error:', err);
    if (onError) onError(err);
  }
};
