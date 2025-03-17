let isCapturing = false;
let subtitles = [];
let lastSubtitle = '';
let debugMode = true;
const VERSION = '0.1.1';

// Function to format timestamp
function formatTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString();
}

// Debug logging function
function debugLog(...args) {
  if (debugMode) {
    console.log(`[Subtitle Debug v${VERSION}]`, ...args);
  }
}

// Function to check and capture subtitles
function checkForSubtitles() {
  debugLog('Check triggered');
  if (!isCapturing) {
    debugLog('Capture not active');
    return;
  }

  // First try the exact structure we see
  const mainContainer = document.querySelector('div[jsname="YSxPC"].bYevke.wY1pdd');
  debugLog('Main container found:', !!mainContainer);

  if (mainContainer) {
    const subtitleElement = mainContainer.querySelector('div[jsname="tgaKEf"].bh44bd.VbkSUe');
    debugLog('Subtitle element found:', !!subtitleElement);

    if (subtitleElement) {
      const text = subtitleElement.textContent.trim();
      debugLog('Found text:', text);

      if (text && text !== lastSubtitle) {
        lastSubtitle = text;
        const subtitleEntry = `[${formatTimestamp()}] ${text}`;
        subtitles.push(subtitleEntry);
        debugLog('Captured new subtitle:', subtitleEntry);
      }
    }
  }

  // Log counts of elements for debugging
  const counts = {
    mainContainers: document.querySelectorAll('div[jsname="YSxPC"]').length,
    subtitleElements: document.querySelectorAll('div[jsname="tgaKEf"]').length,
    bh44bdElements: document.querySelectorAll('.bh44bd').length,
    VbkSUeElements: document.querySelectorAll('.VbkSUe').length
  };
  debugLog('Element counts:', counts);
}

// Function to observe subtitle changes
function observeSubtitles() {
  debugLog('Starting observation');

  // Create mutation observer
  const observer = new MutationObserver((mutations) => {
    debugLog('Mutation detected, mutations count:', mutations.length);
    checkForSubtitles();
  });

  // Configuration for the observer
  const config = {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true // Enable attribute monitoring
  };

  // Start observing
  observer.observe(document.body, config);
  debugLog('Observer attached to document body');

  // Set up periodic checking
  const checkInterval = setInterval(() => {
    debugLog('Interval check');
    checkForSubtitles();
  }, 1000);

  return { observer, checkInterval };
}

let currentObserver = null;
let currentInterval = null;

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  debugLog('Received message:', request.action);
  
  switch (request.action) {
    case 'startCapture':
      debugLog('Starting capture');
      isCapturing = true;
      subtitles = [];
      lastSubtitle = '';
      
      if (currentObserver) {
        currentObserver.disconnect();
        debugLog('Disconnected old observer');
      }
      if (currentInterval) {
        clearInterval(currentInterval);
        debugLog('Cleared old interval');
      }
      
      const { observer, checkInterval } = observeSubtitles();
      currentObserver = observer;
      currentInterval = checkInterval;
      debugLog('New observer and interval set up');
      break;

    case 'stopCapture':
      debugLog('Received stop capture command');
      isCapturing = false;
      if (currentObserver) {
        currentObserver.disconnect();
        currentObserver = null;
      }
      if (currentInterval) {
        clearInterval(currentInterval);
        currentInterval = null;
      }
      debugLog('Total subtitles captured:', subtitles.length);
      break;

    case 'downloadSubtitles':
      debugLog('Received download command. Subtitles count:', subtitles.length);
      if (subtitles.length === 0) {
        alert('No subtitles have been captured yet. Make sure to:\n1. Enable CC in Meet\n2. Click "Start Capturing"\n3. Wait for some speech to be captured');
        sendResponse({ error: 'No subtitles captured' });
        return true;
      }

      try {
        // Create the content with UTF-8 BOM to ensure proper encoding
        const BOM = '\uFEFF';
        const header = '=== Google Meet Subtitles ===\nRecorded on: ' + new Date().toLocaleString() + '\n\n';
        const content = BOM + header + subtitles.join('\n');
        
        // Send content back directly in response
        debugLog('Sending content in response:', content.length, 'bytes');
        sendResponse({ content: content });
      } catch (error) {
        console.error('Error preparing download:', error);
        sendResponse({ error: error.message });
      }
      return true; // Keep message channel open for async response
      break;
  }
});

// Initial setup
debugLog('Content script loaded');
checkForSubtitles(); // Immediate check 