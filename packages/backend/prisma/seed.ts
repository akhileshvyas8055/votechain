import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Super Admin
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const superAdmin = await prisma.electionOfficer.upsert({
    where: { email: 'admin@votechain.io' },
    update: {},
    create: {
      name: 'System Administrator',
      employeeId: 'ADMIN-001',
      email: 'admin@votechain.io',
      passwordHash: adminPasswordHash,
      role: 'SUPER_ADMIN',
    },
  });
  console.log('✅ Super Admin created');

  // 2. Create Election Commissioner
  const ecPasswordHash = await bcrypt.hash('ec123456', 12);
  const ecMember = await prisma.electionOfficer.upsert({
    where: { email: 'ec@votechain.io' },
    update: {},
    create: {
      name: 'Chief Election Commissioner',
      employeeId: 'EC-001',
      email: 'ec@votechain.io',
      passwordHash: ecPasswordHash,
      role: 'ELECTION_COMMISSIONER',
    },
  });
  console.log('✅ Election Commissioner created');

  // 3. Create Booth Officer
  const boPasswordHash = await bcrypt.hash('booth123', 12);
  const boothOfficer = await prisma.electionOfficer.upsert({
    where: { email: 'officer@votechain.io' },
    update: {},
    create: {
      name: 'Booth Officer 1',
      employeeId: 'BO-001',
      email: 'officer@votechain.io',
      passwordHash: boPasswordHash,
      role: 'BOOTH_OFFICER',
    },
  });
  console.log('✅ Booth Officer created');

  // 4. Create Test Election
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const election = await prisma.election.create({
    data: {
      name: 'General Assembly Elections 2024',
      constituency: 'District-1',
      description: 'Test Election for District 1',
      startTime: tomorrow,
      endTime: nextWeek,
      chainId: 80001,
      createdBy: superAdmin.id,
      status: 'CREATED',
    },
  });
  console.log('✅ Test Election created');

  // 5. Add Candidates
  await prisma.candidate.createMany({
    data: [
      {
        electionId: election.id,
        name: 'John Doe',
        party: 'Democratic Alliance',
        symbol: 'Sun',
        blockchainCandidateId: 1,
        constituency: 'District-1',
        nominationDate: now,
      },
      {
        electionId: election.id,
        name: 'Jane Smith',
        party: 'National Progress',
        symbol: 'Tree',
        blockchainCandidateId: 2,
        constituency: 'District-1',
        nominationDate: now,
      },
    ],
  });
  console.log('✅ Candidates created');

  // 6. Create Test Booth
  await prisma.booth.upsert({
    where: { boothCode: 'B-001' },
    update: {},
    create: {
      boothCode: 'B-001',
      electionId: election.id,
      name: 'Central High School Booth',
      location: 'Main Hall',
      district: 'District-1',
      state: 'State-A',
      officerId: boothOfficer.id,
      machineId: 'EVM-001',
    },
  });
  console.log('✅ Test Booth created');

  console.log('🌱 Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
