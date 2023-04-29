import { prisma } from '@/config';

async function findUserBookings(userId: number) {
  return prisma.booking.findFirst({
    where: {
      userId: userId,
    },
  });
}

async function findRoomById(roomId: number) {
  return prisma.room.findFirst({
    where: {
      id: roomId,
    },
  });
}

async function findRoomBookings(roomId: number) {
  return prisma.booking.findMany({
    where: {
      roomId: roomId,
    },
  });
}

async function insertBooking(userId: number, roomId: number) {
  return prisma.booking.create({
    data: {
      userId: userId,
      roomId: roomId,
    },
  });
}

async function updateRoomCapacity(roomId: number, newCapacity: number) {
  return prisma.room.update({
    where: {
      id: roomId,
    },
    data: {
      capacity: newCapacity,
    },
  });
}

async function updateBooking(bookingId: number, newRoomId: number) {
  return prisma.booking.update({
    where: {
      id: bookingId,
    },
    data: {
      roomId: newRoomId,
    },
  });
}

const bookingRepository = {
  findUserBookings,
  findRoomById,
  findRoomBookings,
  insertBooking,
  updateRoomCapacity,
  updateBooking,
};

export default bookingRepository;
