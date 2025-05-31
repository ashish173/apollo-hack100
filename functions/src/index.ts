import cors from "cors";

const corsHandler = cors({ origin: true });

// Firebase Function (functions/index.js)
const functions = require("firebase-functions");
const vision = require("@google-cloud/vision");

// Initialize the Vision API client
const client = new vision.ImageAnnotatorClient();

// @ts-ignore
exports.analyzeImage = functions.https.onRequest((req, res) => {
  return corsHandler(req, res, async () => {
    // Only allow POST requests
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      const { image, features } = req.body;

      if (!image) {
        return res.status(400).json({ error: "No image provided" });
      }

      if (!features || !Array.isArray(features)) {
        return res.status(400).json({ error: "Features array is required" });
      }

      // Prepare the request for Vision API
      const request = {
        image: {
          content: image, // Base64 encoded image
        },
        features: features,
      };

      // Call the Vision API
      const [result] = await client.annotateImage(request);

      // Check for errors in the response
      if (result.error) {
        console.error("Vision API error:", result.error);
        return res
          .status(500)
          .json({ error: "Vision API error", details: result.error });
      }

      // Return the results
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error processing image:", error);
      return res.status(500).json({
        error: "Internal server error",
        // @ts-ignore
        message: error.message,
      });
    }
  });
});
