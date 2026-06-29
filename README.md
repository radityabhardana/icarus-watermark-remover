# Icarus Watermark Remover

Icarus Watermark is an AI-powered image editing tool that allows you to seamlessly remove watermarks, text, logos, or any unwanted objects from images. It also features an AI Image Enhance mode to upscale and denoise low-quality images.

Built with Node.js, Express, and powered by the DashScope `qwen-image-edit-plus` model.

## Features

- **Watermark Remover**: Brush over any object to seamlessly remove it from the background.
- **Image Enhance**: Upscale, denoise, and enhance details of low-resolution images.
- **Before/After Comparison**: Interactive slider to compare the original image with the processed result.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- A DashScope API Key.

## Installation & Setup

1. **Clone the repository** (or download the source code):
   ```bash
   git clone <your-repo-url>
   cd watermark-remover
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a new file named `.env` in the root directory and add your DashScope API Key:
   ```env
   DASHSCOPE_API_KEY=your_api_key_here
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

5. **Open the Application**:
   Open your browser and navigate to:
   [http://localhost:3000](http://localhost:3000)

## Usage

1. **Upload**: Drag and drop an image or click to browse files.
2. **Select Mode**: Choose between "Watermark Remover" or "Enhance Image" from the top toggle.
3. **Brush (Watermark Mode)**: Adjust the brush size and paint over the elements you want to remove.
4. **Instruction (Optional)**: Provide a specific text prompt to guide the AI on what to remove or enhance.
5. **Execute**: Click "Execute Clean" and wait for the AI to process the image.
6. **Compare & Download**: Use the before/after slider to review the changes, then download the result!
