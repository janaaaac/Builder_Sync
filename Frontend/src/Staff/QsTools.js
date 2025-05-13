import React, { useState, useRef } from "react";
import axios from "axios";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import StaffSidebar from "./staffSideBar";

const QsTools = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");
  const [boqResult, setBoqResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingBOQ, setGeneratingBOQ] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("takeoff");
  const [projectInfo, setProjectInfo] = useState({
    projectName: "",
    location: "",
    client: ""
  });
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setResult(""); // Clear result when new file is selected
      setError(""); // Clear any previous errors
      
      // Create a preview for the image
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };
  
  const clearFile = () => {
    setFile(null);
    setFileName("");
    setPreviewUrl(null);
    setResult("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a drawing image first.");
      return;
    }

    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://localhost:8000/analyze-drawing/", formData);
      setResult(response.data.result);
    } catch (error) {
      console.error("Upload failed:", error);
      setError("Failed to analyze the drawing. Please try again.");
      setResult("");
    }

    setLoading(false);
  };

  // Function to parse the text table into array data
  const parseTableData = (textData) => {
    if (!textData) return null;
    
    // Split by lines and filter out empty lines
    const lines = textData.split('\n').filter(line => line.trim());
    
    // Identify if there's a header row
    const headerIndex = lines.findIndex(line => 
      line.toLowerCase().includes("item") || 
      line.toLowerCase().includes("description") ||
      line.toLowerCase().includes("unit") ||
      line.toLowerCase().includes("quantity") ||
      line.toLowerCase().includes("rate") ||
      line.toLowerCase().includes("amount")
    );
    
    const startIndex = headerIndex !== -1 ? headerIndex : 0;
    
    // Parse rows into columns
    const rows = lines.slice(startIndex).map(line => {
      // Check if table uses pipe separators
      if (line.includes('|')) {
        return line.split('|')
          .map(cell => cell.trim())
          .filter(cell => cell);
      }
      
      // Otherwise use whitespace with sensible grouping
      return line.split(/\s{2,}/).map(cell => cell.trim()).filter(cell => cell);
    });
    
    return rows;
  };

  // Function to format table data for better readability
  const formatTableDisplay = (textData) => {
    if (!textData) return null;
    
    // Check if the textData is already formatted as a table with pipe separators
    const hasPipeSeparators = textData.includes('|');
    
    // Split by lines and filter out empty lines
    const lines = textData.split('\n').filter(line => line.trim());
    
    // Identify if there's a header row
    const headerIndex = lines.findIndex(line => 
      line.toLowerCase().includes("item") || 
      line.toLowerCase().includes("description") ||
      line.toLowerCase().includes("unit") ||
      line.toLowerCase().includes("quantity") ||
      line.toLowerCase().includes("rate") ||
      line.toLowerCase().includes("amount")
    );
    
    // If no header found, return the original text in a pre tag
    if (headerIndex === -1) {
      return <pre className="whitespace-pre-wrap text-sm bg-white p-4 rounded-lg">{textData}</pre>;
    }
    
    // Process the table rows
    const headerLine = lines[headerIndex];
    let headers = [];
    
    // Parse headers
    if (hasPipeSeparators) {
      headers = headerLine.split('|')
        .map(cell => cell.trim())
        .filter(cell => cell);
    } else {
      headers = headerLine.split(/\s{2,}/).map(cell => cell.trim()).filter(cell => cell);
    }
    
    // Process data rows
    const dataRows = [];
    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      // Skip divider lines or empty lines
      if (line.trim().startsWith('+---') || line.trim().startsWith('|---') || !line.trim()) {
        continue;
      }
      
      let cells = [];
      if (hasPipeSeparators) {
        cells = line.split('|')
          .map(cell => cell.trim())
          .filter(cell => cell);
      } else {
        cells = line.split(/\s{2,}/).map(cell => cell.trim()).filter(cell => cell);
      }
      
      // If it's a total/subtotal row, handle specially
      const isTotal = line.toLowerCase().includes('total') || 
                      line.toLowerCase().includes('subtotal') ||
                      line.toLowerCase().includes('grand total') ||
                      cells.some(cell => 
                        cell.toLowerCase().includes('total') ||
                        cell.toLowerCase().includes('subtotal')
                      ) ||
                      // Also detect rows with different styling that might be totals
                      (hasPipeSeparators && cells.length > 0 && cells[0].trim() === '' && cells.some(c => /[\d,]+(\.\d+)?/.test(c)));
      
      // Is this a section header row? (Might be in BOQ tables)
      const isSectionHeader = cells.length === 1 || 
                              (cells.length > 1 && cells[0].trim() && !cells[1].trim() && !isTotal) ||
                              cells.some(c => /^[A-Z][\.:]/.test(c));
      
      // Add color-coding for LKR values
      const formattedCells = cells.map(cell => {
        // Check if the cell contains a number with commas and potentially LKR
        if (/[\d,]+(\.\d+)?/.test(cell) && (
            headers.some(h => h.toLowerCase().includes('amount')) || 
            headers.some(h => h.toLowerCase().includes('rate'))
        )) {
          // If it's a currency cell, format it
          return cell.includes('LKR') ? cell : 
                 cell.trim() ? `LKR ${cell.trim()}` : cell;
        }
        return cell;
      });
      
      if (cells.length > 0) {
        dataRows.push({ cells: formattedCells, isTotal, isSectionHeader });
      }
    }
    
    // Add CSS header class based on header content
    const getHeaderClass = (header) => {
      const headerText = header.toLowerCase();
      if (headerText.includes('item') || headerText.includes('code'))
        return 'w-24 bg-blue-50';
      if (headerText.includes('description'))
        return 'w-auto max-w-sm bg-blue-50';
      if (headerText.includes('unit'))
        return 'w-20 bg-blue-50';
      if (headerText.includes('quantity'))
        return 'w-28 bg-blue-50';
      if (headerText.includes('rate'))
        return 'w-32 bg-blue-50';
      if (headerText.includes('amount'))
        return 'w-36 bg-blue-50';
      return 'bg-blue-50';
    };
    
    // Render the formatted table
    return (
      <div className="overflow-x-auto">
        <div className="border border-gray-200 rounded-xl shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                {headers.map((header, index) => (
                  <th 
                    key={index} 
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-blue-500 last:border-r-0 ${getHeaderClass(header)}`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dataRows.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className={row.isTotal 
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 font-semibold border-t-2 border-blue-200' 
                    : row.isSectionHeader
                    ? 'bg-gray-100 font-semibold'
                    : rowIndex % 2 === 0 
                      ? 'bg-white hover:bg-blue-50 transition-colors' 
                      : 'bg-gray-50 hover:bg-blue-50 transition-colors'
                  }
                >
                  {row.cells.map((cell, cellIndex) => {
                    // Determine if this is a currency cell (amount or rate)
                    const isCurrency = headers[cellIndex] && 
                      (headers[cellIndex].toLowerCase().includes('amount') || 
                       headers[cellIndex].toLowerCase().includes('rate'));
                    
                    // Determine if this is a quantity cell
                    const isQuantity = headers[cellIndex] && 
                      headers[cellIndex].toLowerCase().includes('quantity');
                    
                    // Determine if this is an item code cell
                    const isItemCode = headers[cellIndex] && 
                      (headers[cellIndex].toLowerCase().includes('item') || 
                       headers[cellIndex].toLowerCase().includes('code'));
                    
                    // Determine if this cell contains a number
                    const isNumber = /^[\d,]+(\.\d+)?$/.test(cell.replace('LKR', '').trim());
                    
                    // Special styling for different cell types
                    let cellStyle = '';
                    if (isCurrency) {
                      cellStyle = 'text-right font-medium text-emerald-700';
                    } else if (isQuantity && isNumber) {
                      cellStyle = 'text-right font-medium text-blue-700';
                    } else if (isItemCode) {
                      cellStyle = 'font-medium text-gray-900';
                    } else if (cell.toLowerCase().includes('total')) {
                      cellStyle = 'font-semibold text-gray-900';
                    } else if (row.isSectionHeader) {
                      cellStyle = 'font-semibold text-blue-800';
                    }
                    
                    return (
                      <td 
                        key={cellIndex} 
                        className={`px-4 py-2.5 text-sm border-r border-gray-200 last:border-r-0 ${cellStyle || 'text-gray-700'}`}
                        colSpan={row.isSectionHeader && cellIndex === 0 && row.cells.length === 1 ? headers.length : 1}
                      >
                        {/* Format currency cells */}
                        {isCurrency && isNumber ? (
                          <span className="inline-flex items-center">
                            {cell.includes('LKR') ? cell : `LKR ${cell}`}
                          </span>
                        ) : (
                          cell
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Add a caption under the table with the total if available */}
        {dataRows.some(row => row.isTotal) && (
          <div className="flex items-center justify-end mt-3 text-sm font-medium text-gray-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
            <svg className="w-4 h-4 mr-1 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            All prices shown in Sri Lankan Rupees (LKR)
          </div>
        )}
      </div>
    );
  };

  // Function to export to Excel
  const exportToExcel = () => {
    setExporting(true);
    try {
      const data = parseTableData(result);
      
      if (!data || data.length === 0) {
        setError("No data available to export");
        setExporting(false);
        return;
      }
      
      // Create a worksheet
      const ws = XLSX.utils.aoa_to_sheet(data);
      
      // Create workbook and add the worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Quantities");
      
      // Generate Excel file and save
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const fileBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create filename from original image name or default
      const exportFileName = fileName 
        ? `${fileName.split('.')[0]}_quantities.xlsx` 
        : 'drawing_quantities.xlsx';
        
      saveAs(fileBlob, exportFileName);
      
    } catch (err) {
      console.error("Export failed:", err);
      setError("Failed to export data to Excel. Please try again.");
    }
    setExporting(false);
  };

  // Function to generate BOQ from take-off data
  const generateBOQ = async () => {
    if (!result) {
      setError("Please analyze a drawing first to get take-off data");
      return;
    }

    setGeneratingBOQ(true);
    setError("");
    
    try {
      const response = await axios.post("http://localhost:8001/generate-boq/", {
        takeoff_data: result,
        project_name: projectInfo.projectName,
        location: projectInfo.location,
        client: projectInfo.client
      });
      
      setBoqResult(response.data.result);
      setActiveTab("boq");
    } catch (error) {
      console.error("BOQ generation failed:", error);
      setError("Failed to generate the BOQ. Please try again.");
    }
    
    setGeneratingBOQ(false);
  };

  // Function to export BOQ to Excel
  const exportBOQToExcel = () => {
    setExporting(true);
    try {
      // Parse the BOQ data with special handling for pipe-separated format
      const data = parseTableData(boqResult);
      
      if (!data || data.length === 0) {
        setError("No BOQ data available to export");
        setExporting(false);
        return;
      }
      
      // Create a worksheet with proper column widths
      const ws = XLSX.utils.aoa_to_sheet(data);
      
      // Set column widths for better readability
      const columnWidths = [
        { wch: 12 },  // Item Code
        { wch: 40 },  // Description
        { wch: 8 },   // Unit
        { wch: 12 },  // Quantity
        { wch: 15 },  // Rate
        { wch: 18 }   // Amount
      ];
      
      // Apply column widths (if worksheet has columns property)
      ws['!cols'] = columnWidths;
      
      // Create workbook and add the worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bill of Quantities");
      
      // Add project info in a separate sheet
      const infoData = [
        ["Project Information"],
        ["Project Name", projectInfo.projectName || "Not specified"],
        ["Location", projectInfo.location || "Not specified"],
        ["Client", projectInfo.client || "Not specified"],
        ["Date Generated", new Date().toLocaleDateString()],
        ["Currency", "Sri Lankan Rupees (LKR)"]
      ];
      
      const infoWs = XLSX.utils.aoa_to_sheet(infoData);
      // Set column width for project info sheet
      infoWs['!cols'] = [{ wch: 20 }, { wch: 40 }];
      
      XLSX.utils.book_append_sheet(wb, infoWs, "Project Info");
      
      // Generate Excel file and save
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const fileBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create filename from original image name or default
      const exportFileName = fileName 
        ? `${fileName.split('.')[0]}_BOQ.xlsx` 
        : 'Sri_Lankan_Construction_BOQ.xlsx';
        
      saveAs(fileBlob, exportFileName);
      
    } catch (err) {
      console.error("BOQ export failed:", err);
      setError("Failed to export BOQ to Excel. Please try again.");
    }
    setExporting(false);
  };

  const handleSidebarCollapse = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Staff Sidebar */}
      <StaffSidebar onCollapseChange={handleSidebarCollapse} />
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 overflow-auto ${sidebarCollapsed ? 'ml-20' : 'ml-64'} p-4`}>
        <div className="qs-container max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-xl my-8">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-blue-800 mb-2 flex items-center justify-center">
              <svg className="w-8 h-8 mr-3 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              QsTools – Sri Lankan Construction Estimator
            </h1>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Generate accurate quantity take-offs and Bills of Quantities from engineering drawings with Sri Lankan construction standards
            </p>
          </div>
          
          {/* Currency Note */}
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-l-4 border-amber-500 p-3 mb-6 rounded-r-lg shadow-sm">
            <p className="text-sm text-amber-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Note:</span> All cost estimates are provided in Sri Lankan Rupees (LKR) based on local market rates.
            </p>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`py-3 px-5 font-medium flex items-center rounded-t-lg transition-all ${
                activeTab === "takeoff" 
                  ? "text-blue-600 border-b-2 border-blue-600 bg-gradient-to-b from-blue-50 to-white" 
                  : "text-gray-600 hover:text-blue-500 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("takeoff")}
            >
              <svg className={`w-5 h-5 mr-2 ${activeTab === "takeoff" ? "text-blue-600" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Take-off Analysis
            </button>
            <button
              className={`py-3 px-5 font-medium flex items-center rounded-t-lg transition-all ${
                activeTab === "boq" 
                  ? "text-blue-600 border-b-2 border-blue-600 bg-gradient-to-b from-blue-50 to-white" 
                  : "text-gray-600 hover:text-blue-500 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("boq")}
              disabled={!boqResult}
            >
              <svg className={`w-5 h-5 mr-2 ${activeTab === "boq" ? "text-blue-600" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Bill of Quantities
              {!boqResult && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">
                  Not Generated
                </span>
              )}
            </button>
          </div>
          
          {activeTab === "takeoff" ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Upload Section - Redesigned with card-based layout */}
                <div className="upload-section bg-gradient-to-br from-white to-blue-50 p-6 rounded-xl shadow-md border border-gray-100">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                    </svg>
                    Upload Drawing
                  </h2>
                  
                  {/* File Input Area - Improved with better visual feedback */}
                  <div className="file-input-area mb-5">
                    <div 
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all hover:shadow-md ${
                        file ? 'border-green-500 bg-green-50' : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        className="hidden" 
                        ref={fileInputRef}
                      />
                      
                      {previewUrl ? (
                        <div className="preview-container">
                          <img 
                            src={previewUrl} 
                            alt="Drawing preview" 
                            className="max-h-52 mx-auto mb-3 rounded-md shadow-sm object-contain" 
                          />
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-sm font-medium text-gray-700 truncate">{fileName}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="upload-prompt">
                          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <p className="text-gray-700 font-medium mb-1">Drag and drop your engineering drawing</p>
                          <p className="text-sm text-gray-500">or click to browse files (JPG, PNG, PDF)</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Error message with improved styling */}
                  {error && (
                    <div className="error-message bg-red-50 text-red-700 p-4 rounded-lg mb-4 flex items-start">
                      <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}
                  
                  {/* Action Buttons - Redesigned with better visual hierarchy */}
                  <div className="flex space-x-3">
                    <button 
                      onClick={handleUpload} 
                      disabled={loading || !file} 
                      className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center ${
                        loading || !file 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow'
                      }`}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                          Analyze Drawing
                        </>
                      )}
                    </button>
                    
                    {file && (
                      <button 
                        onClick={clearFile}
                        className="py-3 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Results Section - Redesigned with card-based layout */}
                <div className="results-section bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-md border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2z" />
                      </svg>
                      Take-off Results
                    </h2>
                    
                    <div className="flex space-x-2">
                      {result && (
                        <>
                          <button 
                            onClick={exportToExcel}
                            disabled={exporting || !result}
                            className={`py-2 px-3 rounded-lg text-sm font-medium flex items-center ${
                              exporting || !result
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm hover:shadow'
                            }`}
                            title="Export take-off data to Excel"
                          >
                            {exporting ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Exporting...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Excel
                              </>
                            )}
                          </button>
                          
                          <button 
                            onClick={() => setActiveTab("boq")}
                            className="py-2 px-3 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center shadow-sm hover:shadow"
                            title="Create Bill of Quantities"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Create BOQ
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {result ? (
                    <div className="result-content bg-white p-4 rounded-lg border border-gray-200 shadow-sm max-h-[28rem] overflow-y-auto">
                      {formatTableDisplay(result)}
                    </div>
                  ) : (
                    <div className="empty-state text-center py-14 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 font-medium">Upload and analyze a drawing to see results</p>
                      <p className="text-sm text-gray-500 mt-1">Supports floor plans, elevations, and section drawings</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Instructions - Redesigned with better visuals */}
              <div className="instructions mt-8 bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
                <h3 className="text-lg font-medium text-blue-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  How to Use
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                      <span className="text-blue-700 font-bold text-lg">1</span>
                    </div>
                    <h4 className="font-medium text-gray-800 mb-1">Upload Drawing</h4>
                    <p className="text-sm text-gray-600">Upload an engineering drawing or blueprint in JPG, PNG or PDF format</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                      <span className="text-blue-700 font-bold text-lg">2</span>
                    </div>
                    <h4 className="font-medium text-gray-800 mb-1">Analyze</h4>
                    <p className="text-sm text-gray-600">Click "Analyze Drawing" to process the image and generate take-off data</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                      <span className="text-blue-700 font-bold text-lg">3</span>
                    </div>
                    <h4 className="font-medium text-gray-800 mb-1">Review Results</h4>
                    <p className="text-sm text-gray-600">Review the generated quantity take-off table with measurements</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                      <span className="text-blue-700 font-bold text-lg">4</span>
                    </div>
                    <h4 className="font-medium text-gray-800 mb-1">Export or Create BOQ</h4>
                    <p className="text-sm text-gray-600">Export to Excel or create a Bill of Quantities with cost estimates in LKR</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* BOQ Section */}
              <div className="grid grid-cols-1 gap-6">
                {/* Project Info Form */}
                <div className="project-info-section bg-gradient-to-br from-white to-blue-50 p-6 rounded-xl shadow-md border border-gray-100">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Project Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Project Name
                      </label>
                      <input
                        type="text"
                        value={projectInfo.projectName}
                        onChange={(e) => setProjectInfo({...projectInfo, projectName: e.target.value})}
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:bg-blue-50 focus:bg-white"
                        placeholder="Enter project name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Location
                      </label>
                      <input
                        type="text"
                        value={projectInfo.location}
                        onChange={(e) => setProjectInfo({...projectInfo, location: e.target.value})}
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:bg-blue-50 focus:bg-white"
                        placeholder="Enter location in Sri Lanka"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Client
                      </label>
                      <input
                        type="text"
                        value={projectInfo.client}
                        onChange={(e) => setProjectInfo({...projectInfo, client: e.target.value})}
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:bg-blue-50 focus:bg-white"
                        placeholder="Enter client name"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      onClick={() => setActiveTab("takeoff")}
                      className="py-2.5 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors flex items-center shadow-sm hover:shadow"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to Take-off
                    </button>
                    
                    <button
                      onClick={generateBOQ}
                      disabled={generatingBOQ || !result}
                      className={`py-2.5 px-6 rounded-lg font-medium flex items-center ${
                        generatingBOQ || !result
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow'
                      }`}
                    >
                      {generatingBOQ ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating BOQ...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          Generate BOQ
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* BOQ Results */}
                <div className="boq-results-section bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-md border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Bill of Quantities (BOQ)
                    </h2>
                    
                    {boqResult && (
                      <button 
                        onClick={exportBOQToExcel}
                        disabled={exporting || !boqResult}
                        className={`py-2.5 px-4 rounded-lg text-sm font-medium flex items-center ${
                          exporting || !boqResult
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transition-all shadow-sm hover:shadow'
                        }`}
                      >
                        {exporting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Exporting...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export BOQ to Excel
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  
                  {boqResult ? (
                    <div className="boq-content bg-white p-4 rounded-lg border border-gray-200 shadow-sm max-h-[32rem] overflow-y-auto">
                      {formatTableDisplay(boqResult)}
                    </div>
                  ) : (
                    <div className="empty-state text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-700 font-medium mb-1">Fill in the project information above</p>
                      <p className="text-sm text-gray-500">Then click "Generate BOQ" to create a Bill of Quantities with Sri Lankan cost estimates</p>
                    </div>
                  )}
                </div>
                
                {/* Added BOQ Information Section */}
                {boqResult && (
                  <div className="boq-info bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
                    <h3 className="text-lg font-medium text-blue-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      BOQ Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                        <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Standards Used
                        </h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• SLS (Sri Lanka Standards) for material specifications</li>
                          <li>• ICTAD (Institute for Construction Training And Development) rates</li>
                          <li>• BSR (Building Schedule of Rates) for Sri Lankan construction</li>
                        </ul>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                        <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Currency Information
                        </h4>
                        <p className="text-sm text-gray-600">All rates and amounts are provided in <span className="font-medium">Sri Lankan Rupees (LKR)</span>, based on current market rates in Sri Lanka's construction sector.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QsTools;
