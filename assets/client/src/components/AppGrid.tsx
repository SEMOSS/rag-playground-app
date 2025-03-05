import React, { useState, useEffect } from 'react';
import {
    TextField,
    Button,
    Grid,
    Typography,
    Box,
    IconButton,
    InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Add from '@mui/icons-material/Add';

import AppCard from '../components/AppCard';
import AddAppDialog from '../components/AddAppDialog';
import type { App } from '../lib/types';
import { useInsight } from '@semoss/sdk-react';

export default function AppGrid() {
    const [searchQuery, setSearchQuery] = useState('');
    const [apps, setApps] = useState<App[]>([]);
    const { actions } = useInsight();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Default apps that will always be shown
    const defaultApps: App[] = [
        {
            project_id: '1',
            project_name: 'Electronic Health Record',
            project_description: 'Access and manage patient health records',
            icon: 'file-text',
            url: '#',
            project_type: 'Clinical',
            low_project_name: '',
            permission: 0,
            project_cost: '',
            project_created_by: '',
            project_created_by_type: '',
            project_date_created: 'March 4, 2025',
            project_discoverable: false,
            project_favorite: 0,
            project_global: false,
            project_has_portal: false,
            project_portal_name: '',
            user_permission: 0,
        },
        {
            project_id: '2',
            project_name: 'Medical Logistics',
            project_description:
                'Track and manage medical supplies and equipment',
            icon: 'package',
            url: '#',
            project_type: 'Logistics',
            low_project_name: '',
            permission: 0,
            project_cost: '',
            project_created_by: '',
            project_created_by_type: '',
            project_date_created: 'March 4, 2025',
            project_discoverable: false,
            project_favorite: 0,
            project_global: false,
            project_has_portal: false,
            project_portal_name: '',
            user_permission: 0,
        },
        {
            project_id: '3',
            project_name: 'Personnel Management',
            project_description:
                'Manage military and civilian personnel records',
            icon: 'users',
            url: '#',
            project_type: 'Administration',
            low_project_name: '',
            permission: 0,
            project_cost: '',
            project_created_by: '',
            project_created_by_type: '',
            project_date_created: 'March 4, 2025',
            project_discoverable: false,
            project_favorite: 0,
            project_global: false,
            project_has_portal: false,
            project_portal_name: '',
            user_permission: 0,
        },
        {
            project_id: '4',
            project_name: 'Pharmacy System',
            project_description: 'Prescription management and tracking',
            icon: 'pill',
            url: '#',
            project_type: 'Clinical',
            low_project_name: '',
            permission: 0,
            project_cost: '',
            project_created_by: '',
            project_created_by_type: '',
            project_date_created: 'March 4, 2025',
            project_discoverable: false,
            project_favorite: 0,
            project_global: false,
            project_has_portal: false,
            project_portal_name: '',
            user_permission: 0,
        },
        {
            project_id: '5',
            project_name: 'Appointment Scheduler',
            project_description: 'Schedule and manage patient appointments',
            icon: 'calendar',
            url: '#',
            project_type: 'Clinical',
            low_project_name: '',
            permission: 0,
            project_cost: '',
            project_created_by: '',
            project_created_by_type: '',
            project_date_created: 'March 4, 2025',
            project_discoverable: false,
            project_favorite: 0,
            project_global: false,
            project_has_portal: false,
            project_portal_name: '',
            user_permission: 0,
        },
        {
            project_id: '6',
            project_name: 'Budget Tracker',
            project_description: 'Track and manage departmental budgets',
            icon: 'dollar-sign',
            url: '#',
            project_type: 'Administration',
            low_project_name: '',
            permission: 0,
            project_cost: '',
            project_created_by: '',
            project_created_by_type: '',
            project_date_created: 'March 4, 2025',
            project_discoverable: false,
            project_favorite: 0,
            project_global: false,
            project_has_portal: false,
            project_portal_name: '',
            user_permission: 0,
        },
        {
            project_id: '7',
            project_name: 'Training Portal',
            project_description:
                'Access required training and education resources',
            icon: 'graduation-cap',
            url: '#',
            project_type: 'Education',
            low_project_name: '',
            permission: 0,
            project_cost: '',
            project_created_by: '',
            project_created_by_type: '',
            project_date_created: 'March 4, 2025',
            project_discoverable: false,
            project_favorite: 0,
            project_global: false,
            project_has_portal: false,
            project_portal_name: '',
            user_permission: 0,
        },
        {
            project_id: '8',
            project_name: 'Facility Management',
            project_description: 'Manage medical facilities and infrastructure',
            icon: 'building',
            url: '#',
            project_type: 'Logistics',
            low_project_name: '',
            permission: 0,
            project_cost: '',
            project_created_by: '',
            project_created_by_type: '',
            project_date_created: 'March 4, 2025',
            project_discoverable: false,
            project_favorite: 0,
            project_global: false,
            project_has_portal: false,
            project_portal_name: '',
            user_permission: 0,
        },
    ];

    // Load apps from localStorage on component mount
    useEffect(() => {
        const loadApps = () => {
            const savedApps = localStorage.getItem('dhaUserApps');
            const sortedApps = Object.values(
                savedApps ? JSON.parse(savedApps) : [],
            ) as App[];
            const userApps = sortedApps.map((a) => ({
                ...a,
                type: 'RAG',
                url: `#/policy?${new URLSearchParams(
                    JSON.stringify(a),
                ).toString()}`,
            }));
            try {
                const pixel = `MyProjects(metaKeys = ["tag","domain","data classification","data restrictions","description"], metaFilters=[{"tag":["DHA"]}], filterWord=[""]);`;
                let apps = [];
                actions.run(pixel).then((response) => {
                    const { output, operationType } = response.pixelReturn[0];

                    if (operationType.indexOf('ERROR') > -1) {
                        throw new Error(output as string);
                    }
                    apps = output as any[];

                    setApps([...defaultApps, ...apps, ...userApps]);
                });
            } catch (error) {
                console.error('Error loading apps from localStorage:', error);
                setApps([...defaultApps, ...userApps]);
            }
        };

        loadApps();
    }, []);

    // Save user-added apps to localStorage
    const saveUserApps = (allApps: App[]) => {
        const userApps = allApps.filter(
            (app) =>
                !defaultApps.some(
                    (defaultApp) => defaultApp.project_id === app.project_id,
                ),
        );
        localStorage.setItem('dhaUserApps', JSON.stringify(userApps));
    };

    // Add a new app
    const addApp = (newApp: App) => {
        const updatedApps = [...apps, newApp];
        setApps(updatedApps);
        saveUserApps(updatedApps);
        setIsDialogOpen(false);
    };

    // Filter apps based on search query
    const filteredApps = apps.filter(
        (app) =>
            app.project_name
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            app?.project_description
                ?.toLowerCase()
                ?.includes(searchQuery.toLowerCase()) ||
            app.project_type.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <Box>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2,
                    mb: 4,
                    alignItems: 'center',
                }}
            >
                <TextField
                    fullWidth
                    placeholder="Search applications..."
                    variant="outlined"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            {filteredApps.length === 0 ? (
                <Box
                    sx={{
                        textAlign: 'center',
                        py: 3,
                        px: 2,
                        backgroundColor: 'background.paper',
                        borderRadius: 1,
                        boxShadow: 1,
                    }}
                >
                    <Typography variant="body1" color="textSecondary">
                        No applications found. Try a different search term or
                        add a new application.
                    </Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {filteredApps.map((app) => (
                        <Grid
                            item
                            key={app.project_id}
                            xs={12}
                            sm={6}
                            md={4}
                            lg={3}
                        >
                            <AppCard app={app} />
                        </Grid>
                    ))}
                </Grid>
            )}

            <AddAppDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onAddApp={addApp}
            />
        </Box>
    );
}
