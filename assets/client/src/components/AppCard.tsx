import React, { useMemo } from 'react';
import {
    Card,
    CardContent,
    CardActions,
    CardHeader,
    Typography,
    Button,
    Badge as MuiBadge,
    Avatar,
    styled,
} from '@mui/material';
import type { App } from '../lib/types';
import { Env } from '@semoss/sdk';
import { AccessTime } from '@mui/icons-material';
import dayjs from 'dayjs';

interface AppCardProps {
    app: App;
}

const StyledPublishedByContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: '4px',
    alignSelf: 'stretch',
    padding: '2px',
    color: theme.palette.text.secondary,
}));

const StyledPublishedByLabel = styled(Typography)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: '1 0 0',
    fontSize: '12px',
    color: theme.palette.text.secondary,
}));

const StyledAccessTimeIcon = styled(AccessTime)(({ theme }) => ({
    color: theme.palette.text.secondary,
}));

const StyledCardDescription = styled(Typography)(({ theme }) => ({
    display: 'block',
    minHeight: '40px',

    maxWidth: '350px',
    whiteSpace: 'pre-wrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: theme.palette.text.secondary,
}));

export default function AppCard({ app }: AppCardProps) {
    return (
        <Card
            sx={{
                overflow: 'hidden',
                transition: 'box-shadow 0.3s',
                '&:hover': {
                    boxShadow: 6,
                },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderColor: 'grey.300',
            }}
        >
            <CardHeader
                sx={{ backgroundColor: 'primary.light', pb: 1 }}
                title={
                    <Typography
                        variant="h6"
                        sx={{
                            color: 'primary.contrastText',
                            mt: 0.5,
                            minHeight: '72px',
                        }}
                    >
                        {app.project_name}
                    </Typography>
                }
            />
            <CardContent sx={{ flexGrow: 1, py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    {app?.project_description || 'No project description'}
                </Typography>
            </CardContent>
            <CardActions sx={{ pt: 0, pb: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    href={`#/SemossWeb/packages/client/dist/#/s/${
                        app.project_id
                    }${app.url ? app.url : ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Launch
                </Button>
            </CardActions>
        </Card>
    );
}
