// College Configuration
const collegeConfig = {
  name: process.env.COLLEGE_NAME || 'Apex Institute of Technology',
  shortName: process.env.COLLEGE_SHORT_NAME || 'AIT',
  domain: process.env.COLLEGE_DOMAIN || 'apex.edu',
  logoUrl: '/assets/college-logo.svg',
  departments: [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication Engineering',
    'Electrical & Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Artificial Intelligence & Data Science',
    'Management Studies (MBA)',
    'Computer Applications (MCA)'
  ],
  years: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
  allowedRoles: ['student', 'organizer', 'hod', 'principal', 'admin'],
  allowedUserTypes: ['internal', 'external']
};

module.exports = collegeConfig;
