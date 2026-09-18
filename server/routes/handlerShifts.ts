import { Router } from 'express';
import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { Permission } from '#enumerators/permission';
import mustHavePermissions from '#middlewares/mustHavePermissions';
import { ShiftModel, type ShiftDocument } from '#models/shift';
import { UserModel } from '#models/user';
import problem from '#problem';

const router = Router();
const shiftInput = z
  .object({
    userId: z.string().refine(isValidObjectId, 'Invalid user'),
    startAt: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
    endAt: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
    status: z.enum(['scheduled', 'completed', 'cancelled']).default('scheduled'),
  })
  .refine((input) => input.endAt > input.startAt, 'End must be after start');

function publicShift(shift: ShiftDocument) {
  return {
    id: shift.id,
    userId: String(shift.userId),
    startAt: shift.startAt.toISOString(),
    endAt: shift.endAt.toISOString(),
    status: shift.status,
    createdAt: shift.createdAt.toISOString(),
    updatedAt: shift.updatedAt.toISOString(),
  };
}

router.get('/users', mustHavePermissions(Permission.ShiftsRead), async (_req, res) => {
  const users = await UserModel.find()
    .select('fullName email phoneNumber')
    .sort({ fullName: 1, email: 1 });
  res.json({
    users: users.map((user) => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
    })),
  });
});

router.get('/', mustHavePermissions(Permission.ShiftsRead), async (_req, res) => {
  const shifts = await ShiftModel.find().sort({ startAt: -1, _id: -1 });
  res.json({ shifts: shifts.map(publicShift) });
});

router.get('/:id', mustHavePermissions(Permission.ShiftsRead), async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    problem(req, res, 404, 'Shift not found');
    return;
  }
  const shift = await ShiftModel.findById(req.params.id);
  if (!shift) {
    problem(req, res, 404, 'Shift not found');
    return;
  }
  res.json({ shift: publicShift(shift) });
});

router.post('/', mustHavePermissions(Permission.ShiftsCreate), async (req, res) => {
  const input = shiftInput.safeParse(req.body);
  if (!input.success) {
    problem(req, res, 400, input.error.issues[0]?.message ?? 'Invalid request');
    return;
  }
  if (!(await UserModel.exists({ _id: input.data.userId }))) {
    problem(req, res, 400, 'User not found');
    return;
  }
  const shift = await ShiftModel.create(input.data);
  res.status(201).json({ shift: publicShift(shift) });
});

router.put('/:id', mustHavePermissions(Permission.ShiftsUpdate), async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    problem(req, res, 404, 'Shift not found');
    return;
  }
  const input = shiftInput.safeParse(req.body);
  if (!input.success) {
    problem(req, res, 400, input.error.issues[0]?.message ?? 'Invalid request');
    return;
  }
  const shift = await ShiftModel.findById(req.params.id);
  if (!shift) {
    problem(req, res, 404, 'Shift not found');
    return;
  }
  if (!(await UserModel.exists({ _id: input.data.userId }))) {
    problem(req, res, 400, 'User not found');
    return;
  }
  shift.set(input.data);
  await shift.save();
  res.json({ shift: publicShift(shift) });
});

router.delete('/:id', mustHavePermissions(Permission.ShiftsDelete), async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    problem(req, res, 404, 'Shift not found');
    return;
  }
  const shift = await ShiftModel.findByIdAndDelete(req.params.id);
  if (!shift) {
    problem(req, res, 404, 'Shift not found');
    return;
  }
  res.status(204).end();
});

export default router;
