const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyCJUTsqENspO1wbyu3Fd1oyP67B0pQnyhw");
const fs = require("fs");
const axios = require("axios");
const pathh = process.cwd() + "/history/gemini.json";
let path = JSON.parse(fs.readFileSync(pathh, "utf8"));
const app = require("express")();
const cors = require("cors");
app.use(cors());
app.get("", async function (req, res) {
  try {
    let { prompt, uid, url } = req.query;

    if (!prompt) {
      return res.status(400).json({ error: "No prompt provided." });
    }

    if (url) {
      if (url.startsWith("https://")) {
        const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

        const img = (await axios.get(url, { responseType: "arraybuffer" })).data;
        const base64 = Buffer.from(img).toString("base64");
        const image = {
          inlineData: {
            data: base64,
            mimeType: "image/png",
          },
        };
        const result = await model.generateContent({
          parts: [prompt, image],
        });
        const responseText = result.response && result.response.text ? result.response.text() : "Failed to generate response";
        return res.status(200).json({ gemini: responseText });
      } else {
        return res.status(400).json({ error: "Invalid URL" });
      }
    }

    if (!uid) {
      return res.status(400).json({ error: "Missing UID" });
    }

    if (prompt === "clear" || prompt === "reset" || prompt === "clear history") {
      path[uid] = [];
      fs.writeFileSync(pathh, JSON.stringify(path, null, 2));
      return res.json({ gemini: "Your history has been cleared." });
    }

    if (prompt === "clear all") {
      if (uid !== "61550030744931") {
        return res.status(403).json({ error: "You do not have permission to use this feature." });
      }

      path = {
        4: [
          {
            role: "user",
            parts: [{ text: "hi" }],
          },
          {
            role: "model",
            parts: [{ text: "Hey there! How can I assist you today?" }],
          },
        ],
      };
      fs.writeFileSync(pathh, JSON.stringify(path, null, 2));
      return res.json({ gemini: "All history has been cleared." });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const chat = model.startChat({
      history: path[uid], 
      generationConfig: {
        maxOutputTokens: 1024,
        topP: 1,
        temperature: 1,
        topK: 40,
      },
    });

    const result = await chat.sendMessage(prompt);

    const response = await result.response;

    const text = response.text();

    if (!path[uid]) {
      path[uid] = [];
    }

    path[uid].push(
      {
        role: "user",
        parts: [{ text: prompt }], 
      },
      {
        role: "model",
        parts: [{ text: text }], 
      }
    );

    fs.writeFileSync(pathh, JSON.stringify(path, null, 2));

    return res.json({ gemini: text });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});
module.exports = app;
