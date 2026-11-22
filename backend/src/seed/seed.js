// Run:  npm run seed     (WARNING: wipes users, profiles, scholarships and applications)
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Scholarship = require('../models/Scholarship');
const Application = require('../models/Application');

const day = 24 * 60 * 60 * 1000;
const inDays = (n) => new Date(Date.now() + n * day);

// NOTE: scheme names are real NSP / public schemes, but amounts and eligibility
// rules below are SAMPLE values for demo purposes. Check scholarships.gov.in for official rules.
const scholarships = [
  { title: 'PM-USP Central Sector Scheme (CSSS)', provider: 'Ministry of Education', type: 'merit', amount: 20000,
    description: 'Merit-based support for college and university students. Sample rules for demo.',
    categories: [], maxIncome: 800000, courses: ['Engineering', 'Medical', 'Arts', 'Science', 'Commerce', 'Law', 'Management'], states: [], minMarks: 80,
    prerequisites: ['One Time Registration (OTR) on NSP', 'Aadhaar-seeded bank account'], applyLink: 'https://scholarships.gov.in/', lastDate: inDays(5) },
  { title: 'PM YASASVI (OBC / EBC / DNT)', provider: 'Ministry of Social Justice and Empowerment', type: 'welfare', amount: 75000,
    description: 'Scholarship for OBC, EBC and DNT students. Sample rules for demo.',
    categories: ['OBC'], maxIncome: 250000, courses: ['School', 'Diploma', 'Engineering', 'Arts', 'Science', 'Commerce'], states: [], minMarks: 0,
    prerequisites: ['One Time Registration (OTR) on NSP', 'Caste certificate'], applyLink: 'https://scholarships.gov.in/', lastDate: inDays(40) },
  { title: 'Post Matric Scholarship for SC Students', provider: 'Ministry of Social Justice and Empowerment', type: 'welfare', amount: 60000,
    description: 'Financial assistance for SC students pursuing post-matric courses. Sample rules for demo.',
    categories: ['SC'], maxIncome: 250000, courses: [], states: [], minMarks: 0,
    prerequisites: ['Caste certificate', 'Income certificate'], applyLink: 'https://scholarships.gov.in/', lastDate: inDays(25) },
  { title: 'Post Matric Scholarship for ST Students', provider: 'Ministry of Tribal Affairs', type: 'welfare', amount: 55000,
    description: 'Support for ST students in higher education. Sample rules for demo.',
    categories: ['ST'], maxIncome: 250000, courses: [], states: [], minMarks: 0,
    prerequisites: ['Tribe certificate', 'Income certificate'], applyLink: 'https://scholarships.gov.in/', lastDate: inDays(33) },
  { title: 'AICTE Pragati Scholarship for Girls', provider: 'AICTE', type: 'merit', amount: 50000,
    description: 'Per-year support for girl students in technical education. Sample rules for demo.',
    categories: [], maxIncome: 800000, courses: ['Engineering', 'Diploma', 'Management'], states: [], minMarks: 0,
    prerequisites: ['Admission in AICTE approved institute', 'Income certificate', 'Aadhaar-seeded bank account'], applyLink: 'https://scholarships.gov.in/', lastDate: inDays(2) },
  { title: 'SBI Youth for India Scholarship', provider: 'SBI Foundation', type: 'merit', amount: 40000,
    description: 'Open to all categories with strong academic records. Sample rules for demo.',
    categories: [], maxIncome: null, courses: [], states: [], minMarks: 75,
    prerequisites: ['Latest marksheet'], applyLink: 'https://www.sbifoundation.in/', lastDate: inDays(55) },
  { title: 'Tata Trusts Merit Scholarship', provider: 'Tata Trusts', type: 'merit', amount: 75000,
    description: 'For undergraduate and postgraduate students from low-income families. Sample rules for demo.',
    categories: [], maxIncome: 600000, courses: ['Engineering', 'Medical', 'Science', 'Commerce', 'Postgraduate'], states: [], minMarks: 60,
    prerequisites: ['Income certificate'], applyLink: 'https://www.tatatrusts.org/', lastDate: inDays(80) },
  { title: 'Uttar Pradesh Post Matric Scholarship', provider: 'Government of Uttar Pradesh', type: 'welfare', amount: 30000,
    description: 'State scholarship for students domiciled in Uttar Pradesh. Sample rules for demo.',
    categories: ['General', 'OBC', 'EWS'], maxIncome: 200000, courses: [], states: ['Uttar Pradesh'], minMarks: 50,
    prerequisites: ['Domicile certificate'], applyLink: 'https://scholarship.up.gov.in/', lastDate: inDays(18) },
  { title: 'Bihar Student Credit Support', provider: 'Government of Bihar', type: 'welfare', amount: 25000,
    description: 'Support for Bihar students pursuing higher education. Sample rules for demo.',
    categories: [], maxIncome: 300000, courses: [], states: ['Bihar'], minMarks: 45,
    prerequisites: ['Domicile certificate'], applyLink: 'https://scholarships.gov.in/', lastDate: inDays(28) },
  { title: 'Maharashtra Rajarshi Shahu Maharaj Scholarship', provider: 'Government of Maharashtra', type: 'welfare', amount: 35000,
    description: 'Fee support for eligible students in Maharashtra. Sample rules for demo.',
    categories: ['OBC', 'EWS'], maxIncome: 800000, courses: ['Engineering', 'Medical', 'Management'], states: ['Maharashtra'], minMarks: 50,
    prerequisites: ['Domicile certificate'], applyLink: 'https://scholarships.gov.in/', lastDate: inDays(45) },
  { title: 'Central Sector Scholarship for Medical Aspirants', provider: 'Ministry of Health', type: 'merit', amount: 90000,
    description: 'Merit scholarship for medical students. Sample rules for demo.',
    categories: [], maxIncome: 500000, courses: ['Medical'], states: [], minMarks: 85,
    prerequisites: ['NEET scorecard'], applyLink: 'https://scholarships.gov.in/', lastDate: inDays(60) },
  { title: 'Law Students Excellence Award', provider: 'Bar Council Trust', type: 'merit', amount: 30000,
    description: 'Award for outstanding law students. Sample rules for demo.',
    categories: [], maxIncome: null, courses: ['Law'], states: [], minMarks: 70,
    prerequisites: ['Faculty recommendation letter'], applyLink: 'https://scholarships.gov.in/', lastDate: inDays(35) },
  { title: 'Ishan Uday Special Scholarship (North East)', provider: 'UGC', type: 'welfare', amount: 78000,
    description: 'For students from the North Eastern region. Sample rules for demo.',
    categories: [], maxIncome: 450000, courses: [], states: ['Assam', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Tripura', 'Arunachal Pradesh', 'Sikkim'], minMarks: 60,
    prerequisites: ['Domicile certificate'], applyLink: 'https://scholarships.gov.in/', lastDate: inDays(50) },
  { title: 'PhD Research Fellowship (Sample)', provider: 'Ministry of Education', type: 'merit', amount: 372000,
    description: 'Research fellowship for PhD scholars. Sample rules for demo.',
    categories: [], maxIncome: null, courses: ['PhD'], states: [], minMarks: 65,
    prerequisites: ['Research proposal'], applyLink: 'https://scholarships.gov.in/', lastDate: inDays(70) },
  { title: 'Expired Demo Scholarship', provider: 'Demo Trust', type: 'merit', amount: 10000,
    description: 'Already closed. Used to demonstrate expired filtering.',
    categories: [], maxIncome: null, courses: [], states: [], minMarks: 0,
    prerequisites: [], applyLink: '', lastDate: inDays(-10) },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.deleteMany(), Profile.deleteMany(), Scholarship.deleteMany(), Application.deleteMany()]);
  await Promise.all([User.syncIndexes(), Profile.syncIndexes(), Scholarship.syncIndexes(), Application.syncIndexes()]);

  const admin = await User.create({ name: 'Admin User', email: 'admin@scholarmatch.test', password: 'Admin@123', role: 'admin' });
  const himanshi = await User.create({ name: 'Himanshi Tanwar', email: 'student@scholarmatch.test', password: 'Student@123' });
  const priya = await User.create({ name: 'Priya Singh', email: 'priya@scholarmatch.test', password: 'Student@123' });
  await User.create({ name: 'Rahul Verma', email: 'rahul@scholarmatch.test', password: 'Student@123' }); // no profile yet

  await Profile.create([
    { user: himanshi._id, category: 'General', income: 400000, course: 'Engineering', state: 'Uttar Pradesh', marks: 92 },
    { user: priya._id, category: 'OBC', income: 180000, course: 'Arts', state: 'Bihar', marks: 71 },
  ]);

  // Scholarship.insertMany skips nothing important here (no hooks), createdBy set for traceability.
  const docs = await Scholarship.insertMany(scholarships.map((s) => ({ ...s, createdBy: admin._id })));
  const by = (t) => docs.find((d) => d.title.startsWith(t));

  await Application.create([
    { user: himanshi._id, scholarship: by('SBI')._id, status: 'bookmarked', history: [{ status: 'bookmarked' }] },
    { user: himanshi._id, scholarship: by('AICTE')._id, status: 'bookmarked', history: [{ status: 'bookmarked' }] }, // closes in 2 days -> triggers a reminder
    { user: himanshi._id, scholarship: by('Tata')._id, status: 'applied', history: [{ status: 'bookmarked' }, { status: 'applied' }] },
    { user: himanshi._id, scholarship: by('PM-USP')._id, status: 'institute_verification', history: [{ status: 'applied' }, { status: 'institute_verification' }] },
    { user: priya._id, scholarship: by('PM YASASVI')._id, status: 'applied', history: [{ status: 'applied' }] },
    { user: priya._id, scholarship: by('Bihar')._id, status: 'sanctioned', history: [{ status: 'applied' }, { status: 'sanctioned' }] },
  ]);

  // ---- extra demo students with back-dated activity, so the admin charts show a real trend ----
  const names = ['Aarav Sharma', 'Diya Patel', 'Kabir Khan', 'Meera Nair', 'Rohan Gupta', 'Sneha Reddy', 'Vikram Yadav', 'Ananya Das', 'Ishaan Roy', 'Tanvi Joshi'];
  const cats = ['General', 'OBC', 'SC', 'ST', 'EWS'];
  const crs = ['Engineering', 'Arts', 'Science', 'Commerce', 'Medical', 'Law'];
  const sts = ['Uttar Pradesh', 'Bihar', 'Maharashtra', 'Assam', 'Rajasthan', 'Kerala'];
  const flow = ['applied', 'institute_verification', 'l2_verification', 'sanctioned', 'paid', 'rejected', 'bookmarked', 'applied'];
  const open = docs.filter((d) => d.lastDate > new Date());
  const ago = (days) => new Date(Date.now() - days * day);
  const backdate = async (Model, id, date) => Model.collection.updateOne({ _id: id }, { $set: { createdAt: date, updatedAt: date } });

  for (let i = 0; i < names.length; i += 1) {
    const joined = ago(5 + i * 17);
    const u = await User.create({ name: names[i], email: `${names[i].split(' ')[0].toLowerCase()}@scholarmatch.test`, password: 'Student@123' });
    await backdate(User, u._id, joined);
    await Profile.create({
      user: u._id, category: cats[i % 5], income: 150000 + i * 60000, course: crs[i % 6], state: sts[(i + 2) % 6], marks: 58 + ((i * 7) % 38),
    });
    for (let k = 0; k < 3; k += 1) {
      const status = flow[(i + k * 3) % flow.length];
      const when = ago(Math.max(1, ((i * 17 + k * 23) % 150) + 1));
      const a = await Application.create({
        user: u._id, scholarship: open[(i + k * 3) % open.length]._id, status,
        history: status === 'bookmarked' ? [{ status }] : [{ status: 'applied' }, { status }],
      });
      await backdate(Application, a._id, when);
    }
  }

  console.log('Seed complete.\n  Admin:   admin@scholarmatch.test / Admin@123\n  Student: student@scholarmatch.test / Student@123\n  Student: priya@scholarmatch.test / Student@123\n  Student (no profile): rahul@scholarmatch.test / Student@123');
  await mongoose.disconnect();
})().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
