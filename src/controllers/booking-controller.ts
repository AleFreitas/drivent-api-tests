import httpStatus from 'http-status';
import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '@/middlewares';
import bookingService from '@/services/booking-service';

export async function getBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const { userId } = req;
  try {
    const bookings = await bookingService.listBooking(userId);
    return res.status(httpStatus.OK).send(bookings);
  } catch (error) {
    next(error);
  }
}
