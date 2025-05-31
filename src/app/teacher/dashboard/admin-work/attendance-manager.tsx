import React, { useState } from 'react';
import { Upload, Eye, Loader2, AlertCircle } from 'lucide-react';

const VisionApp = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [analysisType, setAnalysisType] = useState('TEXT_DETECTION');

  // Firebase function URL - replace with your actual function URL
  const FIREBASE_FUNCTION_URL = 'https://us-central1-role-auth-7bc43.cloudfunctions.net/analyzeImage';

  // @ts-ignore
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setResults(null);
      
      // Create preview
      const reader = new FileReader();
      // @ts-ignore
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // @ts-ignore
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove data:image/...;base64, prefix
        // @ts-ignore
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const analyzeImage = async () => {
    if (!selectedFile) {
      // @ts-ignore
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const base64Image = await convertToBase64(selectedFile);
      
      const response = await fetch(FIREBASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          features: [{ type: analysisType, maxResults: 10 }]
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      // @ts-ignore
      setError(`Error analyzing image: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderResults = () => {
    if (!results) return null;

    switch (analysisType) {
      case 'TEXT_DETECTION':
        return (
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Detected Text:</h3>
            {results.textAnnotations?.map((text, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded border">
                <p className="text-sm text-gray-600">Confidence: {(text.confidence * 100).toFixed(1)}%</p>
                <p className="mt-1">{text.description}</p>
              </div>
            ))}
          </div>
        );
      
      case 'LABEL_DETECTION':
        return (
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Detected Labels:</h3>
            {results.labelAnnotations?.map((label, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                <span className="font-medium">{label.description}</span>
                <span className="text-sm text-gray-600">{(label.score * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        );
      
      case 'FACE_DETECTION':
        return (
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Face Detection:</h3>
            {results.faceAnnotations?.map((face, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded border">
                <p><strong>Face {index + 1}:</strong></p>
                <p>Joy: {face.joyLikelihood}</p>
                <p>Sorrow: {face.sorrowLikelihood}</p>
                <p>Anger: {face.angerLikelihood}</p>
                <p>Surprise: {face.surpriseLikelihood}</p>
              </div>
            ))}
          </div>
        );
      
      default:
        return (
          <div className="p-3 bg-gray-50 rounded border">
            <pre className="text-sm overflow-auto">{JSON.stringify(results, null, 2)}</pre>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Google Vision API Analyzer</h1>
        <p className="text-gray-600">Upload an image to analyze with Google Cloud Vision</p>
      </div>

      {/* Analysis Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Analysis Type:
        </label>
        <select
          value={analysisType}
          onChange={(e) => setAnalysisType(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="TEXT_DETECTION">Text Detection</option>
          <option value="LABEL_DETECTION">Label Detection</option>
          <option value="FACE_DETECTION">Face Detection</option>
          <option value="OBJECT_LOCALIZATION">Object Detection</option>
          <option value="LANDMARK_DETECTION">Landmark Detection</option>
        </select>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg text-gray-600">Click to upload an image</p>
            <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
          </label>
        </div>
      </div>

      {/* Image Preview */}
      {preview && (
        <div className="mb-6">
          <img
            src={preview}
            alt="Preview"
            className="max-w-full max-h-96 mx-auto rounded-lg shadow-md"
          />
        </div>
      )}

      {/* Analyze Button */}
      <div className="text-center mb-6">
        <button
          onClick={analyzeImage}
          disabled={!selectedFile || loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Eye className="h-5 w-5" />
              Analyze Image
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="bg-gray-50 rounded-lg p-6">
          {renderResults()}
        </div>
      )}
    </div>
  );
};

export default VisionApp;