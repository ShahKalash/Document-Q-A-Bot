import express from 'express';
import multer from 'multer';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize the Express app
const app = express();
app.use(express.static('public'));
const port = process.env.PORT || 3000;

// Initialize the GoogleGenerativeAI instance
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });

// Configure multer for file uploads (in-memory storage for PDFs)
const upload = multer({ storage: multer.memoryStorage() });

// Middleware for parsing JSON bodies and url-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Store the uploaded PDF buffer and the summary
let pdfBuffer = null;
let summary = "";

// Endpoint to upload PDF and save it to memory
app.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file uploaded' });
  }

  // Save the PDF buffer in memory
  pdfBuffer = req.file.buffer;

  // Generate summary using the PDF content
  try {
    const result = await model.generateContent([
      {
        inlineData: {
          data: pdfBuffer.toString('base64'),
          mimeType: 'application/pdf',
        },
      },
      'Summarize this document',
    ]);

    summary = result.response.text ? result.response.text() : 'Summary not available';
    res.json({ message: 'PDF uploaded and summary generated successfully', summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error generating summary' });
  }
});

// Endpoint to ask a question based on the uploaded PDF content
app.post('/ask-question', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (!pdfBuffer) {
      return res.status(400).json({ error: 'No PDF uploaded' });
    }

    // Send the question and PDF content to Gemini for processing
    const result = await model.generateContent([
      {
        inlineData: {
          data: pdfBuffer.toString('base64'),
          mimeType: 'application/pdf',
        },
      },
      `Answer the following question based on the PDF document: ${question}`,
    ]);

    const answer = result.response.text ? result.response.text() : 'No answer found';
    res.json({ answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing the question' });
  }
});

// Serve the HTML interface for file upload and asking questions
app.get('/', (req, res) => {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  res.sendFile(path.join(__dirname, 'interface.html'));
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
