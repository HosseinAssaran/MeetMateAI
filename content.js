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
        updateSubtitleDisplay(subtitleEntry);
      }
    }
  }
}

// Function to observe subtitle changes
function observeSubtitles() {
  debugLog('Starting observation');
  const observer = new MutationObserver((mutations) => {
    debugLog('Mutation detected, mutations count:', mutations.length);
    checkForSubtitles();
  });

  const config = {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true
  };

  observer.observe(document.body, config);
  debugLog('Observer attached to document body');

  const checkInterval = setInterval(() => {
    debugLog('Interval check');
    checkForSubtitles();
  }, 1000);

  return { observer, checkInterval };
}

let currentObserver = null;
let currentInterval = null;
let uiVisible = false;

// Inject draggable UI with all controls
function createDraggableUI() {
  const existingUI = document.getElementById('meetSubtitlesUI');
  if (existingUI) {
    debugLog('UI already exists, skipping creation');
    return;
  }

  debugLog('Creating draggable UI');
  const ui = document.createElement('div');
  ui.id = 'meetSubtitlesUI';
  ui.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    width: 300px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 0 10px rgba(0,0,0,0.3);
    z-index: 9999;
    padding: 10px;
    font-family: Arial, sans-serif;
    display: ${uiVisible ? 'flex' : 'none'};
    flex-direction: column;
    align-items: center;
  `;

  const dragHandle = document.createElement('div');
  dragHandle.id = 'dragHandle';
  dragHandle.textContent = 'Meet Subtitles Saver';
  dragHandle.style.cssText = `
    width: 80%;
    padding: 10px;
    background: #e0e0e0;
    text-align: center;
    border-bottom: 1px solid #ccc;
    border-radius: 4px 4px 0 0;
    cursor: move;
    user-select: none;
    font-size: 14px;
    font-weight: bold;
  `;

  const startButton = document.createElement('button');
  startButton.id = 'startCapture';
  startButton.textContent = 'Start Capturing';
  startButton.style.cssText = `
    width: 80%;
    margin: 8px 0;
    padding: 10px;
    cursor: pointer;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #f8f8f8;
    text-align: center;
  `;
  startButton.addEventListener('mouseover', () => startButton.style.backgroundColor = '#e0e0e0');
  startButton.addEventListener('mouseout', () => startButton.style.backgroundColor = '#f8f8f8');

  const stopButton = document.createElement('button');
  stopButton.id = 'stopCapture';
  stopButton.textContent = 'Stop Capturing';
  stopButton.style.cssText = `
    width: 80%;
    margin: 8px 0;
    padding: 10px;
    cursor: pointer;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #f8f8f8;
    text-align: center;
  `;
  stopButton.addEventListener('mouseover', () => stopButton.style.backgroundColor = '#e0e0e0');
  stopButton.addEventListener('mouseout', () => stopButton.style.backgroundColor = '#f8f8f8');

  const downloadButton = document.createElement('button');
  downloadButton.id = 'downloadSubtitles';
  downloadButton.textContent = 'Download Subtitles';
  downloadButton.style.cssText = `
    width: 80%;
    margin: 8px 0;
    padding: 10px;
    cursor: pointer;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #f8f8f8;
    text-align: center;
  `;
  downloadButton.addEventListener('mouseover', () => downloadButton.style.backgroundColor = '#e0e0e0');
  downloadButton.addEventListener('mouseout', () => downloadButton.style.backgroundColor = '#f8f8f8');

  const promptInput = document.createElement('textarea');
  promptInput.id = 'geminiPrompt';
  promptInput.placeholder = 'Enter your prompt here';
  promptInput.style.cssText = `
    width: 80%;
    margin: 8px 0;
    padding: 10px;
    resize: both;
    min-height: 60px;
    max-height: 150px;
    box-sizing: border-box;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 4px;
  `;

  const sendButton = document.createElement('button');
  sendButton.id = 'sendToGemini';
  sendButton.textContent = 'Send to Gemini';
  sendButton.style.cssText = `
    width: 80%;
    margin: 8px 0;
    padding: 10px;
    cursor: pointer;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #f8f8f8;
    text-align: center;
  `;
  sendButton.addEventListener('mouseover', () => sendButton.style.backgroundColor = '#e0e0e0');
  sendButton.addEventListener('mouseout', () => sendButton.style.backgroundColor = '#f8f8f8');

  const status = document.createElement('div');
  status.id = 'subtitleStatus';
  status.style.cssText = `
    width: 80%;
    margin-top: 10px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    max-height: 100px;
    overflow-y: auto;
    word-wrap: break-word;
    font-size: 12px;
    text-align: center;
    background: #f0f0f0;
  `;
  status.textContent = 'Ready';

  ui.appendChild(dragHandle);
  ui.appendChild(startButton);
  ui.appendChild(stopButton);
  ui.appendChild(downloadButton);
  ui.appendChild(promptInput);
  ui.appendChild(sendButton);
  ui.appendChild(status);
  document.body.appendChild(ui);
  debugLog('UI appended to document body');

  // Dragging logic
  let isDragging = false;
  let currentX = 10;
  let currentY = 10;
  let initialX, initialY;

  dragHandle.addEventListener('mousedown', (e) => {
    isDragging = true;
    initialX = e.clientX - currentX;
    initialY = e.clientY - currentY;
    dragHandle.style.cursor = 'grabbing';
    debugLog('Dragging started');
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      ui.style.left = `${currentX}px`;
      ui.style.top = `${currentY}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    dragHandle.style.cursor = 'move';
    debugLog('Dragging stopped');
  });

  // Event handlers for controls
  startButton.addEventListener('click', () => {
    debugLog('Starting capture');
    isCapturing = true;
    subtitles = []; // Clear subtitles to start fresh
    lastSubtitle = ''; // Reset last subtitle

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
    updateSubtitleDisplay('Capture started');
  });

  stopButton.addEventListener('click', () => {
    debugLog('Stopping capture');
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
    updateSubtitleDisplay('Capture stopped');
    if (subtitles.length > 0) {
      const lastLine = subtitles[subtitles.length - 1];
      const cleanSubtitles = lastLine.split(']').pop().trim();
      promptInput.value = cleanSubtitles;
      updateSubtitleDisplay('Capture stopped - Subtitles loaded');
    } else {
      promptInput.value = '';
      updateSubtitleDisplay('Capture stopped - No subtitles captured');
    }
  });

  downloadButton.addEventListener('click', () => {
    debugLog('Downloading subtitles. Count:', subtitles.length);
    if (subtitles.length === 0) {
      alert('No subtitles to download');
      updateSubtitleDisplay('No subtitles available to download');
      return;
    }
    const BOM = '\uFEFF';
    const header = '=== Google Meet Subtitles ===\nRecorded on: ' + new Date().toLocaleString() + '\n\n';
    const content = BOM + header + subtitles.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    chrome.runtime.sendMessage({
      action: 'download',
      url: blobUrl,
      filename: `meet-subtitles-${new Date().toISOString().slice(0, 10)}.txt`
    }, (response) => {
      if (response && response.success) {
        updateSubtitleDisplay('Subtitles downloaded');
      } else {
        alert('Error downloading subtitles');
        updateSubtitleDisplay('Error downloading subtitles');
      }
      URL.revokeObjectURL(blobUrl);
    });
  });

  sendButton.addEventListener('click', async () => {
    debugLog('Send to Gemini clicked');
    if (typeof GEMINI_API_KEY === 'undefined') {
      updateSubtitleDisplay('Error: GEMINI_API_KEY not defined');
      debugLog('GEMINI_API_KEY is undefined');
      return;
    }

    const apiKey = GEMINI_API_KEY;
    const model = 'gemini-1.5-pro-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const userPrompt = promptInput.value.trim();
    let fullPrompt = userPrompt;

    updateSubtitleDisplay('Loading...');
    debugLog('Prompt before processing:', userPrompt);

    if (subtitles.length > 0) {
      fullPrompt = `${userPrompt}`;
      debugLog('Full prompt with subtitles:', fullPrompt);
    } else {
      updateSubtitleDisplay('Warning: No subtitles captured yet. Using prompt only...');
      debugLog('No subtitles, using prompt only');
    }

    promptInput.value = fullPrompt;

    if (confirm('Do you want to send this to Gemini?\n\nPress OK to send, Cancel to edit')) {
      updateSubtitleDisplay('Sending to Gemini...');
      debugLog('Sending request to Gemini API with key:', apiKey.substring(0, 5) + '...');
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
        });

        debugLog('Fetch response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        debugLog('API response data:', data);

        const output = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';
        updateSubtitleDisplay(output);
        debugLog('Output displayed:', output);
      } catch (err) {
        console.error('Fetch error:', err);
        updateSubtitleDisplay(`Error: ${err.message}`);
        debugLog('Error occurred:', err.message);
      }
    } else {
      updateSubtitleDisplay('Send cancelled. Edit the prompt and try again.');
      debugLog('Send cancelled by user');
    }
  });
}

// Update status display
function updateSubtitleDisplay(text) {
  const status = document.getElementById('subtitleStatus');
  if (status) {
    status.textContent = text || 'Capturing...';
    debugLog('Status updated to:', text);
  } else {
    debugLog('Status element not found');
  }
}

// Toggle UI visibility
function toggleUIVisibility() {
  const ui = document.getElementById('meetSubtitlesUI');
  if (ui) {
    uiVisible = !uiVisible;
    ui.style.display = uiVisible ? 'flex' : 'none';
    debugLog('UI visibility toggled to:', uiVisible ? 'visible' : 'hidden');
  } else {
    debugLog('UI not found, creating it');
    createDraggableUI();
    uiVisible = true;
    const newUI = document.getElementById('meetSubtitlesUI');
    if (newUI) {
      newUI.style.display = 'flex';
      debugLog('UI created and set to visible');
    }
  }
  return uiVisible;
}

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  debugLog('Received message:', request.action);

  switch (request.action) {
    case 'toggleUI':
      const isVisible = toggleUIVisibility();
      sendResponse({ isVisible: isVisible });
      break;
  }
  return true; // Keep message channel open for async response
});

// Initial setup
debugLog('Content script loaded');
createDraggableUI(); // Create UI on load, hidden by default
checkForSubtitles();