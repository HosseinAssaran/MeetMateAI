const VERSION = '2.1';
importScripts('config.js');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(`[Meet Subtitles v${VERSION}] Background script received message:`, request);
});

// Listen for content script installation
chrome.runtime.onInstalled.addListener(() => {
  console.log(`[Meet Subtitles v${VERSION}] Extension installed/updated`);
});