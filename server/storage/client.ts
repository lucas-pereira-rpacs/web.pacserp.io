import { BlobServiceClient } from '@azure/storage-blob';

let connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

if (!connectionString && process.env.NODE_ENV !== 'production') {
  connectionString = 'UseDevelopmentStorage=true';
}

if (!connectionString) {
  throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set');
}

const storageClient = BlobServiceClient.fromConnectionString(connectionString);

export default storageClient;
