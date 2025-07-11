


// export const BASE_URL = "http://localhost:8000";
export const BASE_URL = "https://oosc-edu-be-git-main-scrapos-projects.vercel.app";


// utils/apiPaths.js
export const API_PATHS = {
    AUTH: {
        LOGIN: "/api/users/login",
        REGISTER: "/api/users/register",
        GET_PROFILE: "/api/users/profile",
    },

    USERS: {
        GET_ALL_USERS: "/api/users/getAllUsers",
        GET_USER_BY_ID: (userId) => `/api/users/${userId}`,
        CREATE_USER: "/api/users",
        UPDATE_USER: (userId) => `/api/users/${userId}`,
        DELETE_USER: (userId) => `/api/users/delete/${userId}`,
    },

    TASKS: {
        GET_DASHBOARD_DATA: "/api/tasks/dashboard-data",
        GET_USER_DASHBOARD_DATA: "/api/tasks/user-dashboard-data",
        GET_ALL_TASKS: "/api/tasks",
        GET_TASK_BY_ID: (taskId) => `/api/tasks/${taskId}`,
        CREATE_TASK: "/api/tasks",
        UPDATE_TASK: (taskId) => `/api/tasks/${taskId}`,
        DELETE_TASK: (taskId) => `/api/tasks/${taskId}`,

        UPDATE_TASK_STATUS: (taskId) => `/api/tasks/${taskId}/status`,
        UPDATE_TODO_CHECKLIST: (taskId) => `/api/tasks/${taskId}/todo`,
    },

    ENTRIES: {
        GET_ALL_ENTRIES: "/api/entries/getAll",
        GET_ENTRY_BY_ID: (entryId) => `/api/entries/getById/${entryId}`,
        CREATE_ENTRY: "/api/entries/create",
        UPDATE_ENTRY_BY_ID: (entryId) => `/api/entries/updateById/${entryId}`,
        DELETE_ENTRY_BY_ID: (entryId) => `/api/entries/deleteById/${entryId}`,
    },

    REPORTS: {
        EXPORT_TASKS: "/api/reports/export/tasks",
        EXPORT_USERS: "/api/reports/export/users",
    },

    IMAGE: {
        UPLOAD_IMAGE: "/api/auth/upload-image",
    }

}