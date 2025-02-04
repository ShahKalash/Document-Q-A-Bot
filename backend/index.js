import express from 'express';
import multer from 'multer';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.static('public'));
const port = process.env.PORT || 3000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let pdfBuffer = null;
let summary = "";

app.post('/upload-pdf', (req, res, next) => {
  upload.single('pdf')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large. Max size is 10 MB.' });
      }
      return res.status(400).json({ error: 'Error uploading file.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    pdfBuffer = req.file.buffer;

    (async () => {
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
    })();
  });
});

app.post('/ask-question', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (!pdfBuffer) {
      return res.status(400).json({ error: 'No PDF uploaded' });
    }

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

app.get('/', (req, res) => {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  res.sendFile(path.join(__dirname, 'interface.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
