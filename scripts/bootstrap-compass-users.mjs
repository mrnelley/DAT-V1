import { createClient } from '@supabase/supabase-js';
import { compassUserDirectory } from './compass-user-directory.mjs';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const initialPassword = process.env.COMPASS_INITIAL_PASSWORD;
const resetExistingPasswords = process.env.COMPASS_RESET_EXISTING_PASSWORDS === 'true';
const authDomain = 'auth.hdcweb.org';

if (!supabaseUrl || !serviceRoleKey || !initialPassword) {
  throw new Error(
    'Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and COMPASS_INITIAL_PASSWORD before bootstrapping users.',
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const unwrap = async (promise) => {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
};

const initialsFor = (name) => (
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
);

const displayNameFor = (entry) => (
  [entry.firstName, entry.lastName].filter(Boolean).join(' ')
);

const authEmailFor = (entry) => `${entry.username}@${authDomain}`;

const loadAuthUsers = async () => {
  const users = [];
  let page = 1;

  while (true) {
    const data = await unwrap(supabase.auth.admin.listUsers({ page, perPage: 1000 }));
    users.push(...data.users);
    if (data.users.length < 1000) return users;
    page += 1;
  }
};

const organization = await unwrap(
  supabase
    .from('organizations')
    .select('id')
    .eq('slug', 'hdc-midatlantic')
    .single(),
);
const departments = await unwrap(
  supabase
    .from('departments')
    .select('id,name')
    .eq('organization_id', organization.id),
);
const departmentIds = new Map(departments.map((department) => [department.name, department.id]));
const authUsers = await loadAuthUsers();
const authUsersByEmail = new Map(
  authUsers.map((user) => [user.email?.toLowerCase(), user]),
);
const authUsersByUsername = new Map(
  authUsers
    .map((user) => [
      user.user_metadata?.username || user.app_metadata?.compass_username,
      user,
    ])
    .filter(([username]) => username),
);
const authUsersByFullName = new Map(
  authUsers
    .map((user) => [user.user_metadata?.full_name, user])
    .filter(([fullName]) => fullName),
);
const profiles = await unwrap(
  supabase
    .from('profiles')
    .select('id,username')
    .eq('organization_id', organization.id),
);
const profileIdsByUsername = new Map(
  profiles.filter((profile) => profile.username).map((profile) => [profile.username, profile.id]),
);
const authUsersById = new Map(authUsers.map((user) => [user.id, user]));

for (const entry of compassUserDirectory) {
  const displayName = displayNameFor(entry);
  const authEmail = authEmailFor(entry);
  const departmentId = departmentIds.get(entry.department);
  if (!departmentId) {
    throw new Error(`Department not found for ${displayName}: ${entry.department}`);
  }

  let authUser = authUsersByUsername.get(entry.username)
    || authUsersByEmail.get(authEmail)
    || authUsersById.get(profileIdsByUsername.get(entry.username))
    || authUsersByFullName.get(displayName);
  let action = 'updated';

  if (!authUser) {
    const data = await unwrap(supabase.auth.admin.createUser({
      app_metadata: { compass_managed: true, compass_username: entry.username },
      email: authEmail,
      email_confirm: true,
      password: initialPassword,
      user_metadata: {
        contact_email: entry.email,
        first_name: entry.firstName,
        full_name: displayName,
        last_name: entry.lastName,
        username: entry.username,
      },
    }));
    authUser = data.user;
    action = 'created';
  } else {
    const attributes = {
      app_metadata: { ...authUser.app_metadata, compass_managed: true, compass_username: entry.username },
      email: authEmail,
      email_confirm: true,
      user_metadata: {
        ...authUser.user_metadata,
        contact_email: entry.email,
        first_name: entry.firstName,
        full_name: displayName,
        last_name: entry.lastName,
        username: entry.username,
      },
    };
    if (resetExistingPasswords) attributes.password = initialPassword;
    const data = await unwrap(
      supabase.auth.admin.updateUserById(authUser.id, attributes),
    );
    authUser = data.user;
    action = resetExistingPasswords ? 'updated and password reset' : 'updated';
  }

  await unwrap(
    supabase
      .from('profiles')
      .upsert({
        dashboard_focus: entry.dashboardFocus,
        department_id: departmentId,
        display_name: displayName,
        email: entry.email,
        first_name: entry.firstName,
        full_name: displayName,
        id: authUser.id,
        initials: initialsFor(displayName),
        last_name: entry.lastName,
        is_active: true,
        is_admin: Boolean(entry.isAdmin),
        must_reset_password: true,
        organization_id: organization.id,
        primary_dashboard: entry.primaryDashboard
          || (entry.workingGroup === 'ELT' ? 'company' : 'individual'),
        role_title: entry.role,
        teams: entry.teams,
        username: entry.username,
        working_group: entry.workingGroup,
      }, { onConflict: 'id' }),
  );

  console.log(`${action}: ${displayName} <${entry.username}>`);
}

console.log(`Compass user bootstrap complete: ${compassUserDirectory.length} accounts.`);
