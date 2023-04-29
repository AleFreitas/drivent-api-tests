import httpStatus from 'http-status';
import faker from '@faker-js/faker';
import supertest from 'supertest';
import * as jwt from 'jsonwebtoken';
import { TicketStatus } from '.prisma/client';
import { cleanDb, generateValidToken } from '../helpers';
import {
  createBooking,
  createEnrollmentWithAddress,
  createHotel,
  createPayment,
  createRoomFull,
  createRoomWithHotelId,
  createTicket,
  createTicketTypeRemote,
  createTicketTypeWithHotel,
  createUser,
} from '../factories';
import app, { init } from '@/app';
import { prisma } from '@/config';

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe('GET /booking', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.get('/booking');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();

    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('should respond with status 404 when user has no bookings ', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it('should respond with status 200 when user has bookings', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const createdHotel = await createHotel();
      const createdRoom = await createRoomWithHotelId(createdHotel.id);
      const booking = await createBooking(user.id, createdRoom.id);

      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual({
        id: booking.id,
        Room: {
          id: createdRoom.id,
          name: createdRoom.name,
          capacity: createdRoom.capacity,
          hotelId: createdRoom.hotelId,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });
    });
  });
});

describe('POST /booking', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.post('/booking');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();

    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('When token is valid', () => {
    it('should respond with status code 404 when room is nonexistent', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const createdHotel = await createHotel();
      const createdRoom = await createRoomWithHotelId(createdHotel.id);
      const body = { roomId: createdRoom.id + 1 };
      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send(body);
      expect(response.statusCode).toEqual(httpStatus.NOT_FOUND);
    });

    it('should respond with status code 403 when room has no capacity', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const createdHotel = await createHotel();
      const createdRoom = await createRoomWithHotelId(createdHotel.id);
      const body = { roomId: createdRoom.id };

      const user2 = await createUser();
      const user3 = await createUser();
      const user4 = await createUser();
      const booking2 = await createBooking(user2.id, createdRoom.id);
      const booking3 = await createBooking(user3.id, createdRoom.id);
      const booking4 = await createBooking(user4.id, createdRoom.id);

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send(body);
      expect(response.statusCode).toEqual(httpStatus.FORBIDDEN);
    });

    it('should respond with status code 403 when user has no ticket', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);

      const createdHotel = await createHotel();
      const createdRoom = await createRoomWithHotelId(createdHotel.id);
      const body = { roomId: createdRoom.id };

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send(body);
      expect(response.statusCode).toEqual(httpStatus.FORBIDDEN);
    });

    it('should respond with status code 403 when user has an invalid ticket', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const createdHotel = await createHotel();
      const createdRoom = await createRoomWithHotelId(createdHotel.id);
      const body = { roomId: createdRoom.id };

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send(body);

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });

    it('should respond with status 200 and bookingId', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const createdHotel = await createHotel();
      const createdRoom = await createRoomWithHotelId(createdHotel.id);
      const body = { roomId: createdRoom.id };

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send(body);
      expect(response.statusCode).toEqual(httpStatus.OK);
      expect(response.body).toEqual({
        bookingId: expect.any(Number),
      });
    });
  });
});

describe('PUT /booking/:bookingId', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.put('/booking/1');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();

    const response = await server.put('/booking/1').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.put('/booking/1').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  describe('When token is valid', () => {
    it('should respond with status code 404 when bookingId is nonexistent', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const createdHotel = await createHotel();
      const createdRoom = await createRoomWithHotelId(createdHotel.id);
      const body = { roomId: createdRoom.id };

      const response = await server.put(`/booking/0`).set('Authorization', `Bearer ${token}`).send(body);
      expect(response.statusCode).toEqual(httpStatus.NOT_FOUND);
    });

    it('should respond with status code 404 when room is nonexistent', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const createdHotel = await createHotel();
      const createdRoom = await createRoomWithHotelId(createdHotel.id);
      const body = { roomId: createdRoom.id + 1 };
      const booking = await createBooking(user.id, createdRoom.id);

      const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send(body);
      expect(response.statusCode).toEqual(httpStatus.NOT_FOUND);
    });

    it('should respond with status code 403 when room has no capacity', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const createdHotel = await createHotel();
      const createdRoom = await createRoomWithHotelId(createdHotel.id);
      const createdRoom2 = await createRoomWithHotelId(createdHotel.id);
      const body = { roomId: createdRoom2.id };
      const booking = await createBooking(user.id, createdRoom.id);
      const user2 = await createUser();
      const user3 = await createUser();
      const user4 = await createUser();
      const booking2 = await createBooking(user2.id, createdRoom2.id);
      const booking3 = await createBooking(user3.id, createdRoom2.id);
      const booking4 = await createBooking(user4.id, createdRoom2.id);

      const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send(body);
      expect(response.statusCode).toEqual(httpStatus.FORBIDDEN);
    });

    it('should respond with status code 200 and bookingId', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const createdHotel = await createHotel();
      const createdRoom = await createRoomWithHotelId(createdHotel.id);
      const createdRoom2 = await createRoomWithHotelId(createdHotel.id);
      const body = { roomId: createdRoom2.id };
      const booking = await createBooking(user.id, createdRoom.id);

      const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send(body);
      expect(response.statusCode).toEqual(httpStatus.OK);
      expect(response.body).toEqual({
        bookingId: expect.any(Number),
      });
    });
  });
});
