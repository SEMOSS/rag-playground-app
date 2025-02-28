import React from 'react';
import {
    styled,
    Paper,
    IconButton,
    Autocomplete,
    TextField,
    Button,
    Slider,
    Typography,
    Tooltip,
} from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Model } from '@/pages/PolicyPage';

const StyledSidebar = styled(Paper)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '280px',
    borderRadius: '0',
    padding: theme.spacing(2),
    gap: theme.spacing(2),
    // backgroundColor: 'black',
    [theme.breakpoints.down('md')]: {
        position: 'absolute',
        zIndex: open ? theme.zIndex.drawer + 2 : -1,
        width: '100%',
        maxWidth: '280px',
    },
    position: 'fixed',
    left: '0%',
    height: '100%',
    zIndex: 2,
}));

const StyledButton = styled(IconButton)(() => ({
    marginLeft: 'auto',
}));

const StyledDiv = styled('div')(() => ({
    display: 'flex',
}));

const filter = createFilterOptions();

export const Sidebar = ({
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
}) => {
    const limitTooltipText = `
    This will change the amount of documents pulled from 
    a vector database. Pulling too many documents can potentially cause your engines
    token limit to be exceeded!
    `;

    const temperatureTooltipText = `
    This changes the randomness of the LLM's output. 
    The higher the temperature the more creative and imaginative your
    answer will be.
    `;
    return (
        <StyledSidebar>
            <StyledButton onClick={() => setSideOpen(false)}>
                <CloseIcon />
            </StyledButton>
            <Autocomplete
                disableClearable
                options={modelOptions}
                value={selectedModel}
                getOptionLabel={(option: Model) => option.database_name}
                onChange={(event, newModel) => setSelectedModel(newModel)}
                renderInput={(params) => (
                    <TextField {...params} label="Model" variant="standard" />
                )}
            />

            <Autocomplete
                disableClearable
                freeSolo
                options={vectorOptions}
                value={selectedVectorDB}
                filterOptions={(options, params) => {
                    const filtered = filter(options, params);
                    const { inputValue } = params;
                    // Suggest the creation of a new value
                    const isExisting = options.some(
                        (option) => inputValue === option.database_name,
                    );
                    if (inputValue !== '' && !isExisting) {
                        filtered.push({
                            inputValue,
                        });
                    }

                    return filtered;
                }}
                getOptionLabel={(option) => {
                    if (typeof option === 'string') {
                        return option;
                    }

                    if (option?.inputValue) {
                        return option.inputValue;
                    }

                    return option.database_name;
                }}
                onChange={(event, newVectorDB) =>
                    setSelectedVectorDB(newVectorDB)
                }
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Vector Database"
                        variant="standard"
                    />
                )}
            />
            <Autocomplete
                disableClearable
                options={storageOptions}
                value={selectedStorage}
                getOptionLabel={(option) => option.database_name}
                onChange={(event, newStorage) => setSelectedStorage(newStorage)}
                renderInput={(params) => (
                    <TextField {...params} label="Storage" variant="standard" />
                )}
            />
            <StyledDiv style={{ display: 'flex' }}>
                <Typography>Number of Results Queried</Typography>
                <Tooltip title={limitTooltipText}>
                    <HelpOutlineIcon
                        color="primary"
                        sx={{ fontSize: 15, marginLeft: '5px' }}
                    />
                </Tooltip>
            </StyledDiv>

            <Slider
                value={limit}
                step={1}
                min={1}
                max={10}
                marks
                valueLabelDisplay="auto"
                onChange={(event, newValue) => setLimit(newValue)}
            />

            <StyledDiv>
                <Typography>Temperature</Typography>
                <Tooltip title={temperatureTooltipText}>
                    <HelpOutlineIcon
                        color="primary"
                        sx={{ fontSize: 15, marginLeft: '5px' }}
                    />
                </Tooltip>
            </StyledDiv>

            <Slider
                value={temperature}
                step={0.1}
                min={0}
                max={1}
                marks
                valueLabelDisplay="auto"
                onChange={(event, newValue) => setTemperature(newValue)}
            />

            <Button variant="contained" onClick={() => setOpen(true)}>
                Add a New Knowledge Repository
            </Button>
        </StyledSidebar>
    );
};
