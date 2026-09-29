const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./models/Event');
const User = require('./models/User');

dotenv.config();

const seedEvents = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eventhub');
    console.log('Connected to MongoDB for event seeding...');

    const organizer = await User.findOne({ email: 'organizer@apex.edu' });
    const hod = await User.findOne({ email: 'hod.cse@apex.edu' });
    const principal = await User.findOne({ email: 'principal@apex.edu' });

    if (!organizer || !hod || !principal) {
      console.error('Please run npm run seed first to create default users.');
      process.exit(1);
    }

    const eventsData = [
      {
        title: 'Apex AI & Cloud Summit 2026',
        description: 'Join industry experts from top tech companies for a deep dive into Generative AI, Large Language Models, and scalable cloud architectures. Includes hands-on labs and project showcases.',
        category: 'Technical',
        department: 'Computer Science & Engineering',
        organizer: organizer._id,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 6 * 3600 * 1000),
        registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        venueMode: 'offline',
        venueLocation: 'Main Auditorium, APJ Abdul Kalam Block',
        bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
        capacity: 250,
        registeredCount: 84,
        isPaid: false,
        fee: 0,
        allowedUserTypes: ['internal', 'external'],
        status: 'approved',
        approvals: {
          hod: {
            status: 'approved',
            reviewedBy: hod._id,
            reviewedAt: new Date(Date.now() - 48 * 3600 * 1000),
            remarks: 'Strong technical agenda and industry sponsorship confirmed.'
          },
          principal: {
            status: 'approved',
            reviewedBy: principal._id,
            reviewedAt: new Date(Date.now() - 24 * 3600 * 1000),
            remarks: 'Approved for inter-college participation.'
          }
        },
        tags: ['AI', 'Cloud', 'Machine Learning', 'AWS', 'Python']
      },
      {
        title: 'National Robotics & Autonomous Systems Challenge',
        description: 'Annual inter-college robotics competition featuring line followers, maze solvers, and robot combat leagues. Cash prizes worth $3,000 for top winning teams.',
        category: 'Technical',
        department: 'Computer Science & Engineering',
        organizer: organizer._id,
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        registrationDeadline: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
        venueMode: 'offline',
        venueLocation: 'Indoor Sports Complex & Innovation Arena',
        bannerUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&auto=format&fit=crop&q=80',
        capacity: 120,
        registeredCount: 0,
        isPaid: true,
        fee: 250,
        allowedUserTypes: ['internal', 'external'],
        status: 'pending_hod',
        approvals: {
          hod: { status: 'pending', remarks: '' },
          principal: { status: 'pending', remarks: '' }
        },
        budget: { estimated: 2400, breakdown: 'Arena setup $800, Cash Prizes $1200, Logistics $400' },
        tags: ['Robotics', 'Arduino', 'IoT', 'Hardware', 'Competition']
      },
      {
        title: 'CyberDefend: Advanced Ethical Hacking Workshop',
        description: 'Comprehensive 2-day boot camp covering penetration testing, web application vulnerabilities (OWASP Top 10), and Capture The Flag (CTF) defense strategies.',
        category: 'Workshop',
        department: 'Computer Science & Engineering',
        organizer: organizer._id,
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
        registrationDeadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        venueMode: 'hybrid',
        venueLocation: 'Seminar Hall 3 & Zoom Live',
        bannerUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80',
        capacity: 100,
        registeredCount: 0,
        isPaid: false,
        fee: 0,
        allowedUserTypes: ['internal'],
        status: 'pending_principal',
        approvals: {
          hod: {
            status: 'approved',
            reviewedBy: hod._id,
            reviewedAt: new Date(),
            remarks: 'Curriculum verified with faculty advisory board.'
          },
          principal: { status: 'pending', remarks: '' }
        },
        tags: ['Cybersecurity', 'Ethical Hacking', 'Linux', 'Networking']
      },
      {
        title: 'Tarang: Annual Inter-College Cultural Fiesta',
        description: 'Celebrate music, dance, theater, and creative arts with celebrity performances, battle of the bands, and art exhibitions across the campus.',
        category: 'Cultural',
        department: 'Information Technology',
        organizer: organizer._id,
        startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
        registrationDeadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        venueMode: 'offline',
        venueLocation: 'Open Air Amphitheatre',
        bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
        capacity: 1000,
        registeredCount: 340,
        isPaid: false,
        fee: 0,
        allowedUserTypes: ['internal', 'external'],
        status: 'approved',
        approvals: {
          hod: {
            status: 'approved',
            reviewedBy: hod._id,
            reviewedAt: new Date(),
            remarks: 'Cultural committee verified.'
          },
          principal: {
            status: 'approved',
            reviewedBy: principal._id,
            reviewedAt: new Date(),
            remarks: 'Sanctioned campus-wide.'
          }
        },
        tags: ['Cultural', 'Music', 'Dance', 'Art', 'Fiesta']
      }
    ];

    for (const evt of eventsData) {
      await Event.findOneAndUpdate({ title: evt.title }, evt, { upsert: true, new: true });
      console.log(`Seeded event: ${evt.title} [Status: ${evt.status}]`);
    }

    console.log('✅ Event seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding events failed:', error);
    process.exit(1);
  }
};

seedEvents();
