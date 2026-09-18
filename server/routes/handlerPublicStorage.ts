import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import storageClient from '#storage/client';
import problem from '#problem';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
const container = storageClient.getContainerClient('public');
const attachmentsFolder = 'attatchements';

function getSafeFileName(fileName: string) {
  const [name = 'file'] = fileName.split(/[\\/]/).reverse();
  const safeName = name.replaceAll(/[^a-zA-Z0-9._-]/g, '-');
  if (safeName.length > 0) {
    return safeName;
  }

  return 'file';
}

router.put('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    problem(req, res, 400, 'File is required');
    return;
  }

  await container.createIfNotExists({ access: 'blob' });
  const name = `${randomUUID()}-${getSafeFileName(req.file.originalname)}`;
  const blobName = `${attachmentsFolder}/${name}`;
  const blob = container.getBlockBlobClient(blobName);
  await blob.uploadData(req.file.buffer, {
    blobHTTPHeaders: { blobContentType: req.file.mimetype },
  });

  res.json({ storage: { name: blobName, url: blob.url } });
});

router.get('/*path', async (req, res) => {
  const blobName = req.params.path.join('/');
  const blob = container.getBlockBlobClient(blobName);
  if (!(await blob.exists())) {
    problem(req, res, 404, 'File not found');
    return;
  }

  const download = await blob.downloadToBuffer();
  const properties = await blob.getProperties();

  res.type(properties.contentType ?? 'application/octet-stream').send(download);
});

export default router;
