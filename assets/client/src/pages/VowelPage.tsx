import React from 'react';
import { useEffect, useState } from 'react';
import { useInsight } from '@semoss/sdk-react';
import { Env } from '@semoss/sdk';

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
    Modal,
    IconButton,
    List,
    ListItem,
    ListItemText
} from '@mui/material';

const StyledContainer = styled('div')(({ theme }) => ({
    margin: 'auto',
    maxWidth: '1000px',
    display: 'flex',
    justifyContent: 'center',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    margin: 'auto',
    padding: theme.spacing(4),
    width: '100%',
}));

const StyledButton = styled(IconButton)(() => ({
    position: 'fixed',
    left: '0%',
    marginRight: 'auto',
}));

export const VowelPage = () => {
    const { actions } = useInsight();
    const [isLoading, setIsLoading] = useState(false);
    const [input, setInput] = useState('');
    const [response, setResponse] = useState([]);
    const [error, setError] = useState(false);

    useEffect(() => {
        actions.run(
            `LoadPyFromFile(filePath=["version/assets/py/app.py"], space=["${Env.APP}"], alias=["main_py"]);`
        );
    }, []);

    const findVowels = async () => {
        if (input === '') {
            setError(true);
            return;
        }
        setError(false);
        console.log('findVowels');
        try {
            const { output } = await actions.runPy(
                `main_py.find_vowels('${input}')`
            );

            setResponse(output[0].output)
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <StyledContainer>
            <StyledPaper variant={'elevation'} elevation={2} square>
                <Stack spacing={2}>
                    <TextField
                        label="Enter text"
                        variant="outlined"
                        required
                        error={error}
                        helperText={error ? "This field is required" : ""}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                </Stack>
                <Stack spacing={2}>
                    <Button variant="contained" color="primary" onClick={findVowels}>
                        Find Vowels
                    </Button>
                </Stack>
            </StyledPaper>
            <StyledPaper variant={'elevation'} elevation={2} square>
                <List>
                    {response.map((vowel, index) => (
                        <ListItem key={index}>
                            <ListItemText primary={vowel} />
                        </ListItem>
                    ))}
                </List>
            </StyledPaper>
        </StyledContainer>
    );
};