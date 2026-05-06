import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data - using simple loops to avoid transaction requirements on non-replica set MongoDB
  try {
    console.log('🧹 Clearing existing data...');
    const collections = ['drillAttendance', 'taskComment', 'safetyDrill', 'maintenanceTask', 'user', 'ship'] as const;
    for (const collection of collections) {
      // @ts-ignore
      await prisma[collection].deleteMany({});
    }
  } catch (error) {
    console.warn('⚠️ Warning: Some data could not be cleared initially, proceeding with seed...', error);
  }

  // Create Ships
  const ship1 = await prisma.ship.create({
    data: {
      name: 'MV Pacific Mariner',
      imoNumber: 'IMO9234567',
      type: 'Bulk Carrier',
      flag: 'Panama',
      builtYear: 2015,
      grossTonnage: 45200,
    },
  });

  const ship2 = await prisma.ship.create({
    data: {
      name: 'MV Atlantic Explorer',
      imoNumber: 'IMO9876543',
      type: 'Container Ship',
      flag: 'Liberia',
      builtYear: 2018,
      grossTonnage: 72500,
    },
  });

  const ship3 = await prisma.ship.create({
    data: {
      name: 'MV Nordic Star',
      imoNumber: 'IMO9112358',
      type: 'Tanker',
      flag: 'Marshall Islands',
      builtYear: 2012,
      grossTonnage: 38900,
    },
  });

  console.log('✅ Ships created');

  // Create Admin
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@fathommarine.com',
      password: adminPassword,
      name: 'Captain James Rodriguez',
      role: 'ADMIN',
    },
  });

  // Create Crew for Ship 1
  const crew1Password = await bcrypt.hash('crew123', 12);
  const crew1 = await prisma.user.create({
    data: {
      email: 'john.smith@fathommarine.com',
      password: crew1Password,
      name: 'John Smith',
      role: 'CREW',
      shipId: ship1.id,
    },
  });

  const crew2 = await prisma.user.create({
    data: {
      email: 'maria.garcia@fathommarine.com',
      password: crew1Password,
      name: 'Maria Garcia',
      role: 'CREW',
      shipId: ship1.id,
    },
  });

  // Create Crew for Ship 2
  const crew3 = await prisma.user.create({
    data: {
      email: 'david.chen@fathommarine.com',
      password: crew1Password,
      name: 'David Chen',
      role: 'CREW',
      shipId: ship2.id,
    },
  });

  const crew4 = await prisma.user.create({
    data: {
      email: 'sarah.wilson@fathommarine.com',
      password: crew1Password,
      name: 'Sarah Wilson',
      role: 'CREW',
      shipId: ship2.id,
    },
  });

  // Create Crew for Ship 3
  const crew5 = await prisma.user.create({
    data: {
      email: 'ahmed.hassan@fathommarine.com',
      password: crew1Password,
      name: 'Ahmed Hassan',
      role: 'CREW',
      shipId: ship3.id,
    },
  });

  console.log('✅ Users created');

  // ─── Maintenance Tasks ───────────────────────────────────────────────────
  const now = new Date();
  const pastDate = (days: number) => new Date(now.getTime() - days * 86400000);
  const futureDate = (days: number) => new Date(now.getTime() + days * 86400000);

  // Ship 1 Tasks
  const task1 = await prisma.maintenanceTask.create({
    data: {
      title: 'Engine Room Inspection',
      description: 'Full inspection of main engine, auxiliary engines, and associated systems',
      status: 'COMPLETED',
      priority: 'HIGH',
      dueDate: pastDate(10),
      completedAt: pastDate(12),
      shipId: ship1.id,
      assignedToId: crew1.id,
      createdById: admin.id,
    },
  });

  const task2 = await prisma.maintenanceTask.create({
    data: {
      title: 'Hull Cleaning and Inspection',
      description: 'Underwater hull cleaning and anti-fouling paint inspection',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      dueDate: futureDate(5),
      shipId: ship1.id,
      assignedToId: crew2.id,
      createdById: admin.id,
    },
  });

  const task3 = await prisma.maintenanceTask.create({
    data: {
      title: 'Fire Suppression System Check',
      description: 'Test all fire suppression systems, extinguishers, and detection sensors',
      status: 'PENDING',
      priority: 'CRITICAL',
      dueDate: pastDate(3), // OVERDUE
      isOverdue: true,
      shipId: ship1.id,
      assignedToId: crew1.id,
      createdById: admin.id,
    },
  });

  // Ship 2 Tasks
  const task4 = await prisma.maintenanceTask.create({
    data: {
      title: 'Navigation Equipment Calibration',
      description: 'Calibrate GPS, radar, and AIS systems',
      status: 'COMPLETED',
      priority: 'HIGH',
      dueDate: pastDate(5),
      completedAt: pastDate(6),
      shipId: ship2.id,
      assignedToId: crew3.id,
      createdById: admin.id,
    },
  });

  const task5 = await prisma.maintenanceTask.create({
    data: {
      title: 'Lifeboat Maintenance',
      description: 'Inspect and test all lifeboats, davits, and release mechanisms',
      status: 'PENDING',
      priority: 'CRITICAL',
      dueDate: futureDate(3),
      shipId: ship2.id,
      assignedToId: crew4.id,
      createdById: admin.id,
    },
  });

  const task6 = await prisma.maintenanceTask.create({
    data: {
      title: 'Cargo Hold Inspection',
      description: 'Inspect cargo hold structure, bilge systems, and watertight integrity',
      status: 'PENDING',
      priority: 'MEDIUM',
      dueDate: pastDate(7), // OVERDUE
      isOverdue: true,
      shipId: ship2.id,
      assignedToId: crew3.id,
      createdById: admin.id,
    },
  });

  // Ship 3 Tasks
  const task7 = await prisma.maintenanceTask.create({
    data: {
      title: 'Ballast Water Treatment System',
      description: 'Service and test ballast water management system',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: futureDate(10),
      shipId: ship3.id,
      assignedToId: crew5.id,
      createdById: admin.id,
    },
  });

  const task8 = await prisma.maintenanceTask.create({
    data: {
      title: 'Oil Separator Service',
      description: 'Annual service of oily water separator and bilge pump',
      status: 'PENDING',
      priority: 'MEDIUM',
      dueDate: pastDate(2), // OVERDUE
      isOverdue: true,
      shipId: ship3.id,
      assignedToId: crew5.id,
      createdById: admin.id,
    },
  });

  console.log('✅ Maintenance tasks created');

  // ─── Task Comments ───────────────────────────────────────────────────────
  for (const comment of [
    { content: 'Starting inspection of main engine systems', taskId: task1.id, userId: crew1.id },
    { content: 'Found minor wear on bearing #3, replacement scheduled', taskId: task1.id, userId: crew1.id },
    { content: 'All systems checked and signed off', taskId: task1.id, userId: admin.id },
    { content: 'Hull cleaning in progress, 60% complete', taskId: task2.id, userId: crew2.id },
    { content: 'This task is overdue, please prioritize!', taskId: task3.id, userId: admin.id },
  ]) {
    await prisma.taskComment.create({ data: comment });
  }

  console.log('✅ Task comments created');

  // ─── Safety Drills ───────────────────────────────────────────────────────
  const drill1 = await prisma.safetyDrill.create({
    data: {
      title: 'Monthly Fire Drill - Station Alfa',
      type: 'FIRE_DRILL',
      description: 'Full fire emergency response drill including muster stations and firefighting team deployment',
      status: 'COMPLETED',
      scheduledAt: pastDate(15),
      completedAt: pastDate(15),
      shipId: ship1.id,
      location: 'Engine Room & Main Deck',
      instructions: 'All crew to muster at assigned stations within 5 minutes',
    },
  });

  const drill2 = await prisma.safetyDrill.create({
    data: {
      title: 'Evacuation Drill - Full Ship',
      type: 'EVACUATION',
      description: 'Complete ship evacuation exercise including lifeboat deployment',
      status: 'MISSED',
      scheduledAt: pastDate(5),
      shipId: ship1.id,
      location: 'Full Ship',
    },
  });

  const drill3 = await prisma.safetyDrill.create({
    data: {
      title: 'Man Overboard Recovery',
      type: 'MAN_OVERBOARD',
      description: 'Practice MOB alarm response, rescue boat deployment and recovery procedures',
      status: 'SCHEDULED',
      scheduledAt: futureDate(3),
      shipId: ship1.id,
      location: 'Port Side Deck',
    },
  });

  const drill4 = await prisma.safetyDrill.create({
    data: {
      title: 'Fire Drill - Forward Section',
      type: 'FIRE_DRILL',
      description: 'Fire emergency response for forward cargo holds',
      status: 'COMPLETED',
      scheduledAt: pastDate(20),
      completedAt: pastDate(20),
      shipId: ship2.id,
      location: 'Forward Cargo Holds',
    },
  });

  const drill5 = await prisma.safetyDrill.create({
    data: {
      title: 'Flooding Emergency Drill',
      type: 'FLOODING',
      description: 'Practice flooding emergency response, bilge pump activation, and damage control',
      status: 'SCHEDULED',
      scheduledAt: futureDate(7),
      shipId: ship2.id,
      location: 'Engine Room',
    },
  });

  const drill6 = await prisma.safetyDrill.create({
    data: {
      title: 'Medical Emergency Response',
      type: 'MEDICAL_EMERGENCY',
      description: 'First aid response drill and medevac procedures',
      status: 'MISSED',
      scheduledAt: pastDate(8),
      shipId: ship3.id,
      location: 'Ship\'s Hospital',
    },
  });

  console.log('✅ Safety drills created');

  // ─── Drill Attendances ───────────────────────────────────────────────────
  // Drill 1 (Completed) - both crew members attended
  for (const attendance of [
    { drillId: drill1.id, userId: crew1.id, attended: true, submittedAt: pastDate(15), notes: 'Completed all fire station duties' },
    { drillId: drill1.id, userId: crew2.id, attended: true, submittedAt: pastDate(15), notes: 'Participated in hose team' },
  ]) {
    await prisma.drillAttendance.create({ data: attendance });
  }

  // Drill 2 (Missed) - no attendance
  for (const attendance of [
    { drillId: drill2.id, userId: crew1.id, attended: false },
    { drillId: drill2.id, userId: crew2.id, attended: false },
  ]) {
    await prisma.drillAttendance.create({ data: attendance });
  }

  // Drill 3 (Upcoming)
  for (const attendance of [
    { drillId: drill3.id, userId: crew1.id, attended: false },
    { drillId: drill3.id, userId: crew2.id, attended: false },
  ]) {
    await prisma.drillAttendance.create({ data: attendance });
  }

  // Drill 4 (Completed)
  for (const attendance of [
    { drillId: drill4.id, userId: crew3.id, attended: true, submittedAt: pastDate(20) },
    { drillId: drill4.id, userId: crew4.id, attended: true, submittedAt: pastDate(20), notes: 'All fire suppression demonstrated' },
  ]) {
    await prisma.drillAttendance.create({ data: attendance });
  }

  // Drill 5 (Upcoming)
  for (const attendance of [
    { drillId: drill5.id, userId: crew3.id, attended: false },
    { drillId: drill5.id, userId: crew4.id, attended: false },
  ]) {
    await prisma.drillAttendance.create({ data: attendance });
  }

  // Drill 6 (Missed)
  for (const attendance of [
    { drillId: drill6.id, userId: crew5.id, attended: false },
  ]) {
    await prisma.drillAttendance.create({ data: attendance });
  }

  console.log('✅ Drill attendances created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('   Admin: admin@fathommarine.com / admin123');
  console.log('   Crew 1 (Ship 1): john.smith@fathommarine.com / crew123');
  console.log('   Crew 2 (Ship 1): maria.garcia@fathommarine.com / crew123');
  console.log('   Crew 3 (Ship 2): david.chen@fathommarine.com / crew123');
  console.log('   Crew 4 (Ship 2): sarah.wilson@fathommarine.com / crew123');
  console.log('   Crew 5 (Ship 3): ahmed.hassan@fathommarine.com / crew123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
