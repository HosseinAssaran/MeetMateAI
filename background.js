const VERSION = '0.1.1'; // Match content.js and popup.html

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(`[Meet Subtitles v${VERSION}] Background script received message:`, request);
  if (request.action === 'download') {
    chrome.downloads.download({
      url: request.url,
      filename: request.filename,
      saveAs: true
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download error:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('Download started with ID:', downloadId);
        sendResponse({ success: true });
      }
    });
    return true; // Keep message channel open for async response
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log(`[Meet Subtitles v${VERSION}] Extension installed/updated`);
});