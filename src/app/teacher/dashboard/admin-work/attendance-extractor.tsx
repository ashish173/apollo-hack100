import React, { useState, useRef, useEffect } from 'react';
import { Upload, Bot, X, FileImage, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { storage, app } from '../../../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { attendanceExtractionPrompt } from './prompt';

const auth = getAuth(app);
const db = getFirestore(app);

// Add types for result items
interface AttendanceResult {
  id: number;
  imageName: string;
  imagePreview: string | null;
  rawResponse: string;
  parsedData?: any;
  timestamp: string;
  error?: boolean;
}

const AttendanceExtractor = () => {
  const [results, setResults] = useState<AttendanceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const resultsEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const FIREBASE_FUNCTION_URL = 'https://us-central1-role-auth-7bc43.cloudfunctions.net/claudeChat';

  const scrollToBottom = () => {
    if (resultsEndRef.current && typeof resultsEndRef.current.scrollIntoView === 'function') {
      resultsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [results]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIsBlinking(prev => !prev);
    }, 500);

    return () => clearInterval(intervalId);
  }, []);

  const handleImageSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target && typeof e.target.result === 'string') {
          setImagePreview(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) handleImageSelect(file);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
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

  const handleDownloadSampleImage = () => {
    const imageUrl = 'https://firebasestorage.googleapis.com/v0/b/role-auth-7bc43.firebasestorage.app/o/sample%2Fsample%20attedence%20register%20capture.jpeg?alt=media&token=de925fe9-7c26-46fd-9210-1b86f76f7061';
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = "sample_attendance_register.jpeg";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to read file as base64 string.'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Utility to attempt to fix common JSON issues
  function cleanAndFixJsonString(jsonString: string): string {
    let cleaned = jsonString
      .replace(/\xA0/g, ' ')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
      .replace(/\"\s*:\s*\"/g, '": "') // Normalize key-value
      .trim();

    // Try to auto-close brackets if obviously truncated
    const openBraces = (cleaned.match(/\{/g) || []).length;
    const closeBraces = (cleaned.match(/\}/g) || []).length;
    const openBrackets = (cleaned.match(/\[/g) || []).length;
    const closeBrackets = (cleaned.match(/\]/g) || []).length;
    if (openBraces > closeBraces) cleaned += '}'.repeat(openBraces - closeBraces);
    if (openBrackets > closeBrackets) cleaned += ']'.repeat(openBrackets - closeBrackets);

    return cleaned;
  }

  const extractJsonFromString = (text: string) => {
    try {
      let jsonString = '';
      // First try to find JSON in code blocks
      const jsonMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1];
      } else {
        // Try to find any JSON object in the text
        const objectMatch = text.match(/\{[\s\S]*\}/);
        if (objectMatch && objectMatch[0]) {
          jsonString = objectMatch[0];
        } else {
          // If no JSON object found, try to parse the entire text
          jsonString = text;
        }
      }

      // Clean and attempt to fix JSON string
      const cleanJsonString = cleanAndFixJsonString(jsonString);
      const parsed = JSON.parse(cleanJsonString);

      // Validate the parsed JSON structure
      if (!parsed || typeof parsed !== 'object') {
        throw new Error("Invalid JSON structure: not an object");
      }

      // Check for any of the supported data structures
      const hasValidStructure = 
        (parsed.employees && Array.isArray(parsed.employees)) ||
        (parsed.attendance_data && Array.isArray(parsed.attendance_data)) ||
        (parsed.entries && Array.isArray(parsed.entries)) ||
        (parsed.students && Array.isArray(parsed.students)) ||
        (parsed.attendance && Array.isArray(parsed.attendance));

      if (!hasValidStructure) {
        throw new Error("No recognized attendance data structure found");
      }

      return parsed;
    } catch (e: unknown) {
      console.error("Could not parse JSON from response:", e);
      // Show a textarea for manual correction
      showManualJsonCorrectionBox(text, e instanceof Error ? e.message : 'Unknown error');
      return null;
    }
  };

  // Show a textarea for manual correction if JSON parsing fails
  function showManualJsonCorrectionBox(rawText: string, errorMsg: string) {
    const messageBox = document.createElement('div');
    messageBox.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
    messageBox.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-xl text-center max-w-2xl w-full">
        <p class="text-lg font-semibold mb-4 text-red-600">Failed to parse AI response as JSON: ${errorMsg}</p>
        <p class="text-sm text-gray-700 mb-2">You can manually correct the JSON below and click 'Try Again'.</p>
        <textarea id="manual-json-textarea" class="w-full h-40 border rounded p-2 mb-4 text-xs" style="font-family:monospace;">${rawText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
        <div class="flex justify-center space-x-2">
          <button id="manual-json-try-again" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Try Again</button>
          <button id="manual-json-cancel" class="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(messageBox);

    (document.getElementById('manual-json-cancel') as HTMLButtonElement).onclick = () => {
      document.body.removeChild(messageBox);
    };
    (document.getElementById('manual-json-try-again') as HTMLButtonElement).onclick = () => {
      const textarea = document.getElementById('manual-json-textarea') as HTMLTextAreaElement;
      let value = textarea.value;
      try {
        const fixed = JSON.parse(value);
        // Optionally, you could trigger a re-processing here
        showCustomMessageBox('JSON parsed successfully! Please re-upload the image to process again.', false);
        document.body.removeChild(messageBox);
      } catch (err: any) {
        alert('Still not valid JSON: ' + (err instanceof Error ? err.message : String(err)));
      }
    };
  }

  const processImage = async () => {
    if (!selectedImage) return;

    setIsLoading(true);

    try {
      const base64Image = await convertImageToBase64(selectedImage);
      const requestBody = {
        message: attendanceExtractionPrompt,
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
        throw new Error(`Failed to process image: ${response.statusText}`);
      }

      const data = await response.json();
      const rawResponseText = data.response;
      const parsedJson = extractJsonFromString(rawResponseText);
      console.log("Parsed JSON data:", parsedJson); // TEMPORARY DEBUG LOG

      setResults(prev => [...prev, {
        id: Date.now(),
        imageName: selectedImage.name,
        imagePreview: imagePreview,
        rawResponse: rawResponseText,
        parsedData: parsedJson,
        timestamp: new Date().toLocaleString(),
      }]);
      removeImage();
    } catch (error) {
      console.error('Error:', error);
      setResults(prev => [...prev, {
        id: Date.now(),
        imageName: selectedImage.name,
        imagePreview: imagePreview,
        rawResponse: `Sorry, I encountered an error processing the image: ${error.message}. Please try again.`,
        timestamp: new Date().toLocaleString(),
        error: true,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadJSON = (result: AttendanceResult) => {
    const dataToDownload = result.parsedData || extractJsonFromString(result.rawResponse);
    if (!dataToDownload) {
      showCustomMessageBox("No valid JSON data to download.");
      return;
    }
    const dataStr = JSON.stringify(dataToDownload, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `attendance_${result.imageName.split('.')[0]}_${Date.now()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  };

  const downloadExcel = async (result: AttendanceResult) => {
    const dataToProcess = result.parsedData || extractJsonFromString(result.rawResponse);
    console.log("Data for Excel processing:", dataToProcess);
    if (!dataToProcess) {
      showCustomMessageBox("No valid data to process for Excel generation.", true);
      return;
    }
    let flattenedData = [];
    let exportFileDefaultName = `attendance_${result.imageName.split('.')[0]}_${Date.now()}.xlsx`;
    // Determine the correct data array based on the parsed JSON structure
    let attendanceRecords = null;
    const possibleArrays = [
      dataToProcess.attendance_data,
      dataToProcess.employees,
      dataToProcess.entries,
      dataToProcess.students,
      dataToProcess.attendance
    ];
    attendanceRecords = possibleArrays.find(arr => Array.isArray(arr) && arr.length > 0);
    if (!attendanceRecords) {
      showCustomMessageBox("No valid attendance entries found in the extracted data.", true);
      return;
    }
    try {
      // Process data based on identified structure
      if (attendanceRecords[0]?.student_name !== undefined && attendanceRecords[0]?.status !== undefined) {
        flattenedData = attendanceRecords.map((record: any) => ({
          "Name": record.student_name || '',
          "Status": record.status || ''
        }));
      } else if (attendanceRecords[0]?.attendance !== undefined) {
        let allDates = new Set();
        attendanceRecords.forEach((record: any) => {
          if (record.attendance && typeof record.attendance === 'object') {
            Object.keys(record.attendance).forEach(date => allDates.add(date));
          }
        });
        const sortedDates = Array.from(allDates).sort((a, b) => parseInt(a as string) - parseInt(b as string));
        flattenedData = attendanceRecords.map((record: any) => {
          const flattenedRecord: { [key: string]: string } = {
            "Name": record.name || record.student_name || '',
          };
          sortedDates.forEach(date => {
            flattenedRecord[`Day ${date}`] = record.attendance?.[date] || '';
          });
          return flattenedRecord;
        });
      } else if (attendanceRecords[0]?.date !== undefined) {
        flattenedData = attendanceRecords.map((record: any) => ({
          "Date": record.date || '',
          "Name": record.name || record.student_name || '',
          "Status": record.status || ''
        }));
      } else {
        flattenedData = attendanceRecords.map((record: any) => {
          const row: { [key: string]: string | number } = {};
          Object.entries(record).forEach(([key, value]) => {
            if (typeof value === 'string' || typeof value === 'number') {
              row[key.charAt(0).toUpperCase() + key.slice(1)] = value;
            }
          });
          return row;
        });
      }
      const ws = XLSX.utils.json_to_sheet(flattenedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance");
      if (dataToProcess.legend) {
        const legendData = Object.entries(dataToProcess.legend).map(([code, meaning]) => ({
          "Code": code,
          "Meaning": meaning
        }));
        const legendWs = XLSX.utils.json_to_sheet(legendData);
        XLSX.utils.book_append_sheet(wb, legendWs, "Legend");
      }
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(excelBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportFileDefaultName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (storage) {
        try {
          const storageRef = ref(storage, `excel_sheets/${exportFileDefaultName}`);
          const snapshot = await uploadBytes(storageRef, excelBlob);
          const storageLink = await getDownloadURL(snapshot.ref);
          showCustomMessageBox("Excel file downloaded and uploaded to Firebase Storage!");
          const currentUser = auth.currentUser;
          if (currentUser) {
            await addDoc(collection(db, 'Attendance-records'), {
              userId: currentUser.uid,
              userEmail: currentUser.email,
              storageLink: storageLink,
              fileName: exportFileDefaultName,
              uploadTimestamp: serverTimestamp(),
            });
          }
        } catch (uploadError: any) {
          console.error('Error uploading to Firebase Storage:', uploadError);
          showCustomMessageBox(`Excel file downloaded, but there was an error uploading to Firebase Storage: ${uploadError.message}`);
        }
      }
    } catch (error: any) {
      console.error('Error creating Excel file:', error);
      showCustomMessageBox(`Failed to generate Excel file: ${error.message}`, true);
    }
  };

  const showCustomMessageBox = (message, isError = false) => {
    const messageBox = document.createElement('div');
    messageBox.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
    messageBox.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-xl text-center">
        <p class="text-lg font-semibold mb-4 ${isError ? 'text-red-600' : 'text-gray-800'}">${message}</p>
        <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" onclick="this.parentElement.parentElement.remove()">OK</button>
      </div>
    `;
    document.body.appendChild(messageBox);
  };


  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto bg-gray-50 font-sans">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4 rounded-b-lg">
        <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-800">Attendance Register Extractor</h1>
        </div>
        <p className="text-sm text-gray-600 mt-1">Upload attendance register images to extract structured data</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Upload Section */}
        <div className="w-1/3 bg-white border-r p-4 rounded-bl-lg">
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
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Choose File
                </button>
                <button
                  onClick={handleDownloadSampleImage}
                  className={`mt-4 px-4 py-2 rounded-lg transition-colors flex items-center justify-center text-white ${
                    isBlinking ? 'bg-red-700' : 'bg-red-500'
                  } hover:bg-red-600`}
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Download Sample Image
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
              className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
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
          <div className="p-4 bg-white border-b rounded-br-lg">
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
                  </div>
                  <div className="flex space-x-2">
                    {result.parsedData && (
                      <>
                        <button
                          onClick={() => downloadJSON(result)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center space-x-1 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          <span>JSON</span>
                        </button>
                        <button
                          onClick={() => downloadExcel(result)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center space-x-1 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          <span>Excel</span>
                        </button>
                      </>
                    )}
                  </div>
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
