import { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { useInsight } from '@semoss/sdk-react';
import { Sidebar } from '../components/Sidebar';
import { Markdown } from '@/components/common';
import { FiSend, FiPaperclip, FiX } from 'react-icons/fi';
import { IoIosOptions } from "react-icons/io";
import ReactMarkdown from 'react-markdown';

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
  const [sideOpen, setSideOpen] = useState<boolean>(false);
  
  const [limit, setLimit] = useState<number>(3);
  const [temperature, setTemperature] = useState<number>(0);

  // Chat functionality states
  const [messages, setMessages] = useState<{ type: string; content: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  // Example questions -> Todo: Remove?
  // const exampleQuestions = [
  //   "What are our policies on remote work?",
  //   "How do I submit a PTO request?",
  //   "What's the timeline for performance reviews?",
  // ];

  // Function to upload attached file to vector database
  const uploadAttachedFile = async () => {
    if (!attachedFile) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!selectedVectorDB || !selectedVectorDB.database_id) {
      setError('Please select a vector database first');
      return;
    }
    
    setIsLoading(true);
    try {
      // Add a message to indicate upload is in progress
      setMessages(prev => [...prev, { 
        type: 'user', 
        content: `Uploading file: ${attachedFile.name}` 
      }]);
      
      // Add loading message from assistant
      setMessages(prev => [...prev, { 
        type: 'assistant', 
        content: '...' 
      }]);
      
      // Upload the file
      const fileUpload = await actions.upload(attachedFile, '');
      const { fileLocation } = fileUpload[0];
      
      // Create embeddings from the document
      const pixel = `CreateEmbeddingsFromDocuments(engine="${selectedVectorDB.database_id}", filePaths=["${fileLocation.slice(1)}"]);`;
      const response = await actions.run(pixel);
      const { output, operationType } = response.pixelReturn[0];
      
      if (operationType.indexOf('ERROR') > -1) {
        throw new Error(typeof output === 'string' ? output : 'Failed to upload document');
      }
      
      // Update the loading message with success message
      setMessages(prev => [
        ...prev.slice(0, -1),
        { 
          type: 'assistant', 
          content: `File "${attachedFile.name}" was successfully uploaded to the vector database.` 
        }
      ]);
      
      // Clear the attachment after successful upload
      removeAttachedFile();
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to upload document';
      setError(errorMessage);
      
      // Update the loading message with error message
      setMessages(prev => [
        ...prev.slice(0, -1),
        { 
          type: 'assistant', 
          content: `Error uploading file: ${errorMessage}` 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

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

      let context_docs = [];
      let temp_urls = [];
      
      // Only query vector DB if one is selected
      if (selectedVectorDB && selectedVectorDB.database_id) {
        let pixel = `VectorDatabaseQuery(engine="${selectedVectorDB.database_id}", command="${questionText}", limit=${limit})`;
        const response = await actions.run(pixel);
        const { output, operationType } = response.pixelReturn[0];
        
        if (operationType.indexOf('ERROR') > -1) {
          throw new Error(typeof output === 'object' && output !== null && 'response' in output 
            ? String(output.response) 
            : 'Unknown error');
        }
        
        const outputArray = Array.isArray(output) ? output : [];
        
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
      }

      const escapedQuestion = questionText.replace(/"/g, '\\"');

      // Convert context docs to string representation -> pixel cmd
      const contextDocsString = context_docs.length > 0 
        ? JSON.stringify(context_docs).slice(1, -1) 
        : '';
      
      // Adjust system message based on whether context is available
      const systemMessage = context_docs.length > 0
        ? "You are an intelligent AI designed to answer queries based on policy documents."
        : "You are an intelligent AI assistant. Answer the following question to the best of your ability.";
      
      const pixel = `LLM(engine="${selectedModel.database_id}", command="${escapedQuestion}", paramValues=[{"full_prompt":[{"role": "system", "content": "${systemMessage} ${escapedQuestion}."}, ${contextDocsString}]}, {"temperature":${temperature}}])`;
      
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
    // If there's an attached file, upload it to the vector DB
    if (attachedFile) {
      uploadAttachedFile();
      return;
    }
    
    // Otherwise, process the text message as usual
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
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      
      // Set max height
      const maxHeight = 150;
      const scrollHeight = textareaRef.current.scrollHeight;
      
      textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
      
      // (Content > max height) -> scrolling
      if (scrollHeight > maxHeight) {
        textareaRef.current.style.overflowY = 'auto';
      } else {
        textareaRef.current.style.overflowY = 'hidden';
      }
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
            // setSelectedVectorDB(output[10]);
            setRefresh(false);
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
            // setSelectedVectorDB(output[10]);
            setRefresh(false);
        }
    });
  }, [refresh]);

  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  };
  
  const removeAttachedFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Container>
      <ChatContainer>
        <ChatHeaderContainer>
          <Title>RAG Playground</Title>
          <HeaderControls>
            <ModelLabel>
              <ModelIcon>AI</ModelIcon>
              <span>{selectedModel?.database_name || "Model"}</span>
            </ModelLabel>
            <SettingsButton onClick={() => setSideOpen(true)}>
              <IoIosOptions size={20} />
            </SettingsButton>
          </HeaderControls>
        </ChatHeaderContainer>

        {error && (
          <ErrorAlert>
            {error}
            <CloseErrorButton onClick={() => setError('')}>
              <FiX size={16} />
            </CloseErrorButton>
          </ErrorAlert>
        )}
        
        <MessagesContainer>
          {messages.length === 0 ? (
            <>
              <EmptyChat>
                <EmptyChatTitle>Start a conversation</EmptyChatTitle>
                <EmptyChatText>
                  Use the chat settings in the upper righthand corner to tailor the conversation to fit your needs.
                </EmptyChatText>
              </EmptyChat>
              {/* <ExampleGrid>
                {exampleQuestions.map((question, idx) => (
                  <ExampleButton 
                    key={idx}
                    onClick={() => handleExampleClick(question)}
                    disabled={isLoading}
                  >
                    {question}
                  </ExampleButton>
                ))}
              </ExampleGrid> */}
            </>
          ) : (
            messages.map((message, idx) => (
              <MessageWrapper key={idx} isUser={message.type === 'user'}>
                <MessageBubble isUser={message.type === 'user'}>
                  {message.content === '...' ? (
                    <LoadingDots>
                      <Dot />
                      <Dot />
                      <Dot />
                    </LoadingDots>
                  ) : (
                    <MessageContent>
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </MessageContent>
                  )}
                </MessageBubble>
              </MessageWrapper>
            ))
          )}
          <div ref={messagesEndRef} />
        </MessagesContainer>
        
        {/* File attachments in chat */}
        {attachedFile && (
          <AttachmentContainer>
            <AttachmentPreview>
              <AttachmentIcon>📄</AttachmentIcon>
              <AttachmentName>{attachedFile.name}</AttachmentName>
            </AttachmentPreview>
            <RemoveAttachmentButton onClick={removeAttachedFile}>
              <FiX size={16} />
            </RemoveAttachmentButton>
          </AttachmentContainer>
        )}

        <InputContainer>
          <InputWrapper>
            <FileButton onClick={handleFileButtonClick}>
              <FiPaperclip size={20} />
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </FileButton>
            
            <MessageTextarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              onInput={handleTextareaInput}
              placeholder={attachedFile ? "Click send to upload file or add a message" : "Type your question here..."}
              rows={1}
              disabled={isLoading}
            />
            
            <SendButton 
              disabled={(!inputValue.trim() && !attachedFile) || isLoading}
              onClick={handleSend}
            >
              <FiSend size={20} />
            </SendButton>
          </InputWrapper>
        </InputContainer>
      </ChatContainer>
      
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
        setOpen={() => {}}
        limit={limit}
        setLimit={setLimit}
        temperature={temperature}
        setTemperature={setTemperature}
        setRefresh={setRefresh}
        setError={setError}
        isOpen={sideOpen}
      />
      
      {/* settings sidebar overlay */}
      {sideOpen && (
        <SettingsOverlay onClick={() => setSideOpen(false)} />
      )}
      
      {isLoading && <ProgressBar />}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  // background-color: #f5f5f5;
  background-color: linear-gradient(135deg, rgb(88,40,47) )%, rgb(36,42,100) 100%);
`;

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1000px;
  margin: 20px auto;
  height: calc(100vh - 40px);
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
`;

const ChatHeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
`;

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(36,42,100);
`;

const ModelLabel = styled.div`
  display: flex;
  align-items: center;
  background: rgb(36,42,100);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  margin-right: 10px;
  font-size: 1rem;
`;

const ModelIcon = styled.div`
  background: #090e3c;
  color: white;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: bold;
  margin-right: 8px;
`;

const SettingsButton = styled.button`
  background: rgb(36,42,100);
  border: none;
  width: 45px;
  height: 45px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  
  &:hover {
    background: rgb(36, 42, 100, .9);
  }
`;

const ErrorAlert = styled.div`
  margin: 15px;
  padding: 10px 15px;
  background-color: #d7a6ab;
  color: #58282F;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CloseErrorButton = styled.button`
  background: none;
  border: none;
  color: #58282F;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #ddd;
    border-radius: 3px;
  }
`;

const MessageWrapper = styled.div<{ isUser: boolean }>`
  display: flex;
  justify-content: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  align-items: flex-end;
  margin-bottom: 8px;
`;

const MessageBubble = styled.div<{ isUser: boolean }>`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: ${props => props.isUser ? '18px 18px 0 18px' : '18px 18px 18px 0'};
  background-color: ${props => props.isUser ? '#242a64' : '#f5f5f5'};
  color: ${props => props.isUser ? 'white' : 'inherit'};
  position: relative;
`;

const MessageContent = styled.div`
  line-height: 1.5;
  word-break: break-word;
  
  p {
    margin: 0;
    padding: 0;
  }
  
  p + p {
    margin-top: 0.5em;
  }
  
  code {
    font-family: monospace;
    background-color: rgba(0, 0, 0, 0.1);
    padding: 2px 4px;
    border-radius: 4px;
  }
  
  pre {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 8px;
    border-radius: 4px;
    overflow-x: auto;
  }
`;

const LoadingDots = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Dot = styled.div`
  width: 8px;
  height: 8px;
  background-color: #aaa;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
  
  &:nth-child(1) {
    animation-delay: -0.32s;
  }
  
  &:nth-child(2) {
    animation-delay: -0.16s;
  }
  
  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1.0); }
  }
`;

const InputContainer = styled.div`
  padding: 15px 20px;
  border-top: 1px solid #eee;
  background-color: white;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  background-color: #f5f5f5;
  border-radius: 24px;
  padding: 0 8px;
  transition: background-color 0.2s;
  
  &:focus-within {
    background-color: #e9e9e9;
  }
`;

const MessageTextarea = styled.textarea`
  flex: 1;
  border: none;
  background-color: transparent;
  padding: 12px 8px;
  resize: none;
  outline: none;
  font-family: inherit;
  font-size: 0.95rem;
  line-height: 1.5;
  max-height: 150px;
`;

const FileButton = styled.button`
  background: none;
  border: none;
  color: #777;
  cursor: pointer;
  padding: 12px 8px;
  display: flex;
  align-items: center;
  
  &:hover {
    color: rgb(36, 42, 100);
  }
`;

const SendButton = styled.button<{ disabled?: boolean }>`
  background: none;
  border: none;
  color: ${props => props.disabled ? '#ccc' : '#242a64'};
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  padding: 12px 8px;
  display: flex;
  align-items: center;
  
  &:hover {
    color: ${props => props.disabled ? '#ccc' : 'rgb(36, 42, 100, .7)'};
  }
`;

const AttachmentContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 8px 12px;
  margin: 0 20px;
  margin-bottom: 10px;
`;

const AttachmentPreview = styled.div`
  display: flex;
  align-items: center;
`;

const AttachmentIcon = styled.div`
  font-size: 1.2rem;
  margin-right: 10px;
`;

const AttachmentName = styled.div`
  font-size: 0.85rem;
`;

const RemoveAttachmentButton = styled.button`
  background: none;
  border: none;
  color: #58282F;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  
  &:hover {
    color: #e53935;
  }
`;

const EmptyChat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: auto 0;
  padding: 40px 20px;
  color: #666;
  text-align: center;
`;

const EmptyChatTitle = styled.h3`
  font-size: 1.2rem;
  margin: 0 0 8px 0;
`;

const EmptyChatText = styled.p`
  max-width: 400px;
  margin: 0;
  opacity: 0.7;
`;

const ExampleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  padding: 16px;
`;

const ExampleButton = styled.button<{ disabled?: boolean }>`
  padding: 16px;
  text-align: left;
  justify-content: flex-start;
  height: 100%;
  border-radius: 8px;
  background-color: #f5f5f5;
  color: #333;
  border: none;
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  font-size: 14px;
  opacity: ${props => props.disabled ? 0.7 : 1};
  
  &:hover {
    background-color: ${props => props.disabled ? '#f5f5f5' : '#e0e0e0'};
  }
`;

const SettingsOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 999;
`;

const ProgressBar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: #e0e0e0;
  overflow: hidden;
  z-index: 1001;
  
  &::after {
    content: '';
    position: absolute;
    height: 100%;
    width: 50%;
    background-color: #242a64;
    animation: progress 1.5s infinite ease-in-out;
  }
  
  @keyframes progress {
    0% {
      left: -50%;
    }
    100% {
      left: 100%;
    }
  }
`;