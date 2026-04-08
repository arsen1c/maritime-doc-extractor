// import express from 'express';
// import Anthropic from '@anthropic-ai/sdk';
// import fs from 'fs';
// import path from 'path';

// const router = express.Router();
// const client = new Anthropic({ apiKey: 'sk-ant-REDACTED' });

// router.post('/extract', async (req, res) => {
//     const file = req.file;

//     if (!file) {
//         res.status(400).json({ error: 'No file uploaded' });
//         return;
//     }

//     try {
//         // Read the file and convert to base64
//         const fileData = fs.readFileSync(file.path);
//         const base64Data = fileData.toString('base64');

//         // Save file to disk permanently for reference
//         const savedPath = path.join('./uploads', file.originalname);
//         fs.copyFileSync(file.path, savedPath);

//         const response = await client.messages.create({
//             model: 'claude-opus-4-6',
//             max_tokens: 4096,
//             messages: [
//                 {
//                     role: 'user',
//                     content: [
//                         {
//                             type: 'image',
//                             source: {
//                                 type: 'base64',
//                                 media_type: file.mimetype,
//                                 data: base64Data,
//                             },
//                         },
//                         {
//                             type: 'text',
//                             text: 'Extract all information from this maritime document and return as JSON.',
//                         },
//                     ],
//                 },
//             ],
//         });

//         const result = JSON.parse(response.content[0].text);

//         // Store in memory for now
//         global.extractions = global.extractions || [];
//         global.extractions.push(result);

//         res.json(result);
//     } catch (error) {
//         console.log('Error:', error);
//         res.status(500).json({ error: 'Something went wrong' });
//     }
// });

// export default router;