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
app.set("trust proxy", 1); // Trust the X-Forwarded-For header, crucial for Vercel or other proxy environments
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

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

// Multer setup for file uploads using memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "text/csv" && !file.originalname.endsWith(".csv")) {
      return cb(new Error("Only .csv files are allowed!"));
    }
    cb(null, true);
  },
});

// Route for handling file uploads with input validation, Vercel Blob storage, and CSV parsing
app.post("/upload", upload.single("dataFile"), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error("No file uploaded.");
    }

    console.log("File received:", req.file.originalname);

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
      .pipe(csvParser({ headers: false }))
      .on("data", (row) => {
        console.log("CSV Row:", row);

        const leavers = parseInt(row[1], 10);
        const endCount = parseInt(row[2], 10);

        if (isNaN(leavers) || isNaN(endCount)) {
          console.warn(`Skipping invalid row: ${JSON.stringify(row)}`);
          return;
        }

        const monthData = {
          leavers,
          endCount,
        };
        results.push(monthData);
      })
      .on("end", () => {
        if (results.length === 0) {
          throw new Error("No valid data found in the uploaded file.");
        }
        res.json({
          message: "File uploaded and processed successfully",
          fileUrl: blob.url,
          results,
        });
      })
      .on("error", (err) => {
        throw new Error(`Error parsing the file: ${err.message}`);
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
  console.log(`Server running on http://localhost:${PORT}`);
});
