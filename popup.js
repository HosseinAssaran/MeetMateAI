document.addEventListener('DOMContentLoaded', () => {
  const responseBox = document.getElementById('geminiResponse');

  document.getElementById('startCapture').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      console.log('Sending startCapture message to tab:', tab.id);
      chrome.tabs.sendMessage(tab.id, { action: 'startCapture' });
      responseBox.textContent = 'Capture started'; // Assume success immediately
    } else {
      responseBox.textContent = 'No active tab found';
    }
  });

  document.getElementById('stopCapture').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const promptInput = document.getElementById('geminiPrompt');

    if (tab) {
      try {
        console.log('Sending stopCapture message to tab:', tab.id);
        chrome.tabs.sendMessage(tab.id, { action: 'stopCapture' }, (response) => {
          if (response && response.status === 'success') {
            console.log('Stop capture response:', response);
            responseBox.textContent = response.message; // "Capture stopped"
          }
        });

        const response = await new Promise((resolve, reject) => {
          console.log('Sending downloadSubtitles message to tab:', tab.id);
          chrome.tabs.sendMessage(tab.id, { action: 'downloadSubtitles' }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Download error:', chrome.runtime.lastError.message);
              reject(chrome.runtime.lastError);
            } else {
              console.log('Download response:', response);
              resolve(response);
            }
          });
        });

        if (response && response.content) {
          const lastLine = response.content.trim().split('\n').at(-1);
          const cleanSubtitles = lastLine.split(']').pop().trim();
          promptInput.value = cleanSubtitles;
          responseBox.textContent = 'Capture stopped - Subtitles loaded';
        } else {
          promptInput.value = '';
          responseBox.textContent = 'Capture stopped - No subtitles captured';
        }
      } catch (error) {
        console.error('Error stopping capture:', error);
        responseBox.textContent = 'Error stopping capture: ' + error.message;
      }
    } else {
      responseBox.textContent = 'No active tab found';
    }
  });

  document.getElementById('downloadSubtitles').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      try {
        const response = await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tab.id, { action: 'downloadSubtitles' }, (response) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve(response);
          });
        });

        if (response && response.content) {
          const blob = new Blob([response.content], { type: 'text/plain;charset=utf-8' });
          const blobUrl = URL.createObjectURL(blob);
          chrome.downloads.download({
            url: blobUrl,
            filename: `meet-subtitles-${new Date().toISOString().slice(0, 10)}.txt`,
            saveAs: true
          }, (downloadId) => {
            if (chrome.runtime.lastError) {
              console.error('Download error:', chrome.runtime.lastError);
              alert('Error downloading: ' + chrome.runtime.lastError.message);
            } else {
              console.log('Download started with ID:', downloadId);
              responseBox.textContent = 'Subtitles downloaded';
            }
            URL.revokeObjectURL(blobUrl);
          });
        } else {
          alert('No subtitles to download');
          responseBox.textContent = 'No subtitles available to download';
        }
      } catch (error) {
        console.error('Error during download:', error);
        alert('Error downloading subtitles: ' + error.message);
        responseBox.textContent = 'Error downloading: ' + error.message;
      }
    }
  });

  document.getElementById('sendToGemini').addEventListener('click', async () => {
    const apiKey = GEMINI_API_KEY;
    const model = 'gemini-1.5-pro-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const promptInput = document.getElementById('geminiPrompt');

    responseBox.textContent = 'Loading...';

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      try {
        const response = await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tab.id, { action: 'downloadSubtitles' }, (response) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve(response);
          });
        });

        const userPrompt = promptInput.value.trim();
        let fullPrompt = userPrompt;

        if (response && response.content) {
          fullPrompt = `${userPrompt}\n\nCaptured Subtitles:\n${response.content}`;
        } else if (!response || response.error) {
          responseBox.textContent = 'Warning: No subtitles captured yet. Using prompt only...';
        }

        promptInput.value = fullPrompt;

        if (confirm('Do you want to send this to Gemini?\n\nPress OK to send, Cancel to edit')) {
          responseBox.textContent = 'Sending to Gemini...';
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
          })
            .then(res => res.json())
            .then(data => {
              const output = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
              responseBox.textContent = output;
            })
            .catch(err => {
              console.error(err);
              responseBox.textContent = 'Error: ' + err.message;
            });
        } else {
          responseBox.textContent = 'Send cancelled. Edit the prompt and try again.';
        }
      } catch (error) {
        console.error('Error:', error);
        responseBox.textContent = 'Error getting subtitles: ' + error.message;
      }
    }
  });

  console.log('Popup loaded successfully');
});