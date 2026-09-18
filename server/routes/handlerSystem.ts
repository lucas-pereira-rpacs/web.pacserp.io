import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { Features } from '#enumerators/feature';
import { Permission } from '#enumerators/permission';
import { SystemModel } from '#models/system';
import problem from '#problem';
import mustHavePermissions from '#middlewares/mustHavePermissions';
import storageClient from '#storage/client';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
const container = storageClient.getContainerClient('system');

router.put('/', mustHavePermissions(Permission.SystemUpdate), async (req, res) => {
  const input = z
    .object({
      name: z.string().trim().min(1, 'Name is required').optional(),
      slogan: z.string().trim().optional(),
      features: z.array(z.enum(Features)).optional(),
    })
    .safeParse(req.body);

  if (!input.success) {
    problem(req, res, 400, input.error.issues[0]?.message ?? 'Invalid request');
    return;
  }

  const update: Partial<System> = {};
  if (input.data.name !== undefined) {
    update.name = input.data.name;
  }
  if (input.data.slogan !== undefined) {
    update.slogan = input.data.slogan;
  }
  if (input.data.features !== undefined) {
    update.features = input.data.features;
  }

  const system = await SystemModel.findOneAndUpdate({}, update, {
    new: true,
    runValidators: true,
  }).orFail();

  res.json({
    system: {
      id: system.id,
      name: system.name,
      slogan: system.slogan,
      features: system.features,
    },
  });
});

router.put(
  '/storage/placeholder',
  mustHavePermissions(Permission.SystemUpdate),
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      problem(req, res, 400, 'Image is required');
      return;
    }

    if (!req.file.mimetype.startsWith('image/')) {
      problem(req, res, 400, 'File must be an image');
      return;
    }

    await container.createIfNotExists({ access: 'blob' });
    const blob = container.getBlockBlobClient('placeholder');
    await blob.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype },
    });

    res.json({ storage: { name: 'placeholder', url: blob.url } });
  },
);

router.put(
  '/storage/logo',
  mustHavePermissions(Permission.SystemUpdate),
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      problem(req, res, 400, 'Image is required');
      return;
    }

    if (!req.file.mimetype.startsWith('image/')) {
      problem(req, res, 400, 'File must be an image');
      return;
    }

    await container.createIfNotExists({ access: 'blob' });
    const blob = container.getBlockBlobClient('logo');
    await blob.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype },
    });

    res.json({ storage: { name: 'logo', url: blob.url } });
  },
);

export default router;
