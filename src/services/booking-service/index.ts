import { notFoundError } from '@/errors';
import bookingRepository from '@/repositories/booking-repository';

async function listBooking(userId: number) {
  const bookings = await bookingRepository.findUserBookings(userId);
  if (!bookings) throw notFoundError();
  const room = await bookingRepository.findRoomById(bookings.roomId);
  return {
    id: bookings.id,
    Room: room,
  };
}

export default {
  listBooking,
};
