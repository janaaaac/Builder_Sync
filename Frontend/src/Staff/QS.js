import React, { useState } from 'react';
import axios from 'axios';

export default function BlueprintUploader() {
  const [apiKey, setApiKey] = useState('');
  const [images, setImages] = useState([]);
  const [response, setResponse] = useState('');
  const [csvData, setCsvData] = useState(null);

  const handleFileChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleSubmit = async () => {
    if (!apiKey || images.length === 0) {
      alert('Please provide API key and at least one image.');
      return;
    }

    const formData = new FormData();
    formData.append('apiKey', apiKey);
    images.forEach((file) => {
      formData.append('images', file);
    });

    try {
      const res = await axios.post('http://localhost:8000/api/blueprint', formData);
      setResponse(res.data.markdown);
      setCsvData(res.data.csv);
    } catch (err) {
      console.error(err);
      alert('Failed to process the images.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white shadow-md rounded p-6">
        <h1 className="text-2xl font-bold mb-4">Blueprint Take-off AI</h1>

        <label className="block mb-2 font-medium">OpenAI API Key</label>
        <input
          type="password"
          className="w-full p-2 border border-gray-300 rounded mb-4"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />

        <label className="block mb-2 font-medium">Upload Images</label>
        <input
          type="file"
          className="w-full mb-4"
          multiple
          accept="image/*"
          onChange={handleFileChange}
        />

        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Submit
        </button>

        {response && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Response (Markdown Table)</h2>
            <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">{response}</pre>

            {csvData && (
              <a
                href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvData)}`}
                download="takeoff_table.csv"
                className="inline-block mt-4 text-blue-600 hover:underline"
              >
                Download CSV
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}