document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('toggleUI');

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

  console.log('Popup loaded successfully');
});