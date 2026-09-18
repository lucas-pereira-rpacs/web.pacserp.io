import { Router } from 'express';
import { SystemModel } from '#models/system';
import problem from '#problem';
import storageClient from '#storage/client';

const router = Router();
const container = storageClient.getContainerClient('system');

router.get('/', async (_req, res) => {
  const system = await SystemModel.findOne().select('name slogan features').orFail();

  res.json({
    system: { name: system.name, slogan: system.slogan, features: system.features },
  });
});

router.get('/storage/logo', async (req, res) => {
  const blob = container.getBlockBlobClient('logo');

  if (!(await blob.exists())) {
    problem(req, res, 404, 'Logo not found');
    return;
  }

  const download = await blob.downloadToBuffer();
  const properties = await blob.getProperties();

  res.type(properties.contentType ?? 'application/octet-stream').send(download);
});

router.get('/storage/placeholder', async (req, res) => {
  const blob = container.getBlockBlobClient('placeholder');

  if (!(await blob.exists())) {
    problem(req, res, 404, 'Placeholder not found');
    return;
  }

  const download = await blob.downloadToBuffer();
  const properties = await blob.getProperties();

  res.type(properties.contentType ?? 'application/octet-stream').send(download);
});

export default router;
