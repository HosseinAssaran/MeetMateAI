const VERSION = '0.1.1';

console.log(`[MeetMateAI v${VERSION}] Background script loaded`);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(`[MeetMateAI v${VERSION}] Background script received message:`, request);

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
    return true;
  } else if (request.action === 'sendToGemini') {
    const apiKey = request.apiKey; // Use the key sent from content.js
    if (!apiKey) {
      console.error('API key not provided');
      sendResponse({ success: false, error: 'API key not provided' });
      return true;
    }

    const model = 'gemini-1.5-pro-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log('Sending request to Gemini API with prompt:', request.prompt);
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: request.prompt }] }] })
    })
      .then(response => {
        console.log('Fetch response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('API response data:', data);
        const output = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';
        sendResponse({ success: true, output: output });
      })
      .catch(err => {
        console.error('Fetch error:', err);
        sendResponse({ success: false, error: err.message });
      });

    return true;
  }

  return false;
});

chrome.runtime.onInstalled.addListener(() => {
  console.log(`[MeetMateAI v${VERSION}] Extension installed/updated`);
});