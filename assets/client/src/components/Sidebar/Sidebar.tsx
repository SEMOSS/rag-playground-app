import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useInsight } from '@semoss/sdk-react';
import {
    FiX,
    FiPlus,
    FiTrash2,
    FiUpload,
    FiCheck,
    FiPaperclip,
} from 'react-icons/fi';
import { IoIosOptions } from 'react-icons/io';
import { defaultApps } from '@/constants';
import { App } from '@/lib/types';
import { Alert, Snackbar } from '@mui/material';

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
    isOpen: boolean;
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
    isOpen,
}) => {
    const { actions } = useInsight();
    const [showVectorCreation, setShowVectorCreation] =
        useState<boolean>(false);
    const [newVectorName, setNewVectorName] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [documents, setDocuments] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<string>('model');
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        color: 'success' | 'info' | 'warning' | 'error';
    }>({
        open: false,
        message: '',
        color: 'success',
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch documents when vector DB changes
    useEffect(() => {
        if (selectedVectorDB && selectedVectorDB.database_id) {
            fetchDocuments();
        }
    }, [selectedVectorDB, isOpen]);

    const fetchDocuments = async () => {
        if (selectedVectorDB && selectedVectorDB.database_id) {
            try {
                setLoading(true);
                const pixel = `ListDocumentsInVectorDatabase(engine="${selectedVectorDB.database_id}");`;

                console.log('FETCH PIXEL:', pixel);

                const response = await actions.run(pixel);
                const documentsList = response.pixelReturn[0].output;

                if (Array.isArray(documentsList)) {
                    setDocuments(documentsList.map((doc) => doc.fileName));
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

            setRefresh(false);
            setShowVectorCreation(true);
            setNewVectorName('');

            const newVectorDB = {
                database_id: (output as Model).database_id,
                database_name: newVectorName,
            };
            setSelectedVectorDB(newVectorDB);
        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : 'Failed to create vector database',
            );
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
            const pixel = `CreateEmbeddingsFromDocuments(engine="${
                selectedVectorDB.database_id
            }", filePaths=["${fileLocation.slice(1)}"]);`;

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
            setError(
                e instanceof Error ? e.message : 'Failed to upload document',
            );
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (section: string) => {
        setActiveSection(activeSection === section ? '' : section);
    };

    function generateUUID() {
        return 'xxx-4xxx-yxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    const saveUserApps = async () => {
        console.log(userApps);
        const apps =
            userApps?.filter(
                (app) =>
                    !defaultApps.some(
                        (defaultApp) =>
                            defaultApp.project_id === app.project_id,
                    ),
            ) || [];
        const appsById = apps.reduce((acc, app) => {
            acc[app.project_id] = app;
            return acc;
        }, {});
        const uuid = generateUUID();
        console.log({
            ...appsById,
            [uuid]: {
                model: selectedModel,
                vector: selectedVectorDB,
                storage: selectedStorage,
                temperature: temperature || 0.3,
                queryCount: limit || 3,
                project_name: `RAG Playground ${uuid}`,
                project_id: uuid,
                project_type: 'RAG',
                project_date_created: new Date(),
            },
        });
        localStorage.setItem(
            'dhaUserApps',
            JSON.stringify({
                ...appsById,
                [uuid]: {
                    model: selectedModel,
                    vector: selectedVectorDB,
                    storage: selectedStorage,
                    temperature: temperature || 0.3,
                    queryCount: limit || 3,
                    project_name: `RAG Playground ${uuid}`,
                    project_id: uuid,
                    project_type: 'RAG',
                    project_date_created: new Date(),
                },
            }),
        );
        setSnackbar({
            open: true,
            message: `Successfully saved application`,
            color: 'success',
        });
    };

    return (
        <SettingsSidebar isOpen={isOpen}>
            <Snackbar
                open={snackbar.open}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                autoHideDuration={6000}
                onClose={() => {
                    setSnackbar({
                        open: false,
                        message: '',
                        color: 'success',
                    });
                }}
            >
                <Alert severity={snackbar.color} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
            <SettingsHeader>
                <SettingsTitle>Chat Settings</SettingsTitle>
                <CloseSettingsButton onClick={() => setSideOpen(false)}>
                    <FiX size={20} />
                </CloseSettingsButton>
            </SettingsHeader>

            <SettingsSection>
                <SettingsSectionTitle onClick={() => toggleSection('model')}>
                    Model Selection
                </SettingsSectionTitle>

                {activeSection === 'model' && (
                    <SettingsItem>
                        <SettingsLabel>Model</SettingsLabel>
                        <SelectWrapper>
                            <StyledSelect
                                value={selectedModel?.database_id || ''}
                                onChange={(e) => {
                                    const selected = modelOptions.find(
                                        (model) =>
                                            model.database_id ===
                                            e.target.value,
                                    );
                                    if (selected) setSelectedModel(selected);
                                }}
                            >
                                <option value="" disabled>
                                    Select model
                                </option>
                                {modelOptions.map((model) => (
                                    <option
                                        key={model.database_id}
                                        value={model.database_id}
                                    >
                                        {model.database_name}
                                    </option>
                                ))}
                            </StyledSelect>
                        </SelectWrapper>
                    </SettingsItem>
                )}
            </SettingsSection>

            <SettingsSection>
                <SettingsSectionTitle onClick={() => toggleSection('vector')}>
                    Chat Knowledge
                </SettingsSectionTitle>

                {activeSection === 'vector' && (
                    <>
                        <SettingsItem>
                            <SettingsLabelWithButton>
                                <SettingsLabel>Database</SettingsLabel>
                            </SettingsLabelWithButton>
                            <SelectWrapper>
                                <StyledSelect
                                    value={selectedVectorDB?.database_id || ''}
                                    onChange={(e) => {
                                        if (e.target.value === 'new') {
                                            setShowVectorCreation(true);
                                        } else {
                                            const selected = vectorOptions.find(
                                                (vector) =>
                                                    vector.database_id ===
                                                    e.target.value,
                                            );
                                            if (selected)
                                                setSelectedVectorDB(selected);
                                        }
                                    }}
                                >
                                    <option value="" disabled>
                                        Select vector database
                                    </option>
                                    {vectorOptions.map((vector) => (
                                        <option
                                            key={vector.database_id}
                                            value={vector.database_id}
                                        >
                                            {vector.database_name}
                                        </option>
                                    ))}
                                    <option value="new">+ Create new</option>
                                </StyledSelect>
                            </SelectWrapper>
                        </SettingsItem>

                        {showVectorCreation && (
                            <SettingsItem>
                                <ContextEditContainer>
                                    <StyledInput
                                        type="text"
                                        placeholder="New vector database name"
                                        value={newVectorName}
                                        onChange={(e) =>
                                            setNewVectorName(e.target.value)
                                        }
                                    />
                                    <ButtonGroup>
                                        <SecondaryButton
                                            onClick={() =>
                                                setShowVectorCreation(false)
                                            }
                                        >
                                            Cancel
                                        </SecondaryButton>
                                        <PrimaryButton
                                            onClick={createVectorDB}
                                            disabled={
                                                loading || !newVectorName.trim()
                                            }
                                        >
                                            {loading ? 'Creating...' : 'Create'}
                                        </PrimaryButton>
                                    </ButtonGroup>
                                </ContextEditContainer>
                            </SettingsItem>
                        )}

                        {selectedVectorDB?.database_id && (
                            <SettingsItem>
                                <SettingsLabelWithButton>
                                    <SettingsLabel>Documents</SettingsLabel>
                                    <SettingsAddButton
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                    >
                                        <FiPlus size={14} />
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            style={{ display: 'none' }}
                                            accept=".pdf,.csv"
                                            onChange={handleFileChange}
                                        />
                                    </SettingsAddButton>
                                </SettingsLabelWithButton>

                                {file && (
                                    <SettingsFileItem>
                                        <SettingsFileIcon>📄</SettingsFileIcon>
                                        <SettingsFileDetails>
                                            <SettingsFileName>
                                                {file.name}
                                            </SettingsFileName>
                                            <SettingsFileInfo>
                                                {(
                                                    file.size /
                                                    (1024 * 1024)
                                                ).toFixed(2)}{' '}
                                                MB
                                            </SettingsFileInfo>
                                        </SettingsFileDetails>
                                        <ButtonGroup>
                                            <SettingsFileDelete
                                                onClick={() => setFile(null)}
                                            >
                                                <FiX size={14} />
                                            </SettingsFileDelete>
                                            <SettingsFileUpload
                                                onClick={uploadDocument}
                                                disabled={loading}
                                            >
                                                <FiUpload size={14} />
                                            </SettingsFileUpload>
                                        </ButtonGroup>
                                    </SettingsFileItem>
                                )}

                                {fileError && (
                                    <ErrorMessage>{fileError}</ErrorMessage>
                                )}

                                {loading && !file ? (
                                    <LoadingText>
                                        Loading documents...
                                    </LoadingText>
                                ) : documents.length === 0 ? (
                                    <SettingsEmptyState>
                                        No documents found
                                    </SettingsEmptyState>
                                ) : (
                                    <SettingsFileList>
                                        {documents.map((doc) => (
                                            <SettingsFileItem key={doc}>
                                                <SettingsFileIcon>
                                                    📄
                                                </SettingsFileIcon>
                                                <SettingsFileDetails>
                                                    <SettingsFileName>
                                                        {doc}
                                                    </SettingsFileName>
                                                </SettingsFileDetails>
                                                <SettingsFileDelete
                                                    onClick={() =>
                                                        deleteDocument(doc)
                                                    }
                                                    disabled={
                                                        isDeleting === doc
                                                    }
                                                >
                                                    {isDeleting === doc ? (
                                                        <LoadingSpinner />
                                                    ) : (
                                                        <FiTrash2 size={14} />
                                                    )}
                                                </SettingsFileDelete>
                                            </SettingsFileItem>
                                        ))}
                                    </SettingsFileList>
                                )}
                            </SettingsItem>
                        )}
                    </>
                )}
            </SettingsSection>

            <SettingsSection>
                <SettingsSectionTitle onClick={() => toggleSection('storage')}>
                    Storage
                </SettingsSectionTitle>

                {activeSection === 'storage' && (
                    <SettingsItem>
                        <SettingsLabel>Storage</SettingsLabel>
                        <SelectWrapper>
                            <StyledSelect
                                value={selectedStorage?.database_id || ''}
                                onChange={(e) => {
                                    const selected = storageOptions.find(
                                        (storage) =>
                                            storage.database_id ===
                                            e.target.value,
                                    );
                                    if (selected) setSelectedStorage(selected);
                                }}
                            >
                                <option value="" disabled>
                                    Select storage
                                </option>
                                {storageOptions.map((storage) => (
                                    <option
                                        key={storage.database_id}
                                        value={storage.database_id}
                                    >
                                        {storage.database_name}
                                    </option>
                                ))}
                            </StyledSelect>
                        </SelectWrapper>
                    </SettingsItem>
                )}
            </SettingsSection>

            <SettingsSection>
                <SettingsSectionTitle onClick={() => toggleSection('query')}>
                    Query Settings
                </SettingsSectionTitle>

                {activeSection === 'query' && (
                    <>
                        <SettingsItem>
                            <SettingsLabel>
                                Number of Results Queried
                                <TooltipWrapper>
                                    <TooltipIcon>?</TooltipIcon>
                                    <TooltipText>
                                        This will change the amount of documents
                                        pulled from a vector database. Pulling
                                        too many documents can potentially cause
                                        your engines token limit to be exceeded!
                                    </TooltipText>
                                </TooltipWrapper>
                            </SettingsLabel>
                            <SettingsSliderContainer>
                                <SettingsSlider
                                    type="range"
                                    min="1"
                                    max="10"
                                    step="1"
                                    value={limit}
                                    onChange={(e) =>
                                        setLimit(parseInt(e.target.value))
                                    }
                                />
                                <SettingsSliderValue>
                                    {limit}
                                </SettingsSliderValue>
                            </SettingsSliderContainer>
                        </SettingsItem>

                        <SettingsItem>
                            <SettingsLabel>
                                Temperature
                                <TooltipWrapper>
                                    <TooltipIcon>?</TooltipIcon>
                                    <TooltipText>
                                        This changes the randomness of the LLM's
                                        output. The higher the temperature the
                                        more creative and imaginative your
                                        answer will be.
                                    </TooltipText>
                                </TooltipWrapper>
                            </SettingsLabel>
                            <SettingsSliderContainer>
                                <SettingsSlider
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={temperature}
                                    onChange={(e) =>
                                        setTemperature(
                                            parseFloat(e.target.value),
                                        )
                                    }
                                />
                                <SettingsSliderValue>
                                    {temperature.toFixed(1)}
                                </SettingsSliderValue>
                            </SettingsSliderContainer>
                        </SettingsItem>
                    </>
                )}
            </SettingsSection>
            <SettingsSection>
                <SettingsSectionTitle onClick={saveUserApps}>
                    Save
                </SettingsSectionTitle>
            </SettingsSection>
        </SettingsSidebar>
    );
};

// Styled components
const SettingsSidebar = styled.div<{ isOpen: boolean }>`
    position: fixed;
    top: 0;
    right: ${(props) => (props.isOpen ? '0' : '-400px')};
    width: 350px;
    height: 100%;
    background: white;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
    padding: 20px;
    overflow-y: auto;
    transition: right 0.3s ease-in-out;
    z-index: 1000;
    display: flex;
    flex-direction: column;
`;

const SettingsHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #eee;
`;

const SettingsTitle = styled.h2`
    margin: 0;
    font-size: 1.3rem;
    font-color: rgb(36, 42, 100);
`;

const CloseSettingsButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #242a64;

    &:hover {
        color: rgb(36, 42, 100, 0.7);
    }
`;

const SettingsSection = styled.div`
    margin-bottom: 15px;
    border: 1px solid rgb(36, 42, 100);
    border-radius: 6px;
    overflow: hidden;
    display: 'flex';
    flex-direction: 'column';
`;

const SettingsSectionTitle = styled.h3`
    font-size: 1rem;
    margin: 0;
    padding: 12px 15px;
    background-color: #242a64;
    cursor: pointer;
    color: white;

    &:hover {
        background-color: rgb(36, 42, 100, 0.9);
    }
`;

const SettingsItem = styled.div`
    padding: 15px;
    border-top: 1px solid #eee;
`;

const SettingsLabel = styled.div`
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
`;

const SettingsLabelWithButton = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
`;

const SettingsAddButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgb(36, 42, 100);

    &:hover {
        color: rgb(36, 42, 100, 0.7);
    }
`;

const SelectWrapper = styled.div`
    position: relative;
    width: 100%;
`;

const StyledSelect = styled.select`
    width: 100%;
    padding: 8px 12px;
    border: 1px solid rgb(36, 42, 100);
    border-radius: 4px;
    background-color: white;
    font-size: 0.9rem;
    appearance: none;

    &:focus {
        outline: none;
        border-color: rgb(36, 42, 10, 0.7);
    }
`;

const StyledInput = styled.input`
    width: 100%;
    padding: 8px 12px;
    border: 1px solid rgb(36, 42, 100);
    border-radius: 4px;
    font-size: 0.9rem;
    margin-bottom: 10px;

    &:focus {
        outline: none;
        border-color: rgb(36, 42, 100, 0.7);
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 8px;
`;

const SecondaryButton = styled.button`
    padding: 6px 12px;
    background-color: #f5f5f5;
    color: #666;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;

    &:hover {
        background-color: #e5e5e5;
    }
`;

const PrimaryButton = styled.button<{ disabled?: boolean }>`
    padding: 6px 12px;
    font-size: 1rem;
    margin: 0;
    padding: 12px 15px;
    background-color: #242a64;
    cursor: pointer;
    color: white;

    background-color: ${(props) =>
        props.disabled ? '#ccc' : 'rgb(36, 42, 100)'};
    color: white;
    border: none;
    border-radius: 4px;
    cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};
    font-size: 0.85rem;

    &:hover {
        background-color: ${(props) => (props.disabled ? '#ccc' : '#3a80d2')};
    }
`;

const ContextEditContainer = styled.div`
    border: 1px solid #eee;
    border-radius: 6px;
    padding: 12px;
    background-color: #f9f9f9;
`;

const TooltipWrapper = styled.div`
    position: relative;
    display: inline-block;
    margin-left: 6px;
`;

const TooltipIcon = styled.span`
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
`;

const TooltipText = styled.span`
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
    font-weight: normal;

    ${TooltipWrapper}:hover & {
        visibility: visible;
        opacity: 1;
    }
`;

const SettingsSliderContainer = styled.div`
    display: flex;
    align-items: center;
`;

const SettingsSlider = styled.input`
    flex: 1;
    margin-right: 10px;
    -webkit-appearance: none;
    height: 4px;
    background: #ddd;
    border-radius: 2px;

    &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: rgb(36, 42, 100);
        cursor: pointer;
    }
`;

const SettingsSliderValue = styled.div`
    width: 30px;
    text-align: center;
    font-size: 0.9rem;
    font-weight: 500;
`;

const SettingsFileList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 200px;
    overflow-y: auto;
    margin-top: 10px;
`;

const SettingsFileItem = styled.div`
    display: flex;
    align-items: center;
    padding: 8px;
    background-color: #f9f9f9;
    border-radius: 6px;
`;

const SettingsFileIcon = styled.div`
    font-size: 1.2rem;
    margin-right: 10px;
`;

const SettingsFileDetails = styled.div`
    flex: 1;
    overflow: hidden;
`;

const SettingsFileName = styled.div`
    font-size: 0.85rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const SettingsFileInfo = styled.div`
    font-size: 0.75rem;
    color: #666;
    margin-top: 2px;
`;

const SettingsFileDelete = styled.button<{ disabled?: boolean }>`
    background: none;
    border: none;
    cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};
    color: ${(props) => (props.disabled ? '#ccc' : '#e53935')};
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;

    &:hover {
        color: ${(props) => (props.disabled ? '#ccc' : '#c62828')};
    }
`;

const SettingsFileUpload = styled.button<{ disabled?: boolean }>`
    background: none;
    border: none;
    cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};
    color: ${(props) => (props.disabled ? '#ccc' : 'rgb(36, 42, 100)')};
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;

    &:hover {
        color: ${(props) => (props.disabled ? '#ccc' : '#3a80d2')};
    }
`;

const SettingsEmptyState = styled.div`
    font-size: 0.85rem;
    color: #888;
    font-style: italic;
    text-align: center;
    margin-top: 10px;
`;

const ErrorMessage = styled.div`
    color: #e53935;
    font-size: 0.85rem;
    margin-top: 8px;
`;

const LoadingText = styled.div`
    font-size: 0.85rem;
    color: #666;
    text-align: center;
    margin-top: 10px;
`;

const LoadingSpinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: rgb(36, 42, 100);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
`;
