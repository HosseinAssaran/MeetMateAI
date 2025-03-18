document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('startCapture').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { action: 'startCapture' });
      console.log('Start capture message sent');
    }
  });

  document.getElementById('stopCapture').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const promptInput = document.getElementById("geminiPrompt");
    const responseBox = document.getElementById("geminiResponse");

    if (tab) {
      try {
        // Stop the capture
        chrome.tabs.sendMessage(tab.id, { action: 'stopCapture' });
        console.log('Stop capture message sent');

        // Get the captured subtitles
        const response = await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tab.id, { action: 'downloadSubtitles' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        });

        // Display subtitles in prompt
        if (response && response.content) {
          const lastLine = response.content.trim().split('\n').at(-1);
          const cleanSubtitles = lastLine.split(']').pop().trim();
          console.log(cleanSubtitles);          
          promptInput.value = cleanSubtitles;
          responseBox.textContent = "Cleaned subtitles loaded into prompt";
        } else {
          promptInput.value = "";
          responseBox.textContent = "No subtitles captured";
        }
      } catch (error) {
        console.error('Error stopping capture:', error);
        responseBox.textContent = "Error getting subtitles: " + error.message;
      }
    }
  });

  document.getElementById('downloadSubtitles').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      try {
        const response = await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tab.id, { action: 'downloadSubtitles' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        });

        if (response && response.content) {
          // Create blob with UTF-8 encoding
          const blob = new Blob([response.content], { type: 'text/plain;charset=utf-8' });
          
          // Create object URL
          const blobUrl = URL.createObjectURL(blob);
          
          // Use chrome.downloads API
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
            }
            // Clean up the blob URL
            URL.revokeObjectURL(blobUrl);
          });
        }
      } catch (error) {
        console.error('Error during download:', error);
        alert('Error downloading subtitles: ' + error.message);
      }
    }
  });

  document.getElementById("sendToGemini").addEventListener("click", async () => {
    const apiKey = GEMINI_API_KEY;
    const model = "gemini-1.5-pro-latest";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const promptInput = document.getElementById("geminiPrompt");
    const responseBox = document.getElementById("geminiResponse");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    responseBox.textContent = "Loading...";

    if (tab) {
      try {
        // Get the captured subtitles first
        const response = await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tab.id, { action: 'downloadSubtitles' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        });

        // Get the current prompt value
        const userPrompt = promptInput.value.trim();
        let fullPrompt = userPrompt;

        // Combine with subtitles if available
        if (response && response.content) {
          fullPrompt = `${userPrompt}\n\nCaptured Subtitles:\n${response.content}`;
        } else if (!response || response.error) {
          responseBox.textContent = "Warning: No subtitles captured yet. Using prompt only...";
        }

        // Display the full message in the prompt input
        promptInput.value = fullPrompt;

        // Ask for confirmation before sending
        if (confirm("Do you want to send this to Gemini?\n\nPress OK to send, Cancel to edit")) {
          responseBox.textContent = "Sending to Gemini...";

          // Send to Gemini API
          fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }]
            })
          })
            .then(res => res.json())
            .then(data => {
              const output = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
              responseBox.textContent = output;
            })
            .catch(err => {
              console.error(err);
              responseBox.textContent = "Error: " + err.message;
            });
        } else {
          responseBox.textContent = "Send cancelled. Edit the prompt and try again.";
        }

      } catch (error) {
        console.error('Error:', error);
        responseBox.textContent = "Error getting subtitles: " + error.message;
      }
    }
  });
});