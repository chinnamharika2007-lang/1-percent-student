import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client;
try {
    client = createClient(supabaseUrl, supabaseAnonKey);
} catch (error) {
    console.warn("Supabase is not configured yet. The app will run in local-only mode.");
    // Dummy client to prevent crashes
    client = {
        auth: {
            getSession: async () => ({ data: { session: null } }),
            signUp: async () => { throw new Error("Please add your Supabase credentials in .env"); },
            signInWithPassword: async () => { throw new Error("Please add your Supabase credentials in .env"); },
            signOut: async () => ({})
        },
        from: () => ({
            select: () => ({ 
                eq: () => ({ 
                    single: async () => ({ data: null }), 
                    order: async () => ({ data: [] }) 
                }),
                order: async () => ({ data: [] })
            }),
            insert: () => ({ select: async () => ({ data: null }) }),
            update: () => ({ eq: async () => ({}) }),
            delete: () => ({ eq: async () => ({}) })
        })
    };
}

export const supabase = client;
