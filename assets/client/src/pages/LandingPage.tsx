import React, { useEffect } from 'react';
import { Box, Container, Typography } from '@mui/material';
import AppGrid from '../components/AppGrid';
import DhaHeader from '../components/DhaHeader';

export const LandingPage = () => {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                height: '100%',
                backgroundColor: 'grey.50',
            }}
        >
            <DhaHeader />
            <Container component="main" maxWidth="lg" sx={{ py: 8 }}>
                <Box textAlign="center" mb={8}>
                    <Typography
                        variant="h3"
                        component="h1"
                        color="primary.dark"
                        gutterBottom
                    >
                        Defense Health Agency PMO Portal
                    </Typography>
                    <Typography
                        variant="body1"
                        color="text.secondary"
                        maxWidth={600}
                        mx="auto"
                    >
                        Accelerate Your PMO: AI-Powered Assistance
                    </Typography>
                </Box>
                <AppGrid />
            </Container>
            <Box
                component="footer"
                sx={{ backgroundColor: 'primary.main', color: 'white', py: 6 }}
            >
                {/* <Container>
                    <Typography variant="body2">
                        Defense Health Agency &copy; {new Date().getFullYear()}{' '}
                        | Official Use Only
                    </Typography>
                    <Typography
                        variant="caption"
                        color="grey.300"
                        mt={2}
                        display="block"
                    >
                        This is an official U.S. Government information system
                        for authorized personnel only.
                    </Typography>
                </Container> */}
            </Box>
        </Box>
    );
};
