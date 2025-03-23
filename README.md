# MeetMate AI

**Developed by:** Hossein Assaran

MeetMate AI is a Chrome extension that enhances your Google Meet experience by capturing subtitles and enabling advanced analysis via Gemini API.

---

## ✨ Features

- **Subtitle Capture** – Saves Google Meet subtitles with timestamps  
- **Draggable UI** – Move the control panel anywhere on the Meet screen  
- **Download Subtitles** – Export subtitles as a `.txt` file  
- **Gemini API Integration** – Summarize or analyze subtitles in real-time via the Gemini API 
- **Short Answer Toggle** – Choose detailed or concise responses  
- **Auto CC Control** – Automatically turn CC on/off when capturing  
- **Debug Mode** – Logs detailed information for troubleshooting

---

## 🔧 Installation

### Prerequisites

- Google Chrome  
- (Optional) Gemini API key

### Steps

1. Clone the repository:
   git clone https://github.com/HosseinAssaran/MeetMateAI.git

2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (top right corner)
4. Click **Load unpacked**
5. Select the extension's root folder

---

## 🔑 Configuration

### Set Up Your Gemini API Key

1. Visit: [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)  
2. Log in with your Google account.  
3. Click **"Create API Key"**.  
4. **Copy your API key**.  
5. Click the extension icon, and in the pop-up menu, paste the API key into the input box.  
6. Click **"Set API Key"** to save and apply the key.


### Debug Mode
Disable console logging by setting debugMode to false in content.js:
```js
let debugMode = false;
```

---

## 🚀 Usage

1. Join a [Google Meet](https://meet.google.com) call  
2. Click the **MeetMate AI** icon in the Chrome toolbar  
3. Click **Toggle UI** to show/hide the interface  
4. Click **Start Capturing** – subtitles will be saved  
5. Click **Stop Capturing** when done. It copies captured subtitle to the prompt box.
6. Click **Download Subtitles** to save `.txt` file  
7. Modify the prompt and click **Send to Gemini**  
8. View AI-generated answer

---

## 🤝 Contributing
This project is at first steps and your contribution is appriciated.
1. Fork the repository.
2. Create a feature branch (git checkout -b feature-name).
3. Commit your changes (git commit -m "Add feature").
4. Push to the branch (git push origin feature-name).
5. Open a pull request.

## 📄 License
This project is licensed under the Apache 2.0 License.
See the [LICENSE](LICENSE) for details.