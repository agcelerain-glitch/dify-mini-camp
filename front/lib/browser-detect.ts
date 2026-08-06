'use client';

export type BrowserEnv = {
  isLine: boolean;
  isInstagram: boolean;
  isFacebook: boolean;
  isInAppBrowser: boolean; // 上記いずれかに該当
  isEdge: boolean;
  isChrome: boolean;
  isSafari: boolean;
  isFirefox: boolean;
  isMobile: boolean;
};

export function detectBrowser(): BrowserEnv {
  if (typeof navigator === 'undefined') {
    return {
      isLine: false,
      isInstagram: false,
      isFacebook: false,
      isInAppBrowser: false,
      isEdge: false,
      isChrome: false,
      isSafari: false,
      isFirefox: false,
      isMobile: false,
    };
  }

  const ua = navigator.userAgent;

  const isLine = /Line\//i.test(ua);
  const isInstagram = /Instagram/i.test(ua);
  const isFacebook = /FBAN|FBAV/i.test(ua);
  const isInAppBrowser = isLine || isInstagram || isFacebook;

  const isEdge = /Edg\//i.test(ua);
  const isFirefox = /Firefox\//i.test(ua);
  // Chrome判定: Edgeを除外
  const isChrome = /Chrome\//i.test(ua) && !isEdge;
  // Safari判定: Chrome/Edgeを除外
  const isSafari = /Safari\//i.test(ua) && !isChrome && !isEdge;

  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);

  return { isLine, isInstagram, isFacebook, isInAppBrowser, isEdge, isChrome, isSafari, isFirefox, isMobile };
}

// LINEアプリ内ブラウザで外部ブラウザを開くURLを生成
export function getLineExternalUrl(targetUrl: string): string {
  // LINEのOpenExternalBrowserプロトコル
  return `${targetUrl}?openExternalBrowser=1`;
}
