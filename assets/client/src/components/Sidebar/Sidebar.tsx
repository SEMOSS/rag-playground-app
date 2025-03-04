import React, { useState, useEffect, useRef } from 'react';
import { useInsight } from '@semoss/sdk-react';

// Types
interface Model {
  database_name?: string;
  database_id: string;
}

interface GetInputPropsOptionsRef {
  ref?: React.RefObject<HTMLInputElement>;
}

interface SidebarProps {
  modelOptions: Model[];
  selectedModel: Model;
  setSelectedModel: (model: Model) => void;
  vectorOptions: Model[];
  selectedVectorDB: Model;
  setSelectedVectorDB: (vectorDB: Model) => void;
  storageOptions: Model[];
  selectedStorage: Model;
  setSelectedStorage: (storage: Model) => void;
  setSideOpen: (open: boolean) => void;
  setOpen: (open: boolean) => void;
  limit: number;
  setLimit: (limit: number) => void;
  temperature: number;
  setTemperature: (temperature: number) => void;
  setRefresh: (refresh: boolean) => void;
  setError: (error: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  modelOptions,
  selectedModel,
  setSelectedModel,
  vectorOptions,
  selectedVectorDB,
  setSelectedVectorDB,
  storageOptions,
  selectedStorage,
  setSelectedStorage,
  setSideOpen,
  setOpen,
  limit,
  setLimit,
  temperature,
  setTemperature,
  setRefresh,
  setError,
}) => {
  const { actions } = useInsight();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newVectorName, setNewVectorName] = useState<string>('');
  const [showVectorCreation, setShowVectorCreation] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [documents, setDocuments] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch documents when vector DB changes
  useEffect(() => {
    if (selectedVectorDB && selectedVectorDB.database_id) {
      fetchDocuments();
    }
  }, [selectedVectorDB]);

  const fetchDocuments = async () => {
    if (selectedVectorDB && selectedVectorDB.database_id) {
      try {
        setLoading(true);
        const pixel = `ListDocumentsInVectorDatabase(engine="${selectedVectorDB.database_id}");`;
        const response = await actions.run(pixel);
        const documentsList = response.pixelReturn[0].output;
        
        if (Array.isArray(documentsList)) {
          setDocuments(documentsList.map(doc => doc.fileName));
        } else {
          setDocuments([]);
        }
      } catch (e) {
        setError('Failed to fetch documents from vector database');
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  };

  const deleteDocument = async (fileName: string) => {
    setIsDeleting(fileName);
    try {
      const pixel = `RemoveDocumentFromVectorDatabase(engine="${selectedVectorDB.database_id}", fileNames=["${fileName}"]);`;
      await actions.run(pixel);
      await fetchDocuments();
    } catch (e) {
      setError(`Failed to delete document: ${fileName}`);
      console.error(e);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 100 * 1024 * 1024) {
        setFileError('File size exceeds 100MB limit');
        return;
      }
      
      const fileType = selectedFile.type;
      if (fileType !== 'application/pdf' && fileType !== 'text/csv') {
        setFileError('Only PDF and CSV files are supported');
        return;
      }
      
      setFile(selectedFile);
      setFileError(null);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.size > 100 * 1024 * 1024) {
        setFileError('File size exceeds 100MB limit');
        return;
      }
      
      const fileType = droppedFile.type;
      if (fileType !== 'application/pdf' && fileType !== 'text/csv') {
        setFileError('Only PDF and CSV files are supported');
        return;
      }
      
      setFile(droppedFile);
      setFileError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const createVectorDB = async () => {
    if (!newVectorName.trim()) {
      setError('Vector database name is required');
      return;
    }
    
    setLoading(true);
    try {
      const pixel = `CreateVectorDatabaseEngine(database=["${newVectorName}"], conDetails=[{"NAME":"${newVectorName}","VECTOR_TYPE":"FAISS","EMBEDDER_ENGINE_ID":"e4449559-bcff-4941-ae72-0e3f18e06660","INDEX_CLASSES":"default","CHUNKING_STRATEGY":"ALL","CONTENT_LENGTH":512,"CONTENT_OVERLAP":20,"DISTANCE_METHOD":"Squared Euclidean (L2) distance","RETAIN_EXTRACTED_TEXT":"false"}]);`;
      const response = await actions.run(pixel);
      const { output, operationType } = response.pixelReturn[0];
      
      if (operationType.indexOf('ERROR') > -1) {
        throw new Error(output as string);
      }
      
      // Update vector options after creation
      setRefresh(true);
      setShowVectorCreation(false);
      setNewVectorName('');
      
      // Find and select the new vector DB
      const newVectorDB = { 
        database_id: (output as string),
        database_name: newVectorName
      };

      setSelectedVectorDB(newVectorDB);
      
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create vector database');
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!selectedVectorDB || !selectedVectorDB.database_id) {
      setError('Please select a vector database first');
      return;
    }
    
    setLoading(true);
    try {
      const fileUpload = await actions.upload(file, '');
      const { fileLocation } = fileUpload[0];
      const pixel = `CreateEmbeddingsFromDocuments(engine="${selectedVectorDB.database_id}", filePaths=["${fileLocation.slice(1)}"]);`;
      
      const response = await actions.run(pixel);
      const { output, operationType } = response.pixelReturn[0];
      
      if (operationType.indexOf('ERROR') > -1) {
        throw new Error(output as string);
      }
      
      await fetchDocuments();
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    if (expanded === section) {
      setExpanded(null);
    } else {
      setExpanded(section);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Settings</h3>
        <button className="close-button" onClick={() => setSideOpen(false)}>
          &times;
        </button>
      </div>
      
      <div className="sidebar-section">
        <div 
          className="section-header" 
          onClick={() => toggleSection('model')}
        >
          <h4>Model Selection</h4>
          <span className={`arrow ${expanded === 'model' ? 'down' : 'right'}`}>▶</span>
        </div>
        
        {expanded === 'model' && (
          <div className="section-content">
            <div className="select-container">
              <label htmlFor="model-select">Model</label>
              <select 
                id="model-select"
                value={selectedModel?.database_id || ''}
                onChange={(e) => {
                  const selected = modelOptions.find(model => model.database_id === e.target.value);
                  if (selected) setSelectedModel(selected);
                }}
              >
                <option value="" disabled>Select model</option>
                {modelOptions.map(model => (
                  <option key={model.database_id} value={model.database_id}>
                    {model.database_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
      
      <div className="sidebar-section">
        <div 
          className="section-header" 
          onClick={() => toggleSection('vector')}
        >
          <h4>Chat Knowledge</h4>
          <span className={`arrow ${expanded === 'vector' ? 'down' : 'right'}`}>▶</span>
        </div>
        
        {expanded === 'vector' && (
          <div className="section-content">
            <div className="select-container">
              <label htmlFor="vector-select">Vector Database</label>
              <select 
                id="vector-select"
                value={selectedVectorDB?.database_id || ''}
                onChange={(e) => {
                  if (e.target.value === 'new') {
                    setShowVectorCreation(true);
                  } else {
                    const selected = vectorOptions.find(vector => vector.database_id === e.target.value);
                    if (selected) setSelectedVectorDB(selected);
                  }
                }}
              >
                <option value="" disabled>Select vector database</option>
                {vectorOptions.map(vector => (
                  <option key={vector.database_id} value={vector.database_id}>
                    {vector.database_name}
                  </option>
                ))}
                <option value="new">+ Create new</option>
              </select>
            </div>
            
            {showVectorCreation && (
              <div className="create-vector-form">
                <input
                  type="text"
                  placeholder="New vector database name"
                  value={newVectorName}
                  onChange={(e) => setNewVectorName(e.target.value)}
                />
                <div className="button-group">
                  <button 
                    className="cancel-button"
                    onClick={() => setShowVectorCreation(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="create-button"
                    onClick={createVectorDB}
                    disabled={loading || !newVectorName.trim()}
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            )}
            
            {selectedVectorDB?.database_id && (
              <div className="document-management">
                <h5>Upload Document</h5>
                <div 
                  className="dropzone"
                  onDrop={handleFileDrop}
                  onDragOver={handleDragOver}
                >
                  <p>Drag & drop file here or</p>
                  <input
                    type="file"
                    id="file-input"
                    ref={fileInputRef}
                    accept=".pdf,.csv"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <button 
                    className="upload-button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select File
                  </button>
                </div>
                
                {file && (
                  <div className="selected-file">
                    <p>{file.name}</p>
                    <div className="button-group">
                      <button 
                        className="cancel-button"
                        onClick={() => setFile(null)}
                      >
                        Cancel
                      </button>
                      <button 
                        className="upload-button"
                        onClick={uploadDocument}
                        disabled={loading}
                      >
                        {loading ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  </div>
                )}
                
                {fileError && (
                  <p className="error-message">{fileError}</p>
                )}
                
                <h5>Documents</h5>
                {loading ? (
                  <p>Loading documents...</p>
                ) : documents.length === 0 ? (
                  <p>No documents found</p>
                ) : (
                  <ul className="document-list">
                    {documents.map(doc => (
                      <li key={doc} className="document-item">
                        <span className="document-name">{doc}</span>
                        <button 
                          className="delete-button"
                          onClick={() => deleteDocument(doc)}
                          disabled={isDeleting === doc}
                        >
                          {isDeleting === doc ? '...' : '🗑️'}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="sidebar-section">
        <div 
          className="section-header" 
          onClick={() => toggleSection('storage')}
        >
          <h4>Storage</h4>
          <span className={`arrow ${expanded === 'storage' ? 'down' : 'right'}`}>▶</span>
        </div>
        
        {expanded === 'storage' && (
          <div className="section-content">
            <div className="select-container">
              <label htmlFor="storage-select">Storage</label>
              <select 
                id="storage-select"
                value={selectedStorage?.database_id || ''}
                onChange={(e) => {
                  const selected = storageOptions.find(storage => storage.database_id === e.target.value);
                  if (selected) setSelectedStorage(selected);
                }}
              >
                <option value="" disabled>Select storage</option>
                {storageOptions.map(storage => (
                  <option key={storage.database_id} value={storage.database_id}>
                    {storage.database_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
      
      <div className="sidebar-section">
        <div 
          className="section-header" 
          onClick={() => toggleSection('settings')}
        >
          <h4>Query Settings</h4>
          <span className={`arrow ${expanded === 'settings' ? 'down' : 'right'}`}>▶</span>
        </div>
        
        {expanded === 'settings' && (
          <div className="section-content">
            <div className="slider-container">
              <label htmlFor="limit-slider">
                Number of Results Queried: {limit}
                <div className="tooltip">
                  <span className="tooltip-icon">?</span>
                  <span className="tooltip-text">
                    This will change the amount of documents pulled from a vector database. 
                    Pulling too many documents can potentially cause your engines token limit to be exceeded!
                  </span>
                </div>
              </label>
              <input
                type="range"
                id="limit-slider"
                min={1}
                max={10}
                step={1}
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
              />
              <div className="slider-markers">
                {[...Array(10)].map((_, i) => (
                  <span key={i} className="marker">{i + 1}</span>
                ))}
              </div>
            </div>
            
            <div className="slider-container">
              <label htmlFor="temperature-slider">
                Temperature: {temperature.toFixed(1)}
                <div className="tooltip">
                  <span className="tooltip-icon">?</span>
                  <span className="tooltip-text">
                    This changes the randomness of the LLM's output. 
                    The higher the temperature the more creative and imaginative your answer will be.
                  </span>
                </div>
              </label>
              <input
                type="range"
                id="temperature-slider"
                min={0}
                max={1}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
              />
              <div className="slider-markers">
                {[...Array(11)].map((_, i) => (
                  <span key={i} className="marker">{(i / 10).toFixed(1)}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        .sidebar {
          display: flex;
          flex-direction: column;
          width: 280px;
          background-color: #ffffff;
          box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
          padding: 16px;
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 10;
          overflow-y: auto;
        }
        
        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid #e0e0e0;
          margin-bottom: 16px;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }
        
        .sidebar-section {
          margin-bottom: 16px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background-color: #f5f5f5;
          cursor: pointer;
        }
        
        .section-header h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
        }
        
        .arrow {
          font-size: 12px;
          transition: transform 0.3s;
        }
        
        .arrow.down {
          transform: rotate(90deg);
        }
        
        .section-content {
          padding: 16px;
          background-color: #fff;
        }
        
        .select-container {
          margin-bottom: 12px;
        }
        
        .select-container label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          color: #666;
        }
        
        select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
          background-color: #fff;
        }
        
        .create-vector-form {
          margin-top: 12px;
          padding: 12px;
          background-color: #f9f9f9;
          border-radius: 4px;
        }
        
        .create-vector-form input {
          width: 100%;
          padding: 8px 12px;
          margin-bottom: 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .button-group {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
        
        button {
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          border: none;
        }
        
        .cancel-button {
          background-color: #f5f5f5;
          color: #666;
        }
        
        .create-button, .upload-button {
          background-color: #1976d2;
          color: white;
        }
        
        .create-button:disabled, .upload-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .dropzone {
          border: 2px dashed #ccc;
          border-radius: 4px;
          padding: 24px;
          text-align: center;
          margin-bottom: 16px;
          cursor: pointer;
        }
        
        .dropzone p {
          margin: 0 0 12px;
          color: #666;
        }
        
        .selected-file {
          margin-bottom: 16px;
          padding: 12px;
          background-color: #f5f5f5;
          border-radius: 4px;
        }
        
        .selected-file p {
          margin: 0 0 8px;
          font-size: 14px;
          word-break: break-word;
        }
        
        .error-message {
          color: #d32f2f;
          font-size: 14px;
          margin: 8px 0;
        }
        
        .document-list {
          list-style: none;
          padding: 0;
          margin: 0;
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
        }
        
        .document-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .document-item:last-child {
          border-bottom: none;
        }
        
        .document-name {
          font-size: 14px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 80%;
        }
        
        .delete-button {
          background: none;
          border: none;
          color: #d32f2f;
          cursor: pointer;
          padding: 4px;
        }
        
        .delete-button:disabled {
          color: #cccccc;
          cursor: not-allowed;
        }
        
        .slider-container {
          margin-bottom: 20px;
        }
        
        .slider-container label {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          font-size: 14px;
          color: #666;
        }
        
        input[type="range"] {
          width: 100%;
          margin-bottom: 4px;
        }
        
        .slider-markers {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #999;
          padding: 0 2px;
        }
        
        .tooltip {
          position: relative;
          display: inline-block;
          margin-left: 6px;
        }
        
        .tooltip-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: #ccc;
          color: #fff;
          font-size: 12px;
          cursor: help;
        }
        
        .tooltip-text {
          visibility: hidden;
          width: 200px;
          background-color: #333;
          color: #fff;
          text-align: center;
          border-radius: 4px;
          padding: 8px;
          position: absolute;
          z-index: 1;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
          transition: opacity 0.3s;
          font-size: 12px;
          line-height: 1.4;
        }
        
        .tooltip:hover .tooltip-text {
          visibility: visible;
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;