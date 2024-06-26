// Import packages
const express = require("express");
const gemini = require("./api/gemini");

// Middlewares
const app = express();
app.use(express.json());

// Routes
app.use("/gemini", gemini);

// connection
const port = process.env.PORT || 9001;
app.listen(port, () => console.log(`Listening to port ${port}`));
