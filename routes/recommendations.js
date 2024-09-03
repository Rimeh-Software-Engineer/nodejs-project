const express = require("express");
const router = express.Router();
const { exec } = require("child_process");
const path = require("path");

const pythonPath =
  "D:/Users/Rimeh Oueslati/Documents/Backend/myenv/Scripts/python.exe"; // Path to the correct Python executable
const scriptPath = "D:/Users/Rimeh Oueslati/Documents/Backend/recommend.py";

// Endpoint to get recommendations
router.get("/recommendations/:userId", (req, res) => {
  const userId = req.params.userId;
  exec(`"${pythonPath}" "${scriptPath}" ${userId}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing Python script: ${error}`);
      if (!res.headersSent) {
        return res.status(500).json({ error: "Internal server error" });
      }
    }
    if (stderr) {
      console.error(`Python script stderr: ${stderr}`);
    }
    console.log(`Python script stdout: ${stdout}`); // Log the raw output for debugging
    try {
      const recommendations = JSON.parse(stdout);
      if (!res.headersSent) {
        return res.json(recommendations);
      }
    } catch (parseError) {
      console.error(`Error parsing Python script output: ${parseError}`);
      if (!res.headersSent) {
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  });
});

// Endpoint to get recommendations for all users
router.get("/recommendations", (req, res) => {
  exec(`"${pythonPath}" "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing Python script: ${error}`);
      return res.status(500).json({ error: "Internal server error" });
    }
    if (stderr) {
      console.error(`Python script stderr: ${stderr}`);
    }
    try {
      const recommendations = JSON.parse(stdout);
      return res.json(recommendations);
    } catch (parseError) {
      console.error(`Error parsing Python script output: ${parseError}`);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
});

module.exports = router;
