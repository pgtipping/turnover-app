require("dotenv").config();

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const csvParser = require("csv-parser");
const ExcelJS = require("exceljs");
const puppeteer = require("puppeteer");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid"); // Import UUID library

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static files securely
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

app.get("/guide", function (req, res) {
  res.sendFile(__dirname + "/public/guide.html");
});

// Multer setup for secure file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, process.env.FILE_UPLOAD_PATH || "uploads/"),
  filename: (req, file, cb) => {
    // Generate a secure filename using UUID
    const secureName = `${file.fieldname}-${uuidv4()}${path.extname(
      file.originalname
    )}`;

    // Sanitize the file extension (basic example)
    const safeExt = path.extname(secureName).replace(/[^a-zA-Z0-9.]/g, "");

    // Construct the final filename
    const finalName =
      path.basename(secureName, path.extname(secureName)) + safeExt;

    cb(null, finalName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  if (!allowedTypes.includes(file.mimetype)) {
    cb(new Error("Unsupported file type"), false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // for example, 10 MB
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
app.post("/upload", upload.single("dataFile"), (req, res) => {
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csvParser({ headers: false })) // Indicate no headers in the CSV
    .on("data", (row) => {
      // Create an object for each row with properties for each column
      const monthData = {
        month: row[0], // First column is the month
        leavers: parseInt(row[1], 10), // Second column is leavers
        endCount: parseInt(row[2], 10), // Third column is endCount
      };
      results.push(monthData);
    })
    .on("end", () => {
      res.json(results); // Send the parsed data back to the client
    })
    .on("error", (err) => {
      res.status(500).send(err.message);
    });
});

// async function processUploadedFile(filePath) {
//   return new Promise((resolve, reject) => {
//     const results = [];
//     fs.createReadStream(filePath)
//       .pipe(csvParser({ headers: false }))
//       .on("data", (row) => {
//         // Assume CSV rows are: [month, employeesLeft, employeesEnd]
//         const turnoverRate = calculateTurnoverRate(
//           parseInt(row[1]),
//           parseInt(row[2])
//         );
//         results.push({ month: row[0], turnoverRate });
//       })
//       .on("end", () => resolve(results))
//       .on("error", reject);
//   });
// }

// function calculateTurnoverRate(employeesLeft, employeesEnd) {
//   // Simplified calculation, adjust according to your logic in script.js
//   return employeesEnd > 0 ? (employeesLeft / employeesEnd) * 100 : 0;
// }

// PDF Generation Endpoint - opens in a new tab
// app.post('/generate-pdf', async (req, res) => {
//     try {
//         const browser = await puppeteer.launch();
//         const page = await browser.newPage();

//         // Set the content of the page
//         await page.setContent(req.body.content, { waitUntil: 'networkidle0' });

//         // Wait for a specific JavaScript condition to be true
//         // Example: wait for the chart to be rendered by checking for a canvas element
//         await page.waitForFunction(
//             () => !!document.querySelector('canvas'),
//             { timeout: 10000 } // waits for 10 seconds
//         );

//         // Wait for any selectors that are dynamically populated by client-side JavaScript
//         // Example: wait for a specific table row to appear
//         await page.waitForSelector('#ratesTableBody tr', { timeout: 10000 });

//         // Now, we take the screenshot for debugging
//         await page.screenshot({ path: 'page_screenshot.png' });

//         // And generate the PDF
//         const pdf = await page.pdf({ format: 'A4', printBackground: true });

//         await browser.close();

//         res.contentType("application/pdf");
//         res.send(pdf);

//     } catch (error) {
//         console.error('Error generating PDF:', error);
//         res.status(500).send('Error generating PDF');
//     }
// });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
