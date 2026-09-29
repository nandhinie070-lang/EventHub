const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const collegeConfig = require('./config/college');

dotenv.config();

const seedUsers = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI is not defined in .env. Cannot seed users.');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for seeding...');

    const defaultUsers = [
      {
        name: 'System Administrator',
        email: `admin@${collegeConfig.domain}`,
        password: 'Admin@123',
        role: 'admin',
        userType: 'internal',
        rollNo: 'EMP-ADM-01',
        department: 'Administration',
        year: 'Staff',
        collegeName: collegeConfig.name,
        isVerified: true,
        isActive: true
      },
      {
        name: 'Dr. Robert Vance',
        email: `principal@${collegeConfig.domain}`,
        password: 'Principal@123',
        role: 'principal',
        userType: 'internal',
        rollNo: 'EMP-PRIN-01',
        department: 'Administration',
        year: 'Faculty',
        collegeName: collegeConfig.name,
        isVerified: true,
        isActive: true
      },
      {
        name: 'Dr. Sarah Jenkins',
        email: `hod.cse@${collegeConfig.domain}`,
        password: 'Hod@123',
        role: 'hod',
        userType: 'internal',
        rollNo: 'EMP-HOD-CSE',
        department: 'Computer Science & Engineering',
        year: 'Faculty',
        collegeName: collegeConfig.name,
        isVerified: true,
        isActive: true
      },
      {
        name: 'Alex Rivera (Event Lead)',
        email: `organizer@${collegeConfig.domain}`,
        password: 'Organizer@123',
        role: 'organizer',
        userType: 'internal',
        rollNo: '21CS102',
        department: 'Computer Science & Engineering',
        year: '3rd Year',
        collegeName: collegeConfig.name,
        isVerified: true,
        isActive: true
      },
      {
        name: 'Rahul Sharma (Student)',
        email: `student@${collegeConfig.domain}`,
        password: 'Student@123',
        role: 'student',
        userType: 'internal',
        rollNo: '22CS045',
        department: 'Computer Science & Engineering',
        year: '2nd Year',
        collegeName: collegeConfig.name,
        isVerified: true,
        isActive: true
      }
    ];

    console.log('\n🌱 Seeding users into database...');

    for (const userData of defaultUsers) {
      const passwordHash = await User.hashPassword(userData.password);

      // Check if user exists
      let user = await User.findOne({ email: userData.email });
      if (user) {
        user.name = userData.name;
        user.passwordHash = passwordHash;
        user.role = userData.role;
        user.userType = userData.userType;
        user.rollNo = userData.rollNo;
        user.department = userData.department;
        user.year = userData.year;
        user.collegeName = userData.collegeName;
        user.isVerified = true;
        user.isActive = true;
        await user.save();
        console.log(`Updated user: ${userData.email} [${userData.role}]`);
      } else {
        await User.create({
          name: userData.name,
          email: userData.email,
          passwordHash,
          role: userData.role,
          userType: userData.userType,
          rollNo: userData.rollNo,
          department: userData.department,
          year: userData.year,
          collegeName: userData.collegeName,
          isVerified: true,
          isActive: true
        });
        console.log(`Created user: ${userData.email} [${userData.role}]`);
      }
    }

    console.log('\n================================================================');
    console.log('🎉 Seeding completed successfully! Default accounts:');
    console.log('----------------------------------------------------------------');
    defaultUsers.forEach(u => {
      console.log(`Role: ${u.role.toUpperCase().padEnd(10)} | Email: ${u.email.padEnd(25)} | Pass: ${u.password}`);
    });
    console.log('================================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedUsers();
