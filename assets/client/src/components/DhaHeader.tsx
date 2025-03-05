import React from 'react';

import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    IconButton,
    Container,
    Link,
    SvgIcon,
    styled,
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import DHALogo from '@/assets/img/DHALogo.svg';

const StyledLogo = styled('a')(({ theme }) => ({
    display: 'inline-flex',
    textDecoration: 'none',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    color: theme.palette.text.primary,
    fontSize: theme.typography.caption.fontSize,
    overflow: 'hidden',
    '& > img': {
        height: theme.spacing(4),
    },
    ':visited': {
        color: 'inherit',
    },
}));

export default function DhaHeader() {
    return (
        <AppBar
            position="static"
            sx={{ backgroundColor: 'navy.800', boxShadow: 2 }}
        >
            <Container maxWidth="lg">
                <Toolbar
                    disableGutters
                    sx={{ justifyContent: 'space-between', py: 1 }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                            sx={{
                                backgroundColor: 'white',
                                borderRadius: 1,
                                p: 0.5,
                            }}
                        >
                            <StyledLogo>
                                <img src={DHALogo} />
                            </StyledLogo>
                            {/* <SvgIcon>{DHALogo}</SvgIcon> */}
                        </Box>
                        <Box>
                            <Typography
                                variant="h6"
                                component="div"
                                sx={{ fontWeight: 'bold' }}
                            >
                                Defense Health Agency
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{ color: 'grey.300' }}
                            >
                                United States Department of Defense
                            </Typography>
                        </Box>
                    </Box>
                    <nav>
                        <Box
                            component="ul"
                            sx={{
                                display: 'flex',
                                gap: 3,
                                p: 0,
                                m: 0,
                                listStyle: 'none',
                            }}
                        >
                            {['Home', 'Support', 'Resources', 'Contact'].map(
                                (item) => (
                                    <li key={item}>
                                        <Link href="#">
                                            <Typography
                                                component="a"
                                                variant="body2"
                                                sx={{
                                                    color: 'inherit',
                                                    textDecoration: 'none',
                                                    '&:hover': {
                                                        textDecoration:
                                                            'underline',
                                                    },
                                                }}
                                            >
                                                {item}
                                            </Typography>
                                        </Link>
                                    </li>
                                ),
                            )}
                        </Box>
                    </nav>
                </Toolbar>
            </Container>
        </AppBar>
    );
}
