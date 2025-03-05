export interface App extends KnowledgeApp {
    project_id: string;
    project_name: string;
    project_description: string;
    icon?: string | any;
    url: string;
    project_type: string;
    low_project_name: string;
    permission: number;
    project_cost: string; // Assuming it might be empty or a number as a string
    project_created_by: string;
    project_created_by_type: string;
    project_date_created: string; // If you want to handle dates, you might consider the Date type
    project_discoverable: boolean;
    project_favorite: number; // Since it's a 1/0, it could be modeled as number or boolean (if representing as boolean, conversion logic may be needed)
    project_global: boolean;
    project_has_portal: boolean;
    project_portal_name: string;
    user_permission: number;
}

export interface KnowledgeApp {
    engine?: string;
    model?: string;
    vector?: string;
    temperature?: string;
    queryCount?: string;
}

export interface Project {
    low_project_name: string;
    permission: number;
    project_cost: string; // Assuming it might be empty or a number as a string
    project_created_by: string;
    project_created_by_type: string;
    project_date_created: string; // If you want to handle dates, you might consider the Date type
    project_discoverable: boolean;
    project_favorite: number; // Since it's a 1/0, it could be modeled as number or boolean (if representing as boolean, conversion logic may be needed)
    project_global: boolean;
    project_has_portal: boolean;
    project_id: string;
    project_name: string;
    project_portal_name: string;
    project_type: string;
    user_permission: number;
}
