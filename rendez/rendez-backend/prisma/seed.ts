import { PrismaClient, Gender, Intent } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Rendez database...');

  const profiles = await Promise.all([
    prisma.profile.upsert({
      where: { rezUserId: 'rez_user_001' },
      update: {},
      create: {
        rezUserId: 'rez_user_001', phone: '+919900001111',
        name: 'Priya', age: 26, gender: Gender.FEMALE,
        interestedIn: [Gender.MALE], intent: Intent.DATING,
        city: 'Mumbai', lat: 19.076, lng: 72.877,
        photos: [], bio: 'Coffee lover, foodie, traveller ☕',
        isVerified: true, profileScore: 85, rezSpendScore: 72,
      },
    }),
    prisma.profile.upsert({
      where: { rezUserId: 'rez_user_002' },
      update: {},
      create: {
        rezUserId: 'rez_user_002', phone: '+919900002222',
        name: 'Arjun', age: 29, gender: Gender.MALE,
        interestedIn: [Gender.FEMALE], intent: Intent.DATING,
        city: 'Mumbai', lat: 19.082, lng: 72.882,
        photos: [], bio: 'Startup founder, weekend hiker 🏔️',
        isVerified: true, profileScore: 78, rezSpendScore: 90,
      },
    }),
    prisma.profile.upsert({
      where: { rezUserId: 'rez_user_003' },
      update: {},
      create: {
        rezUserId: 'rez_user_003', phone: '+919900003333',
        name: 'Sara', age: 24, gender: Gender.FEMALE,
        interestedIn: [Gender.MALE, Gender.FEMALE], intent: Intent.FRIENDSHIP,
        city: 'Bangalore', lat: 12.971, lng: 77.594,
        photos: [], bio: 'Design nerd. Always looking for the next great café.',
        isVerified: true, profileScore: 91, rezSpendScore: 65,
      },
    }),
  ]);

  console.log(`✓ Created ${profiles.length} profiles`);

  // Create a match between Priya and Arjun
  const [u1, u2] = [profiles[0].id, profiles[1].id].sort();
  const match = await prisma.match.upsert({
    where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
    update: {},
    create: {
      user1Id: u1, user2Id: u2, intentType: Intent.DATING,
      messageState: { create: {} },
    },
  });

  console.log(`✓ Created match: ${match.id}`);
  console.log('Seed complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
