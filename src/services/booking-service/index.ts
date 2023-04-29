import { forbiddenOperationError, notFoundError } from '@/errors';
import bookingRepository from '@/repositories/booking-repository';
import enrollmentRepository from '@/repositories/enrollment-repository';
import ticketsRepository from '@/repositories/tickets-repository';

async function roomCapacityCheck(roomId: number) {
  const room = await bookingRepository.findRoomById(roomId);
  if (!room) throw notFoundError();
  if (room.capacity === 0) throw forbiddenOperationError();
  const roomBookings = await bookingRepository.findRoomBookings(roomId);
  if (roomBookings.length >= room.capacity) throw forbiddenOperationError();
}

async function listBooking(userId: number) {
  const bookings = await bookingRepository.findUserBookings(userId);
  if (!bookings) throw notFoundError();
  const room = await bookingRepository.findRoomById(bookings.roomId);
  return {
    id: bookings.id,
    Room: room,
  };
}

async function createBooking(userId: number, roomId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) throw forbiddenOperationError();
  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);

  if (!ticket || ticket.status === 'RESERVED' || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
    throw forbiddenOperationError();
  }
  await roomCapacityCheck(roomId);
  const booking = await bookingRepository.insertBooking(userId, roomId);
  return {
    bookingId: booking.id,
  };
}

async function updateBooking(userId: number, roomId: number) {
  const bookings = await bookingRepository.findUserBookings(userId);
  if (!bookings) throw notFoundError();
  const room = await bookingRepository.findRoomById(roomId);
  if (!room) throw notFoundError();
  if (room.capacity === 0) throw forbiddenOperationError();
  const roomBookings = await bookingRepository.findRoomBookings(roomId);
  if (roomBookings.length >= room.capacity) throw forbiddenOperationError();
  await bookingRepository.updateBooking(bookings.id, roomId);
  return {
    bookingId: bookings.id,
  };
}

export default {
  listBooking,
  createBooking,
  updateBooking,
};
