import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    TextField,
    Button,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
} from '@mui/material';
import type { App } from '../lib/types';

interface AddAppDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onAddApp: (app: App) => void;
}

export default function AddAppDialog({
    isOpen,
    onClose,
    onAddApp,
}: AddAppDialogProps) {
    const [newApp, setNewApp] = useState<Partial<App>>({
        project_name: '',
        project_description: '',
        icon: 'app-window',
        url: '',
        project_type: 'Other',
    });

    const iconOptions = [
        'app-window',
        'file-text',
        'users',
        'calendar',
        'package',
        'pill',
        'dollar-sign',
        'graduation-cap',
        'building',
        'clipboard',
        'activity',
        'shield',
        'database',
        'globe',
        'mail',
    ];

    const project_typeOptions = [
        'Clinical',
        'Administration',
        'Logistics',
        'Education',
        'Finance',
        'Security',
        'Other',
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!newApp.project_name || !newApp.url) {
            return; // Basic validation
        }

        const appToAdd: App = {
            project_id: `${Date.now()}`, // Generate a unique ID
            project_name: newApp.project_name || '',
            project_description: newApp.project_description || '',
            icon: newApp.icon || 'app-window',
            url: newApp.url || '#',
            project_type: newApp.project_type || 'Other',
            low_project_name: '',
            permission: 0,
            project_cost: '',
            project_created_by: '',
            project_created_by_type: '',
            project_date_created: '',
            project_discoverable: false,
            project_favorite: 0,
            project_global: false,
            project_has_portal: false,
            project_portal_name: '',
            user_permission: 0,
        };

        onAddApp(appToAdd);

        // Reset form
        setNewApp({
            project_name: '',
            project_description: '',
            icon: 'app-window',
            url: '',
            project_type: 'Other',
        });
    };

    return (
        <Dialog open={isOpen} onClose={onClose}>
            <DialogTitle>Add New Application</DialogTitle>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <TextField
                        margin="normal"
                        label="Application Name *"
                        fullWidth
                        value={newApp.project_name}
                        onChange={(e) =>
                            setNewApp({
                                ...newApp,
                                project_name: e.target.value,
                            })
                        }
                        placeholder="Enter application name"
                        required
                    />
                    <TextField
                        margin="normal"
                        label="description"
                        fullWidth
                        multiline
                        rows={3}
                        value={newApp.project_description}
                        onChange={(e) =>
                            setNewApp({
                                ...newApp,
                                project_description: e.target.value,
                            })
                        }
                        placeholder="Brief project_description of the application"
                    />
                    <TextField
                        margin="normal"
                        label="URL *"
                        fullWidth
                        value={newApp.url}
                        onChange={(e) =>
                            setNewApp({ ...newApp, url: e.target.value })
                        }
                        placeholder="https://example.com"
                        required
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="icon-label">Icon</InputLabel>
                        <Select
                            labelId="icon-label"
                            value={newApp.icon}
                            onChange={(e) =>
                                setNewApp({
                                    ...newApp,
                                    icon: e.target.value as string,
                                })
                            }
                            label="Icon"
                        >
                            {iconOptions.map((icon) => (
                                <MenuItem key={icon} value={icon}>
                                    {icon.charAt(0).toUpperCase() +
                                        icon.slice(1).replace(/-/g, ' ')}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="project_type-label">Type</InputLabel>
                        <Select
                            labelId="project_type-label"
                            value={newApp.project_type}
                            onChange={(e) =>
                                setNewApp({
                                    ...newApp,
                                    project_type: e.target.value as string,
                                })
                            }
                            label="project_type"
                        >
                            {project_typeOptions.map((project_type) => (
                                <MenuItem
                                    key={project_type}
                                    value={project_type}
                                >
                                    {project_type}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <DialogActions>
                        <Button onClick={onClose} color="primary">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            color="primary"
                            variant="contained"
                        >
                            Add Application
                        </Button>
                    </DialogActions>
                </form>
            </DialogContent>
        </Dialog>
    );
}
