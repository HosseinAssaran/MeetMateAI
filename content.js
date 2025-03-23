let isCapturing = false;
let subtitles = [];
let lastSubtitle = '';
let debugMode = true;
let basePrompt = '';
const VERSION = '0.1.2';
let GEMINI_API_KEY = null;

// Load API key from storage on initialization
chrome.storage.sync.get(['geminiApiKey'], (result) => {
  GEMINI_API_KEY = result.geminiApiKey || null;
  debugLog('API key loaded from storage:', GEMINI_API_KEY ? 'Set' : 'Not set');
});



// Function to prompt user for API key if not set
function promptForApiKey() {
  chrome.storage.sync.get(['geminiApiKey'], (result) => {
    if (!result.geminiApiKey) {
      updateSubtitleDisplay('No API key set. Please set it in the popup.');
    } else {
      GEMINI_API_KEY = result.geminiApiKey;
      debugLog('API key retrieved from storage:', GEMINI_API_KEY);
    }
  });
}

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
  dragHandle.textContent = 'MeetMate AI';
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

  const shortAnswerContainer = document.createElement('div');
  shortAnswerContainer.style.cssText = `
    width: 80%;
    margin: 8px 0;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const shortAnswerCheckbox = document.createElement('input');
  shortAnswerCheckbox.type = 'checkbox';
  shortAnswerCheckbox.id = 'shortAnswerCheckbox';
  shortAnswerCheckbox.style.cssText = `
    margin-right: 8px;
  `;

  const shortAnswerLabel = document.createElement('label');
  shortAnswerLabel.htmlFor = 'shortAnswerCheckbox';
  shortAnswerLabel.textContent = 'Short Answer';
  shortAnswerLabel.style.cssText = `
    font-size: 14px;
    color: #333;
  `;

  shortAnswerContainer.appendChild(shortAnswerCheckbox);
  shortAnswerContainer.appendChild(shortAnswerLabel);

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
  ui.appendChild(shortAnswerContainer);
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

  // Function to toggle CC button based on desired state
  function toggleCC(desiredState) {
    // Find the CC button using its attributes from the provided HTML
    const ccButton = document.querySelector('button[jsname="r8qRAd"][aria-label*="captions"]');
    if (!ccButton) {
      debugLog('CC button not found');
      return false;
    }

    const isCCEnabled = ccButton.getAttribute('aria-pressed') === 'true';
    debugLog('Current CC state:', isCCEnabled ? 'Enabled' : 'Disabled');

    // If the current state doesn't match the desired state, toggle it
    if (isCCEnabled !== desiredState) {
      ccButton.click();
      debugLog(`CC toggled to ${desiredState ? 'Enabled' : 'Disabled'}`);
      return true;
    } else {
      debugLog('CC already in desired state');
      return false;
    }
  }

  // Event handlers for controls
  startButton.addEventListener('click', () => {
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

    // Enable CC automatically
    toggleCC(true);
    updateSubtitleDisplay('Capture started - CC enabled');
  });

  // Event handler for checkbox
  shortAnswerCheckbox.addEventListener('change', () => {
    const currentText = promptInput.value.trim();
    if (shortAnswerCheckbox.checked) {
      if (!currentText.startsWith('Short answer: ')) {
        basePrompt = currentText; // Store the base prompt
        promptInput.value = `Short answer: ${basePrompt}`;
      }
    } else {
      if (currentText.startsWith('Short answer: ')) {
        promptInput.value = basePrompt; // Restore the base prompt
      }
    }
    debugLog('Checkbox toggled. Prompt updated to:', promptInput.value);
  });

  // Updated stopButton event listener
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

    // Disable CC automatically
    toggleCC(false);
    updateSubtitleDisplay('Capture stopped - CC disabled');

    if (subtitles.length > 0) {
      const lastLine = subtitles[subtitles.length - 1];
      const cleanSubtitles = lastLine.split(']').pop().trim();
      basePrompt = cleanSubtitles; // Set basePrompt
      promptInput.value = shortAnswerCheckbox.checked ? `Short answer: ${basePrompt}` : basePrompt;
      updateSubtitleDisplay('Capture stopped - Subtitles loaded - CC disabled');
    } else {
      basePrompt = '';
      promptInput.value = '';
      updateSubtitleDisplay('Capture stopped - No subtitles captured - CC disabled');
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

  sendButton.addEventListener('click', () => {
    debugLog('Send to Gemini clicked');
    chrome.storage.sync.get(['geminiApiKey'], (result) => {
      GEMINI_API_KEY = result.geminiApiKey || null;
      debugLog('GEMINI_API_KEY:', GEMINI_API_KEY); // Log after retrieval
  
      if (!GEMINI_API_KEY) {
        updateSubtitleDisplay('No API key set. Please set it in the popup.');
        return; // Stops here if no API key
      }
  
      // Only proceeds if GEMINI_API_KEY is set
      const userPrompt = promptInput.value.trim();
      let fullPrompt = userPrompt;
  
      updateSubtitleDisplay('Loading...');
      debugLog('Prompt before processing:', userPrompt);
  
      if (subtitles.length > 0) {
        debugLog('Full prompt with subtitles:', fullPrompt);
      } else {
        debugLog('No subtitles, using prompt only');
      }
  
      promptInput.value = fullPrompt;
  
      if (confirm('Do you want to send this to Gemini?\n\nPress OK to send, Cancel to edit')) {
        updateSubtitleDisplay('Sending to Gemini...');
        debugLog('Preparing to send prompt to background script:', fullPrompt);
  
        chrome.runtime.sendMessage({
          action: 'sendToGemini',
          prompt: fullPrompt,
          apiKey: GEMINI_API_KEY
        }, (response) => {
          if (chrome.runtime.lastError) {
            debugLog('Message sending failed:', chrome.runtime.lastError.message);
            updateSubtitleDisplay('Error: ' + chrome.runtime.lastError.message);
            return;
          }
  
          debugLog('Response from background:', response);
          if (response && response.success) {
            updateSubtitleDisplay(response.output);
            debugLog('Output received and displayed:', response.output);
          } else {
            updateSubtitleDisplay(`Error: ${response?.error || 'Unknown error'}`);
            debugLog('Error from background:', response?.error || 'No error message');
          }
        });
      } else {
        updateSubtitleDisplay('Send cancelled. Edit the prompt and try again.');
        debugLog('Send cancelled by user');
      }
    });
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
  return true;
});

// Initial setup
debugLog('Content script loaded');
createDraggableUI();
checkForSubtitles();