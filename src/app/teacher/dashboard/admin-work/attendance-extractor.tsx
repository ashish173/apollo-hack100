// @ts-nocheck

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Bot, X, FileImage, Download } from 'lucide-react';

const AttendanceExtractor = () => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const resultsEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Your Firebase Function URL - replace with your actual deployed function URL
  const FIREBASE_FUNCTION_URL = 'https://us-central1-role-auth-7bc43.cloudfunctions.net/claudeChat';

  const scrollToBottom = () => {
    resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [results]);

  const handleImageSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInput = (event) => {
    const file = event.target.files[0];
    handleImageSelect(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSelect(e.dataTransfer.files[0]);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processImage = async () => {
    if (!selectedImage) return;

    setIsLoading(true);

    try {
      const base64Image = await convertImageToBase64(selectedImage);
      const requestBody = {
        message: "Please analyze this attendance register and return the data in structured JSON format with employee names and their attendance status for each day.",
        image: base64Image,
        imageType: selectedImage.type
      };

      const response = await fetch(FIREBASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }

      const data = await response.json();
      
      const result = {
        id: Date.now(),
        imageName: selectedImage.name,
        imagePreview: imagePreview,
        response: data.response,
        timestamp: new Date().toLocaleString()
      };

      setResults(prev => [...prev, result]);
      removeImage();
    } catch (error) {
      console.error('Error:', error);
      const errorResult = {
        id: Date.now(),
        imageName: selectedImage.name,
        imagePreview: imagePreview,
        response: 'Sorry, I encountered an error processing the image. Please try again.',
        timestamp: new Date().toLocaleString(),
        error: true
      };
      setResults(prev => [...prev, errorResult]);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadJSON = (result) => {
    try {
      // Try to parse the response as JSON
      const jsonData = JSON.parse(result.response);
      const dataStr = JSON.stringify(jsonData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `attendance_${result.imageName.split('.')[0]}_${Date.now()}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      // If not valid JSON, download as text file
      const dataStr = result.response;
      const dataUri = 'data:text/plain;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `attendance_${result.imageName.split('.')[0]}_${Date.now()}.txt`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-800">Attendance Register Extractor</h1>
        </div>
        <p className="text-sm text-gray-600 mt-1">Upload attendance register images to extract structured data</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Upload Section */}
        <div className="w-1/3 bg-white border-r p-4">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Upload Image</h2>
          
          {/* Drag and Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-w-full max-h-48 mx-auto rounded-lg"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
                <p className="text-sm text-gray-600 mt-2">{selectedImage?.name}</p>
              </div>
            ) : (
              <div>
                <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Drag and drop an image here, or</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Choose File
                </button>
                <p className="text-xs text-gray-500 mt-2">Supports JPG, PNG, GIF, WebP</p>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            accept="image/*"
            className="hidden"
          />

          {/* Process Button */}
          {selectedImage && (
            <button
              onClick={processImage}
              disabled={isLoading}
              className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4 mr-2" />
                  Extract Attendance Data
                </>
              )}
            </button>
          )}
        </div>

        {/* Results Section */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 bg-white border-b">
            <h2 className="text-lg font-medium text-gray-800">Extracted Data</h2>
            <p className="text-sm text-gray-600">Results will appear here after processing</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {results.length === 0 && (
              <div className="text-center py-8">
                <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No results yet. Upload an attendance register to get started.</p>
              </div>
            )}

            {results.map((result) => (
              <div key={result.id} className="bg-white rounded-lg border shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <img 
                      src={result.imagePreview} 
                      alt="Processed" 
                      className="w-12 h-12 object-cover rounded border"
                    />
                    <div>
                      <h3 className="font-medium text-gray-800">{result.imageName}</h3>
                      <p className="text-xs text-gray-500">{result.timestamp}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadJSON(result)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>
                
                <div className="bg-gray-50 rounded p-3 max-h-64 overflow-y-auto">
                  <pre className={`text-sm whitespace-pre-wrap ${
                    result.error ? 'text-red-600' : 'text-gray-800'
                  }`}>
                    {result.response}
                  </pre>
                </div>
              </div>
            ))}

            <div ref={resultsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceExtractor;
