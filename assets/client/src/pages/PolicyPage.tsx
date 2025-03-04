import { useEffect, useState, useRef } from 'react';
import { useInsight } from '@semoss/sdk-react';
import { Sidebar } from '../components/Sidebar';
import { Markdown } from '@/components/common';

// Types
export interface Model {
  database_name?: string;
  database_id: string;
}

export interface VectorContext {
  score: string;
  doc_index: string;
  tokens: string;
  content: string;
  url: string;
}

export const PolicyPage = () => {
  const { actions } = useInsight();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [urls, setUrls] = useState<{ ID: number; link: string }[]>([]);

  const [answer, setAnswer] = useState({
    question: '',
    conclusion: '',
  });

  const [modelOptions, setModelOptions] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model>({} as Model);
  const [vectorOptions, setVectorOptions] = useState<Model[]>([]);
  const [selectedVectorDB, setSelectedVectorDB] = useState<Model>({} as Model);
  const [storageOptions, setStorageOptions] = useState<Model[]>([]);
  const [selectedStorage, setSelectedStorage] = useState<Model>({} as Model);

  const [refresh, setRefresh] = useState<boolean>(false);
  const [sideOpen, setSideOpen] = useState<boolean>(true);
  
  const [limit, setLimit] = useState<number>(3);
  const [temperature, setTemperature] = useState<number>(0);

  // Chat functionality states
  const [messages, setMessages] = useState<{ type: string; content: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Example questions
  const exampleQuestions = [
    "What are our policies on remote work?",
    "How do I submit a PTO request?",
    "What's the timeline for performance reviews?",
  ];

  const ask = async (questionText: string) => {
    try {
      setError('');
      setIsLoading(true);

      if (!questionText) {
        throw new Error('Question is required');
      }

      // Add user message to chat
      setMessages(prev => [...prev, { type: 'user', content: questionText }]);
      
      // Add loading message from assistant
      setMessages(prev => [...prev, { type: 'assistant', content: '...' }]);

      let pixel = `VectorDatabaseQuery(engine="${selectedVectorDB.database_id}", command="${questionText}", limit=${limit})`;
      const response = await actions.run(pixel);
      const { output, operationType } = response.pixelReturn[0];
      
      if (operationType.indexOf('ERROR') > -1) {
        throw new Error(typeof output === 'object' && output !== null && 'response' in output 
          ? String(output.response) 
          : 'Unknown error');
      }
      
      const outputArray = Array.isArray(output) ? output : [];
      
      let context_docs = [];
      let temp_urls = [];
 
      for (let i = 0; i < outputArray.length - 1; i++) {
        if (outputArray[i]) {
          const content = typeof outputArray[i] === 'object' && outputArray[i] !== null
            ? (outputArray[i].content || outputArray[i].Content)
            : '';
            
          const source = typeof outputArray[i] === 'object' && outputArray[i] !== null 
            ? outputArray[i].Source 
            : '';
            
          if (content) {
            context_docs.push({ role: 'system', content: `${content}` });
          }
          
          if (source) {
            temp_urls.push(source);
          }
        }
      }

      setUrls(temp_urls.map((url, i) => ({ ID: i, link: url })));
      
      // Convert context docs to string representation for pixel command
      const contextDocsString = context_docs.length > 0 
        ? JSON.stringify(context_docs).slice(1, -1) 
        : '';
      
      pixel = `LLM(engine="${selectedModel.database_id}", command="${questionText}", paramValues=[{"full_prompt":[{"role": "system", "content": "You are an intelligent AI designed to answer queries based on policy documents. ${questionText}."}, ${contextDocsString}]}, {"temperature":${temperature}}])`;
      
      const LLMresponse = await actions.run(pixel);
      const { output: LLMOutput, operationType: LLMOperationType } = LLMresponse.pixelReturn[0];
      
      if (LLMOperationType.indexOf('ERROR') > -1) {
        throw new Error(typeof LLMOutput === 'object' && LLMOutput !== null && 'response' in LLMOutput
          ? String(LLMOutput.response)
          : 'Unknown error in LLM response');
      }
      
      let conclusion = '';
      if (typeof LLMOutput === 'object' && LLMOutput !== null && 'response' in LLMOutput) {
        conclusion = String(LLMOutput.response);
      }
      
      setMessages(prev => [
        ...prev.slice(0, -1),
        { type: 'assistant', content: conclusion }
      ]);

      setAnswer({ question: questionText, conclusion: conclusion });
      setIsAnswered(true);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'There is an error, please check pixel calls';
      setError(errorMessage);
      
      setMessages(prev => [
        ...prev.slice(0, -1),
        { type: 'assistant', content: `Error: ${errorMessage}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;
    
    const question = inputValue.trim();
    setInputValue('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    ask(question);
  };

  const handleExampleClick = (question: string) => {
    if (isLoading) return;
    setInputValue(question);
    ask(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setIsLoading(true);
    
    let pixel = `MyEngines(engineTypes=["MODEL"]);`;

    actions.run(pixel).then((response) => {
        const { output, operationType } = response.pixelReturn[0];

        if (operationType.indexOf("ERROR") > -1) {
            throw new Error(output as string);
        }

        if (Array.isArray(output)) {
            setModelOptions(output);
            setSelectedModel(output[2]);
        }
    });

    // Grab all Vector DBs
    pixel = `MyEngines(engineTypes=["VECTOR"]);`;

    actions.run(pixel).then((response) => {
        const { output, operationType } = response.pixelReturn[0];

        if (operationType.indexOf("ERROR") > -1) {
            throw new Error(output as string);
        }

        if (Array.isArray(output)) {
            setVectorOptions(output);
            setSelectedVectorDB(output[10]);
        }
    });

    pixel = `MyEngines(engineTypes=["STORAGE"]);`;

    actions.run(pixel).then((response) => {
        const { output, operationType } = response.pixelReturn[0];

        if (operationType.indexOf("ERROR") > -1) {
            throw new Error(output as string);
        }

        if (Array.isArray(output)) {
            setStorageOptions(output);
            setSelectedStorage(output[1]);
        }
    });
    
    setIsLoading(false);
  }, []);
        
  useEffect(() => {
    const pixel = `MyEngines(engineTypes=["VECTOR"]);`;

    actions.run(pixel).then((response) => {
        const { output, operationType } = response.pixelReturn[0];

        if (operationType.indexOf('ERROR') > -1) {
            throw new Error(output as string);
        }

        if (Array.isArray(output)) {
            setVectorOptions(output);
            setSelectedVectorDB(output[10]);
            setRefresh(false);
        }
    });
  }, [refresh]);

  return (
    <div className="policy-page">
      {sideOpen && (
        <Sidebar
          modelOptions={modelOptions}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          vectorOptions={vectorOptions}
          selectedVectorDB={selectedVectorDB}
          setSelectedVectorDB={setSelectedVectorDB}
          storageOptions={storageOptions}
          selectedStorage={selectedStorage}
          setSelectedStorage={setSelectedStorage}
          setSideOpen={setSideOpen}
          setOpen={() => {}} // This prop is no longer needed but kept for compatibility
          limit={limit}
          setLimit={setLimit}
          temperature={temperature}
          setTemperature={setTemperature}
          setRefresh={setRefresh}
          setError={setError}
        />
      )}

      <div className={`main-content ${sideOpen ? 'with-sidebar' : ''}`}>
        {!sideOpen && (
          <button className="open-sidebar-button" onClick={() => setSideOpen(true)}>
            ▶
          </button>
        )}

        <div className="chat-container">
          <div className="chat-header">
            <h2>RAG Policy Bot</h2>
            <p>Assists users in answering complex policy, operational procedure, and system questions.</p>
            
            {error && (
              <div className="error-alert">
                {error}
              </div>
            )}
          </div>

          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="example-grid">
                {exampleQuestions.map((question, idx) => (
                  <button 
                    key={idx}
                    className="example-button"
                    onClick={() => handleExampleClick(question)}
                    disabled={isLoading}
                  >
                    {question}
                  </button>
                ))}
              </div>
            ) : (
              messages.map((message, idx) => (
                <div 
                  key={idx} 
                  className={`message-row ${message.type === 'user' ? 'user-message' : 'assistant-message'}`}
                >
                  <div className="message-content">
                    {message.content === '...' ? (
                      <div className="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    ) : (
                      <Markdown>{message.content}</Markdown>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef}></div>
          </div>

          <div className="input-container">
            <div className="input-wrapper">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                onInput={handleTextareaInput}
                placeholder="Type your question here..."
                rows={1}
                disabled={isLoading}
              />
              <button
                className="send-button"
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
              >
                {isLoading ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>
        
        {isLoading && (
          <div className="progress-bar">
            <div className="progress-bar-inner"></div>
          </div>
        )}
      </div>

      <style>{`
        .policy-page {
          display: flex;
          height: 100vh;
          background-color: #f5f5f5;
        }
        
        .main-content {
          flex: 1;
          padding: 20px;
          transition: margin 0.3s ease;
          position: relative;
        }
        
        .main-content.with-sidebar {
          margin-left: 280px;
        }
        
        .open-sidebar-button {
          position: fixed;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          background-color: #f5f5f5;
          border: 1px solid #ccc;
          border-left: none;
          padding: 20px 8px;
          border-radius: 0 4px 4px 0;
          cursor: pointer;
          z-index: 5;
        }
        
        .chat-container {
          max-width: 1000px;
          margin: 0 auto;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          height: calc(100vh - 40px);
          overflow: hidden;
        }
        
        .chat-header {
          padding: 24px;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .chat-header h2 {
          margin: 0 0 8px;
          font-size: 24px;
          font-weight: 500;
        }
        
        .chat-header p {
          margin: 0;
          color: #666;
        }
        
        .error-alert {
          margin-top: 16px;
          padding: 12px 16px;
          background-color: #ffebee;
          border-left: 4px solid #f44336;
          color: #d32f2f;
          border-radius: 4px;
        }
        
        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .messages-container::-webkit-scrollbar {
          width: 6px;
        }
        
        .messages-container::-webkit-scrollbar-thumb {
          background-color: #bbb;
          border-radius: 3px;
        }
        
        .example-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
          padding: 16px;
        }
        
        .example-button {
          padding: 16px;
          text-align: left;
          justify-content: flex-start;
          height: 100%;
          border-radius: 8px;
          background-color: #f5f5f5;
          color: #333;
          border: none;
          cursor: pointer;
          font-size: 14px;
        }
        
        .example-button:hover {
          background-color: #e0e0e0;
        }
        
        .message-row {
          display: flex;
          justify-content: flex-start;
          width: 100%;
        }
        
        .message-row.user-message {
          justify-content: flex-end;
        }
        
        .message-content {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 12px;
          background-color: #f5f5f5;
          color: #333;
          word-break: break-word;
        }
        
        .user-message .message-content {
          background-color: #1976d2;
          color: white;
        }
        
        .loading-dots {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .loading-dots span {
          display: inline-block;
          width: 6px;
          height: 6px;
          background-color: #666;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        
        .loading-dots span:nth-child(1) {
          animation-delay: -0.32s;
        }
        
        .loading-dots span:nth-child(2) {
          animation-delay: -0.16s;
        }
        
        @keyframes bounce {
          0%, 80%, 100% { 
            transform: scale(0);
          }
          40% { 
            transform: scale(1.0);
          }
        }
        
        .input-container {
          padding: 16px;
          border-top: 1px solid #e0e0e0;
        }
        
        .input-wrapper {
          display: flex;
          align-items: flex-end;
          width: 100%;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
          background-color: #fff;
        }
        
        textarea {
          flex: 1;
          border: none;
          resize: none;
          padding: 12px 16px;
          outline: none;
          font-family: inherit;
          font-size: 16px;
          min-height: 48px;
          max-height: 150px;
        }
        
        .send-button {
          min-width: 48px;
          height: 48px;
          border-radius: 0;
          padding: 0;
          border: none;
          background-color: #1976d2;
          color: white;
          font-weight: 500;
          cursor: pointer;
        }
        
        .send-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .progress-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background-color: #e0e0e0;
          z-index: 100;
        }
        
        .progress-bar-inner {
          height: 100%;
          background-color: #1976d2;
          width: 100%;
          animation: progressAnimation 2s infinite linear;
        }
        
        @keyframes progressAnimation {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};