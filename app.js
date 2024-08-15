import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import path from "path";
import csvParser from "csv-parser";
import { Readable } from "stream";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import { put } from "@vercel/blob";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  res.sendFile(path.resolve(__dirname, "public/guide.html"));
});

app.set("trust proxy", 1); // Trust first proxy

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

// Route for handling file uploads with input validation, Vercel Blob storage, and CSV parsing
app.post("/upload", upload.single("dataFile"), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error("No file uploaded.");
    }

    console.log("Received file:", req.file.originalname);

    // Upload file to Vercel Blob
    const blob = await put(
      `uploads/${Date.now()}_${req.file.originalname}`,
      req.file.buffer,
      {
        access: "public",
      }
    );

    console.log("File uploaded to Vercel Blob:", blob.url);

    const results = [];
    Readable.from(req.file.buffer)
      .pipe(csvParser({ headers: false })) // Assuming the CSV doesn't have headers
      .on("data", (row) => {
        console.log("CSV Row:", row);

        const month = parseInt(row[0], 10); // The first column is the month (1 to 12)
        const leavers = parseInt(row[1], 10); // The second column is leavers
        const endCount = parseInt(row[2], 10); // The third column is endCount

        if (isNaN(month) || isNaN(leavers) || isNaN(endCount)) {
          console.warn(`Skipping invalid row: ${JSON.stringify(row)}`);
          return;
        }

        const monthData = {
          month,
          leavers,
          endCount,
        };
        results.push(monthData);
      })
      .on("end", () => {
        console.log("Parsed Results:", results);

        if (results.length === 0) {
          return res
            .status(400)
            .send("No valid data found in the uploaded file.");
        }

        res.json({
          message: "File uploaded and processed successfully",
          fileUrl: blob.url,
          results,
        });
      })
      .on("error", (err) => {
        console.error("Error parsing the file:", err);
        res.status(500).send("Error parsing the file");
      });
  } catch (error) {
    console.error("Error during file upload or processing:", error.message);
    res.status(500).send("Something broke!");
  }
});

// Error handling middleware with detailed logging
app.use((err, req, res, next) => {
  console.error("Error stack:", err.stack); // Log the full error stack
  console.error("Error message:", err.message); // Log the error message
  res.status(500).send("Something broke!");
});

// Start the server
app.listen(PORT, () => {
  console.log("Server is running");
});
