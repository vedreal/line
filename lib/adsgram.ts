export const ADSGRAM_ZONE_ID = 'YOUR_ZONE_ID'; // Ganti dengan Zone ID Anda

export const loadAdsgram = () => {
  return new Promise((resolve, reject) => {
    if (window.Adsgram) {
      resolve(window.Adsgram);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://adsgram.ai/sdk.js';
    script.async = true;
    script.onload = () => resolve(window.Adsgram);
    script.onerror = () => reject(new Error('Failed to load Adsgram SDK'));
    document.head.appendChild(script);
  });
};

export const showAd = async (onReward: () => void, onError?: (err: any) => void) => {
  try {
    await loadAdsgram();
    const AdController = window.Adsgram.init({ blockId: ADSGRAM_ZONE_ID });
    AdController.show().then((result: any) => {
      if (result.done) {
        onReward();
      }
    }).catch((result: any) => {
      if (onError) onError(result);
    });
  } catch (err) {
    if (onError) onError(err);
  }
};
