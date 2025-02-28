import { useEffect, useState, useRef } from 'react'; // Added useRef for chat scrolling
import {
  styled,
  Alert,
  Box,
  Button,
  Stack,
  LinearProgress,
  TextField,
  Typography,
  Paper,
  IconButton,
  Modal,
  Avatar,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useInsight } from '@semoss/sdk-react';
import {Sidebar} from '../components/Sidebar';
import {VectorModal} from '../components/VectorModal';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import {Markdown} from '@/components/common';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';

const StyledChatContainer = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
}));

const StyledMessagesContainer = styled('div')(() => ({
  flexGrow: 1,
  overflowY: 'auto',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  maxHeight: 'calc(100vh - 300px)',
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#bbb',
    borderRadius: '3px',
  },
}));

const StyledInputContainer = styled('div')(() => ({
  display: 'flex',
  padding: '16px',
  borderTop: '1px solid #e0e0e0',
}));

const StyledInputWrapper = styled('div')(() => ({
  display: 'flex',
  alignItems: 'flex-end',
  width: '100%',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: '#fff',
}));

const StyledTextarea = styled('textarea')(() => ({
  flex: 1,
  border: 'none',
  resize: 'none',
  padding: '12px 16px',
  outline: 'none',
  fontFamily: 'inherit',
  fontSize: '16px',
  minHeight: '48px',
  maxHeight: '150px',
}));

const StyledSendButton = styled(Button)(() => ({
  minWidth: '48px',
  height: '48px',
  borderRadius: '0',
  padding: '0',
}));

const StyledMessageRow = styled('div')<{ isUser: boolean }>(({ isUser }) => ({
  display: 'flex',
  justifyContent: isUser ? 'flex-end' : 'flex-start',
  width: '100%',
}));

const StyledMessage = styled('div')<{ isUser: boolean }>(({ isUser, theme }) => ({
  maxWidth: '80%',
  padding: '12px 16px',
  borderRadius: '12px',
  backgroundColor: isUser ? theme.palette.primary.main : '#f5f5f5',
  color: isUser ? '#fff' : 'inherit',
  wordBreak: 'break-word',
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: 'white',
  marginRight: theme.spacing(2),
}));

const StyledExampleGrid = styled('div')(() => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
  gap: '16px',
  padding: '16px',
}));

const StyledExampleButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'left',
  justifyContent: 'flex-start',
  height: '100%',
  borderRadius: '8px',
  backgroundColor: '#f5f5f5',
  color: 'inherit',
  '&:hover': {
    backgroundColor: '#e0e0e0',
  },
}));

const StyledContainer = styled('div')<{ sidebarOpen: boolean }>(({ theme, sidebarOpen }) => ({
  padding: `${theme.spacing(4)} ${theme.spacing(0)} ${theme.spacing(0)} ${sidebarOpen ? '280px' : '0'}`,
  maxWidth: '1000px',
  display: 'flex',
  transition: 'padding 0.3s ease',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  width: '100%',
  display: 'flex', 
  flexDirection: 'column',
  height: 'calc(100vh - 100px)', 
}));

const StyledLayout = styled(Stack)(() => ({
  display: 'flex',
  flexDirection: 'row',
}));

const StyledButton = styled(IconButton)(() => ({
  position: 'fixed',
  left: '0%',
  marginRight: 'auto',
}));

// Ellipses loading indicator :)
const LoadingDots = () => {
  const dotStyle = {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    backgroundColor: '#666',
    borderRadius: '50%',
    margin: '0 3px',
    animation: 'bouncingDots 1.4s infinite ease-in-out both',
  };

  return (
    <>
      <style>
        {`
          @keyframes bouncingDots {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-8px); }
          }
        `}
      </style>
      <div style={{ display: 'flex', gap: '4px' }}>
        <div style={{ ...dotStyle, animationDelay: '0s' }} />
        <div style={{ ...dotStyle, animationDelay: '0.2s' }} />
        <div style={{ ...dotStyle, animationDelay: '0.4s' }} />
      </div>
    </>
  );
};

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

  const [modelOptions, setModelOptions] = useState([]);
  const [selectedModel, setSelectedModel] = useState<Model>({} as Model);
  const [vectorOptions, setVectorOptions] = useState([]);
  const [selectedVectorDB, setSelectedVectorDB] = useState<Model>({} as Model);
  const [storageOptions, setStorageOptions] = useState([]);
  const [selectedStorage, setSelectedStorage] = useState<Model>({} as Model);

  const [open, setOpen] = useState<boolean>(false);
  const [refresh, setRefresh] = useState<boolean>(false);
  const [sideOpen, setSideOpen] = useState<boolean>(true);
  const { control, handleSubmit } = useForm({
    defaultValues: {
      QUESTION: '',
    },
  });

  const [limit, setLimit] = useState<number>(3);
  const [temperature, setTemperature] = useState<number>(0);

  // Added new states for chat functionality
  const [messages, setMessages] = useState<{ type: string; content: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Example questions - change/remove later
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
    
    let pixel = `MyEngines ( engineTypes=["MODEL"]);`;

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

    // Grab all Vector DBs in GCAI
    pixel = `MyEngines ( engineTypes=["VECTOR"]);`;

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

    pixel = `MyEngines ( engineTypes=["STORAGE"]);`;

    actions.run(pixel).then((response) => {
        // Get databaseID from output
        const { output, operationType } = response.pixelReturn[0];

        if (operationType.indexOf("ERROR") > -1) {
            throw new Error(output as string);
        }

        if (Array.isArray(output)) {
            setStorageOptions(output);
            setSelectedStorage(output[1]);
        }
    });

    pixel = `CreateRestFunctionEngine --help`;

    actions.run(pixel).then((response) => {
        console.log(response);
    });
    
    setIsLoading(false);
  }, []);
        
  useEffect(() => {
    const pixel = `MyEngines ( engineTypes=["VECTOR"]);`;

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
    <StyledLayout justifyContent="center">
      <Stack>
        {sideOpen ? (
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
            //sideOpen={sideOpen}
            setSideOpen={setSideOpen}
            setOpen={setOpen}
            limit={limit}
            setLimit={setLimit}
            temperature={temperature}
            setTemperature={setTemperature}
          />
        ) : (
          <StyledButton onClick={() => setSideOpen(!sideOpen)}>
            <ArrowForwardIosIcon/>
          </StyledButton>
        )}

        <StyledContainer sidebarOpen={sideOpen}>
          <StyledPaper variant={'elevation'} elevation={2} square>
            <Typography variant="h5">RAG Policy Bot</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Assists users in answering complex policy, operational procedure, and system questions.
            </Typography>

            {error && <Alert color="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Chat interface (replacing the old form) */}
            <StyledChatContainer>
              <StyledMessagesContainer>
                {messages.length === 0 ? (
                  <StyledExampleGrid>
                    {exampleQuestions.map((question, idx) => (
                      <StyledExampleButton 
                        key={idx}
                        onClick={() => handleExampleClick(question)}
                        disabled={isLoading}
                        variant="outlined"
                      >
                        {question}
                      </StyledExampleButton>
                    ))}
                  </StyledExampleGrid>
                ) : (
                  messages.map((message, idx) => (
                    <StyledMessageRow key={idx} isUser={message.type === 'user'}>
                      <StyledMessage isUser={message.type === 'user'}>
                        {message.content === '...' ? (
                          <LoadingDots />
                        ) : (
                          <Markdown>{message.content}</Markdown>
                        )}
                      </StyledMessage>
                    </StyledMessageRow>
                  ))
                )}
                <div ref={messagesEndRef} />
              </StyledMessagesContainer>

              <StyledInputContainer>
                <StyledInputWrapper>
                  <StyledTextarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onInput={handleTextareaInput}
                    placeholder="Type your question here..."
                    rows={1}
                    disabled={isLoading}
                  />
                  <StyledSendButton
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    color="primary"
                  >
                    {isLoading ? "..." : "Send"}
                  </StyledSendButton>
                </StyledInputWrapper>
              </StyledInputContainer>
            </StyledChatContainer>
          </StyledPaper>
          {isLoading && <LinearProgress />}
        </StyledContainer>
      </Stack>
      <Modal open={open} onClose={() => setOpen(false)}>
        <VectorModal
          setOpen={setOpen}
          open={open}
          vectorOptions={vectorOptions}
          setRefresh={setRefresh}
          setSelectedVectorDB={setSelectedVectorDB}
          selectedVectorDB={selectedVectorDB}
          setError={setError}
        />
      </Modal>
    </StyledLayout>
  );
};