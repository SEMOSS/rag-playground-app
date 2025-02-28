import React from 'react';
declare var require: any
import { styled, Box, Container, Tooltip, Button } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import SendIcon from '@mui/icons-material/Send';


const StyledPromptContainer = styled('div')(({ theme }) => ({
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    top: -100,
}));

const StyledContainer = styled('div')(({ theme }) => ({
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    borderRadius: '12px',
    boxShadow: theme.shadows[4],
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
    backgroundColor: theme.palette.background.paper,
    [theme.breakpoints.down('md')]: {
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4),
        width: '95%',
    },
}));

const CustomGrid = styled(Grid)(({ theme }) => ({
    maxHeight: '25vh',
    overflow: 'auto',
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
}));

const StyledTextContainer = styled('div')({
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'space-between',
});

const StyledContext = styled(Button)(({ theme }) => ({
    width: '100%',
    justifyContent: 'flex-start',
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    paddingRight: theme.spacing(3),
    paddingLeft: theme.spacing(3),
    color: theme.palette.text.secondary,
    border: '1px solid gray',
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
    backgroundColor: theme.palette.background.paper,
    '& svg': {
        visibility: 'hidden',
    },
    '&:hover': {
        // blue 600
        color: '#1e88e5',
        // Shows the icon and makes it blue on hover
        '& svg': {
            visibility: 'visible',
            fill: '#1e88e5',
        },
    },
}));

const StyledTextLabel = styled('div')(({ theme }) => ({
    color: 'gray',
    fontSize: 'small',
    paddingBottom: '20px',
    paddingLeft: theme.spacing(2),
}));

const StyledContextText = styled('span', {
    shouldForwardProp: (prop) => prop !== 'custom',
})<{
    /** Track if it is the custom context */
    custom: boolean;
}>(({ theme, custom }) => ({
    ...theme.typography.body2,
    // two lineheight
    // IF we need to keep this height uncomment
    // height: `${2 * 1.43 * 14}px`,
    color: custom
        ? theme.typography.caption.color
        : theme.typography.body2.color,
    lineHeight: custom ? 2 * 1.43 : 1.43,
    fontStyle: custom ? 'italic' : undefined,
    margin: custom ? 'auto' : undefined,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
}));

export const PregeneratedContext = ({handlePromptChange}) => {
    //Pre generated Prompts
    const prompts = require('../../../constants/pregen_context.json')

    const promptMap = prompts.GENERAL
    
    
    return(
        <StyledPromptContainer>
        <StyledContainer>
            <Container maxWidth="xl">
                <StyledTextLabel>Suggested Prompts</StyledTextLabel>
                <Box>
                    <CustomGrid container spacing={2}>
                        {promptMap.map((i) => {
                            return (
                                <Grid
                                    key={i.prompt_id}
                                    xs={12}
                                    sm={12}
                                    md={6}
                                >
                                    <Tooltip title={i.context}>
                                        <span>
                                            <StyledContext
                                                variant="outlined"
                                                endIcon={<SendIcon />}
                                                onClick={()=> handlePromptChange(i)}
                                            >
                                                <StyledTextContainer>
                                                    <StyledContextText
                                                        custom={false}
                                                    >
                                                        {i.context}
                                                    </StyledContextText>
                                                </StyledTextContainer>
                                            </StyledContext>
                                        </span>
                                    </Tooltip>
                                </Grid>
                            );
                        })}
                    </CustomGrid>
                </Box>
            </Container>
        </StyledContainer>
    </StyledPromptContainer>
);
}