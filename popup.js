document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('toggleUI');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const setApiKeyButton = document.getElementById('setApiKey');

  // Load existing API key from storage and update placeholder
  chrome.storage.sync.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      apiKeyInput.placeholder = 'API key set (enter to change)';
      console.log('Loaded API key from storage:', 'Set');
    } else {
      apiKeyInput.placeholder = 'Enter Gemini API key';
      console.log('No API key found in storage');
    }
  });

  // Toggle UI button logic
  toggleButton.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      console.log('Sending toggleUI message to tab:', tab.id);
      chrome.tabs.sendMessage(tab.id, { action: 'toggleUI' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Toggle UI error:', chrome.runtime.lastError.message);
          toggleButton.textContent = 'Toggle UI (Error)';
        } else {
          console.log('Toggle response:', response);
          toggleButton.textContent = response?.isVisible ? 'Hide UI' : 'Show UI';
        }
      });
    } else {
      console.log('No active tab found');
      toggleButton.textContent = 'Toggle UI (No Tab)';
    }
  });

  // Set API key button logic
  setApiKeyButton.addEventListener('click', () => {
    const newApiKey = apiKeyInput.value.trim();
    if (newApiKey) {
      chrome.storage.sync.set({ geminiApiKey: newApiKey }, () => {
        console.log('API key saved to storage:', newApiKey);
        apiKeyInput.placeholder = 'API key set (enter to change)';
        apiKeyInput.value = ''; // Clear input after setting
        alert('API key updated successfully');
      });
    } else {
      alert('Please enter a valid API key');
    }
  });

  console.log('Popup loaded successfully');
});