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

const bookingRepository = {
  findUserBookings,
  findRoomById,
};

export default bookingRepository;
