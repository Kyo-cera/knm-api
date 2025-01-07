export interface User {
    id?: number;
    name: string;
    firstname?: string;
    lastname?: string;
    email: string;
    role: string;
    permissions: string;
    type?: string;
    active?: boolean;
    locale?: string;
    password?: string;
    created_at?: string;
  
    }