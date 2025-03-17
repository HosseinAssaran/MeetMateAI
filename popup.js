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
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { action: 'stopCapture' });
      console.log('Stop capture message sent');
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
});

  const apiKey = GEMINI_API_KEY;

  const model = "gemini-1.5-pro-latest";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  document.getElementById("sendToGemini").addEventListener("click", () => {
    const prompt = document.getElementById("geminiPrompt").value;
    const responseBox = document.getElementById("geminiResponse");

    responseBox.textContent = "Loading...";

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
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
  });
