import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import path from "path";
import csvParser from "csv-parser";
import { createClient } from "@vercel/blob";
import { Readable } from "stream";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

const PORT = process.env.PORT || 5000;

// Security enhancements
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "script-src": [
        "'self'",
        "https://cdn.jsdelivr.net/npm/chart.js",
        "https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.2.61/jspdf.debug.js",
        "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.3.2/html2canvas.min.js",
      ],
    },
  })
);

app.get("/guide", (req, res) => {
  res.sendFile(path.resolve("public/guide.html"));
});

// Set up Vercel Blob client
const blobClient = createClient();

// Multer setup for file uploads using memory storage
const storage = multer.memoryStorage(); // Use memory storage instead of disk storage

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv") {
      cb(null, true); // Accept file
    } else {
      cb(null, false); // Reject file
      return cb(new Error("Only .csv files are allowed!"));
    }
  },
});

// Route for handling file uploads with input validation
app.post("/upload", upload.single("dataFile"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  let fileUrl;

  try {
    // Upload file to Vercel Blob
    const blob = await blobClient.put(
      `uploads/${Date.now()}_${req.file.originalname}`,
      {
        body: Readable.from(req.file.buffer),
        contentType: req.file.mimetype,
      }
    );

    fileUrl = blob.url; // The URL to access the uploaded file

    // Process the file content (e.g., parse CSV)
    const results = [];
    Readable.from(req.file.buffer)
      .pipe(csvParser({ headers: false })) // Indicate no headers in the CSV
      .on("data", (row) => {
        const monthData = {
          month: row[0], // First column is the month
          leavers: parseInt(row[1], 10), // Second column is leavers
          endCount: parseInt(row[2], 10), // Third column is endCount
        };
        results.push(monthData);
      })
      .on("end", async () => {
        // After processing, delete the file from Vercel Blob
        try {
          await blobClient.delete(blob.key);
          console.log("File deleted successfully from Vercel Blob.");
        } catch (deleteError) {
          console.error("Error deleting file:", deleteError);
        }

        // Send the processed results back to the client
        res.json({
          message: "File processed and deleted successfully",
          results,
        });
      })
      .on("error", (err) => {
        res.status(500).send(err.message);
      });
  } catch (error) {
    console.error("Error uploading or processing file:", error);
    res.status(500).send("File upload failed.");
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
