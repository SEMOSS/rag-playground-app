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
import {
    ChecklistOutlined,
    EmojiEventsOutlined,
    GroupAddOutlined,
    InsertChartOutlined,
    LibraryBooksOutlined,
    NotesOutlined,
    WebAssetOff,
    WebAssetOutlined,
} from '@mui/icons-material';

export default function AppGrid() {
    const [searchQuery, setSearchQuery] = useState('');
    const [apps, setApps] = useState<App[]>([]);
    const { actions } = useInsight();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Onboarding Portal:"Streamline the onboarding process for new team members."
    // Report Generator:"Quickly create and share custom reports."
    // RAG Playground:"Chat with documents."
    // Action Item Tracker:"Record and track completion of action items over time."
    // Meeting Minute Aide:"Create and organize meeting minutes."
    // Resource Library:"Access project resources in a central location."
    // Award Nominator:"Create and manage award nominations."
    // 1. **Onboarding Portal:** "Streamline the onboarding process for new team members."
    //     - *Icon Suggestion:* `GroupAddOutlined`
    //     - This icon visually suggests the addition of new members, aligning well with the onboarding theme.

    // 2. **Report Generator:** "Quickly create and share custom reports."
    //     - *Icon Suggestion:* `InsertChartOutlined`
    //     - This icon represents charts or reports, which is ideal for a reporting tool.

    // 3. **RAG Playground:** "Chat with documents."
    //     - *Icon Suggestion:* `ChatBubbleOutline`
    //     - The chat bubble icon denotes communication, ideal for a document chat interface.

    // 4. **Action Item Tracker:** "Record and track completion of action items over time."
    //     - *Icon Suggestion:* `ChecklistOutlined` or `AssignmentTurnedInOutlined`
    //     - Both icons are suitable for tracking tasks and reflecting task completion.

    // 5. **Meeting Minute Aide:** "Create and organize meeting minutes."
    //     - *Icon Suggestion:* `NotesOutlined`
    //     - This icon is perfect for note-taking and organizing, making it fitting for meeting minutes.

    // 6. **Resource Library:** "Access project resources in a central location."
    //     - *Icon Suggestion:* `LibraryBooksOutlined`
    //     - The library books icon directly relates to accessing documents or resources.

    // 7. **Award Nominator:** "Create and manage award nominations."
    //     - *Icon Suggestion:* `EmojiEventsOutlined`
    //     - This icon depicts a trophy or award, suitable for an application focused on nominations.

    // Default apps that will always be shown
    const defaultApps: App[] = [
        // {
        //     project_id: '1',
        //     project_name: 'Onboarding Portal',
        //     project_description:
        //         'Streamline the onboarding process for new team members.',
        //     icon: GroupAddOutlined,
        //     url: '#',
        //     project_type: 'disabled',
        //     low_project_name: '',
        //     permission: 0,
        //     project_cost: '',
        //     project_created_by: '',
        //     project_created_by_type: '',
        //     project_date_created: 'March 4, 2025',
        //     project_discoverable: false,
        //     project_favorite: 0,
        //     project_global: false,
        //     project_has_portal: false,
        //     project_portal_name: '',
        //     user_permission: 0,
        // },
        // {
        //     project_id: '2',
        //     project_name: 'Report Generator',
        //     project_description: 'Quickly create and share custom reports.',
        //     icon: InsertChartOutlined,
        //     url: '#',
        //     project_type: 'Logistics',
        //     low_project_name: '',
        //     permission: 0,
        //     project_cost: '',
        //     project_created_by: '',
        //     project_created_by_type: '',
        //     project_date_created: 'March 4, 2025',
        //     project_discoverable: false,
        //     project_favorite: 0,
        //     project_global: false,
        //     project_has_portal: false,
        //     project_portal_name: '',
        //     user_permission: 0,
        // },
        // {
        //     project_id: '3',
        //     project_name: 'Personnel Management',
        //     project_description:
        //         'Manage military and civilian personnel records',
        //     icon: 'users',
        //     url: '#',
        //     project_type: 'Administration',
        //     low_project_name: '',
        //     permission: 0,
        //     project_cost: '',
        //     project_created_by: '',
        //     project_created_by_type: '',
        //     project_date_created: 'March 4, 2025',
        //     project_discoverable: false,
        //     project_favorite: 0,
        //     project_global: false,
        //     project_has_portal: false,
        //     project_portal_name: '',
        //     user_permission: 0,
        // },
        {
            project_id: '4',
            project_name: 'Action Item Tracker',
            project_description:
                'Record and track completion of action items over time.',
            icon: ChecklistOutlined,
            url: '#',
            project_type: 'disabled',
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
            project_name: 'Meeting Minute Aid',
            project_description: 'Create and organize meeting minutes.',
            icon: NotesOutlined,
            url: '#',
            project_type: 'disabled',
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
            project_name: 'Resource Library',
            project_description:
                'Access project resources in a central location.',
            icon: LibraryBooksOutlined,
            url: '#',
            project_type: 'disabled',
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
            project_name: 'Award Nominator',
            project_description: 'Create and manage award nominations.',
            icon: EmojiEventsOutlined,
            url: '#',
            project_type: 'disabled',
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
                    apps = apps.map((a) => ({ ...a, icon: WebAssetOutlined }));

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
