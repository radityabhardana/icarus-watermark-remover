const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3000;

// Increase payload limit for large base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/process-image', upload.fields([{ name: 'image' }, { name: 'mask' }]), async (req, res) => {
    try {
        const apiKey = process.env.DASHSCOPE_API_KEY?.trim();
        if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
            return res.status(500).json({ error: 'DASHSCOPE_API_KEY is not set in .env' });
        }

        const imageFile = req.files && req.files['image'] ? req.files['image'][0] : null;
        const maskFile = req.files && req.files['mask'] ? req.files['mask'][0] : null;

        if (!imageFile) {
            return res.status(400).json({ error: 'No image provided.' });
        }

        // Convert image to base64
        const dataUri = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;
        
        const prompt = req.body.prompt || 'Remove any watermarks, texts, or logos from the image seamlessly';

        let contentArray = [
            { image: dataUri }
        ];

        if (maskFile) {
            const maskUri = `data:${maskFile.mimetype};base64,${maskFile.buffer.toString('base64')}`;
            contentArray.push({ image: maskUri });
            contentArray.push({ text: "The second image is a mask indicating the location of the watermark. Analyze the watermark in the masked area of the first image and remove it seamlessly. " + prompt });
        } else {
            contentArray.push({ text: prompt });
        }

        // Call DashScope Singapore (Intl) Endpoint synchronously
        const submitUrl = 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
        const submitResponse = await axios.post(submitUrl, {
            model: 'qwen-image-edit-plus',
            input: {
                messages: [
                    {
                        role: 'user',
                        content: contentArray
                    }
                ]
            }
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const choices = submitResponse.data.output?.choices;
        if (choices && choices.length > 0) {
            const resultContent = choices[0].message.content;
            const imageObj = resultContent.find(item => item.image);
            if (imageObj && imageObj.image) {
                let finalResultUrl = imageObj.image;
                if (finalResultUrl.startsWith('http')) {
                    try {
                        const imgResp = await axios.get(finalResultUrl, { responseType: 'arraybuffer' });
                        const mimeType = imgResp.headers['content-type'] || 'image/png';
                        const base64Img = Buffer.from(imgResp.data, 'binary').toString('base64');
                        finalResultUrl = `data:${mimeType};base64,${base64Img}`;
                    } catch (err) {
                        console.error('Failed to download image from OSS:', err.message);
                    }
                }
                return res.json({ success: true, result: finalResultUrl });
            }
        }

        return res.status(500).json({ error: 'Unexpected API response format', details: submitResponse.data });

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Internal Server Error', details: error.response ? error.response.data : error.message });
    }
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

module.exports = app;
