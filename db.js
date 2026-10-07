import { supabase } from './supabase.js';
import { getCurrentUser } from './auth.js';

export async function getUserProfile() {
    const user = getCurrentUser();
    if (!user) return null;
    
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
    if (error) console.error("Error fetching profile", error);
    return data;
}

export async function getDailyGoals() {
    const user = getCurrentUser();
    if (!user) return [];
    
    const { data, error } = await supabase
        .from('daily_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', new Date().toISOString().split('T')[0]);
        
    if (error) console.error("Error fetching goals", error);
    return data || [];
}

export async function saveGoal(text, category) {
    const user = getCurrentUser();
    if (!user) return null;
    
    const { data, error } = await supabase
        .from('daily_goals')
        .insert([{ user_id: user.id, text, category }])
        .select();
        
    if (error) console.error("Error saving goal", error);
    return data ? data[0] : null;
}

export async function toggleGoalCompletion(id, done) {
    const { error } = await supabase
        .from('daily_goals')
        .update({ done })
        .eq('id', id);
        
    if (error) console.error("Error updating goal", error);
}

export async function deleteGoal(id) {
    const { error } = await supabase
        .from('daily_goals')
        .delete()
        .eq('id', id);
        
    if (error) console.error("Error deleting goal", error);
}

export async function saveFocusSession(minutes, mode) {
    const user = getCurrentUser();
    if (!user) return;
    
    await supabase.from('focus_sessions').insert([{
        user_id: user.id,
        duration_minutes: minutes,
        mode
    }]);
    
    // Increment focus minutes in profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('focus_minutes')
        .eq('id', user.id)
        .single();
        
    if (profile) {
        await supabase
            .from('profiles')
            .update({ focus_minutes: profile.focus_minutes + minutes })
            .eq('id', user.id);
    }
}

export async function getSnippets() {
    const user = getCurrentUser();
    if (!user) return [];
    
    const { data, error } = await supabase
        .from('snippets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
    if (error) console.error("Error fetching snippets", error);
    return data || [];
}

export async function saveSnippet(title, tag, code) {
    const user = getCurrentUser();
    if (!user) return null;
    
    const { data, error } = await supabase
        .from('snippets')
        .insert([{ user_id: user.id, title, tag, code }])
        .select();
        
    if (error) console.error("Error saving snippet", error);
    return data ? data[0] : null;
}

export async function deleteSnippetDB(id) {
    const { error } = await supabase
        .from('snippets')
        .delete()
        .eq('id', id);
        
    if (error) console.error("Error deleting snippet", error);
}

export async function savePlatformConnections(connections) {
    const user = getCurrentUser();
    if (!user) return;
    
    // We'll save it to a new 'platforms_data' JSONB column in profiles
    const { error } = await supabase
        .from('profiles')
        .update({ platforms_data: connections })
        .eq('id', user.id);
        
    if (error) console.error("Error updating platforms", error);
}

export async function getPlatformConnections() {
    const user = getCurrentUser();
    if (!user) return {};
    
    const { data, error } = await supabase
        .from('profiles')
        .select('platforms_data')
        .eq('id', user.id)
        .single();
        
    if (error) console.error("Error fetching platforms", error);
    return data?.platforms_data || {};
}
