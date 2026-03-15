
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lloxxpdlgjvecxopazeg.supabase.co';
const supabaseAnonKey = 'sb_publishable_CIl_3iZ_hCaDKZzzgJsA7g_mLjU2rGh';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUsers() {
  const users = [
    { email: 'pm_tester@plannr.io', password: 'TestPass123!', role: 'PM', name: 'PM Tester' },
    { email: 'hod_tester@plannr.io', password: 'TestPass123!', role: 'HoD', name: 'HoD Tester' }
  ];

  for (const user of users) {
    console.log(`Creating user: ${user.email}...`);
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: {
          role: user.role,
          name: user.name,
          avatar: user.name.split(' ').map(n => n[0]).join('').toUpperCase()
        }
      }
    });

    if (error) {
      console.error(`Error creating ${user.email}:`, error.message);
    } else {
      console.log(`Successfully signed up ${user.email}. User ID: ${data.user?.id}`);
    }
  }
}

createTestUsers();
