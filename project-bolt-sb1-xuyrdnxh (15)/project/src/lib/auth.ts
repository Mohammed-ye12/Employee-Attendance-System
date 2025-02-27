import { supabase } from './supabase';
import type { Employee } from '../types';

// Get device ID using browser fingerprint
function getDeviceId(): string {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  return btoa(`${userAgent}-${platform}-${screenResolution}`);
}

// Check if device has already registered an employee
async function checkDeviceRegistration() {
  try {
    const deviceId = getDeviceId();
    const { data, error } = await supabase
      .from('device_registrations')
      .select('employee_id')
      .eq('device_id', deviceId)
      .maybeSingle();

    if (error) {
      console.error('Error checking device registration:', error);
      return null;
    }

    return data?.employee_id;
  } catch (error) {
    console.error('Error checking device registration:', error);
    return null;
  }
}

// Save device registration
async function saveDeviceRegistration(employeeId: string) {
  try {
    const deviceId = getDeviceId();
    
    // First check if device registration exists
    const { data: existing } = await supabase
      .from('device_registrations')
      .select('id')
      .eq('device_id', deviceId)
      .maybeSingle();

    if (existing) {
      // Update existing registration
      const { error } = await supabase
        .from('device_registrations')
        .update({
          employee_id: employeeId,
          last_login: new Date().toISOString()
        })
        .eq('device_id', deviceId);

      if (error) throw error;
    } else {
      // Create new registration
      const { error } = await supabase
        .from('device_registrations')
        .insert([{
          device_id: deviceId,
          employee_id: employeeId,
          last_login: new Date().toISOString()
        }]);

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error saving device registration:', error);
    throw error;
  }
}

// Update device last login
async function updateDeviceLastLogin(employeeId: string) {
  try {
    const deviceId = getDeviceId();
    await supabase
      .from('device_registrations')
      .upsert({
        device_id: deviceId,
        employee_id: employeeId,
        last_login: new Date().toISOString()
      }, {
        onConflict: 'device_id'
      });
  } catch (error) {
    console.error('Error updating device last login:', error);
  }
}

export async function checkExistingEmployee(employeeId: string) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', employeeId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking existing employee:', error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error checking existing employee:', error);
    return null;
  }
}

export async function registerEmployee(employeeData: {
  id: string;
  fullName: string;
  department: string;
  section?: string;
}) {
  try {
    // First check if employee already exists
    const existingEmployee = await checkExistingEmployee(employeeData.id);
    if (existingEmployee) {
      return {
        success: false,
        error: { message: 'Employee ID already exists' },
        profile: existingEmployee
      };
    }

    // Create new profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: employeeData.id,
        full_name: employeeData.fullName,
        department: employeeData.department,
        section: employeeData.section,
        role: 'employee',
        is_approved: false
      }])
      .select()
      .single();

    if (profileError) {
      throw profileError;
    }

    if (!profile) {
      throw new Error('Failed to create profile');
    }

    // Save device registration
    await saveDeviceRegistration(employeeData.id);

    return {
      success: true,
      profile
    };
  } catch (error) {
    console.error('Error in registration:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred during registration'
      }
    };
  }
}

export async function autoLogin() {
  try {
    // Check device registration
    const registeredEmployeeId = await checkDeviceRegistration();
    if (!registeredEmployeeId) {
      return null;
    }

    // Get profile data
    const profile = await checkExistingEmployee(registeredEmployeeId);
    if (profile) {
      await updateDeviceLastLogin(registeredEmployeeId);
    }

    return profile;
  } catch (error) {
    console.error('Auto-login error:', error);
    return null;
  }
}