# IframeXtractor

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue)](https://iframe-extractor.vercel.app/)

A simple tool to extract and preview `<iframe>` contents (including `srcdoc`) from downloaded HTML files.

---

## 🚀 Live Demo

You can try IframeXtractor right now at:  
https://iframe-extractor.vercel.app/

---

## 🔧 How to Use IframeXtractor

1. **Save the Webpage**  
   Install the **Save Page WE** Chrome extension and use it to download the complete HTML file of the webpage containing the `<iframe>` elements you want to inspect.

2. **Upload the HTML File**  
   - Drag & drop your downloaded HTML file onto the upload area below,  
   - Or click the upload area to browse and select the file manually.  

3. **Select and Preview**  
   - If any `<iframe>` elements contain inline `srcdoc`, they will be listed in the dropdown.  
   - Choose an iframe from the list to preview its rendered content and view the raw HTML source.

4. **Open in New Tab**  
   Click the **Open in New Tab** button next to your selected iframe. This opens the content in a fresh tab/window for the most accurate rendering environment.

5. **Convert to React (Optional)**  
   If you’d like to turn the extracted HTML into React components, use the **HTML to React** Chrome extension on the new tab’s content.

---

## 📝 Features

- Extracts both external `src` and inline `srcdoc` `<iframe>` contents.
- Live preview of extracted HTML.
- One-click “Open in New Tab” for further inspection.
- Optional React conversion workflow.

---

## 🤝 Contributing

Contributions, issues and feature requests are welcome!  
Feel free to check [issues page](https://github.com/yourusername/iframextractor/issues).

1. Fork the project  
2. Create your feature branch (`git checkout -b feature/YourFeature`)  
3. Commit your changes (`git commit -m 'Add some feature'`)  
4. Push to the branch (`git push origin feature/YourFeature`)  
5. Open a Pull Request

---

## 📫 Need Help?

If you encounter any issues or have questions, please reach out to:  
**Ayush Jain** – [jain.ayush@turing.com](mailto:jain.ayush@turing.com)

---

## ⚖️ License

This project is MIT licensed. See the [LICENSE](LICENSE) file for details.
