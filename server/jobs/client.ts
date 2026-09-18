import { MongoBackend } from '@agendajs/mongo-backend';
import { Agenda } from 'agenda';

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error('MONGODB_URI is not set');
}

const agendaClient = new Agenda({
  backend: new MongoBackend({
    address: mongoUri,
    collection: 'agendaJobs',
  }),
  name: 'web.base.io',
});

export default agendaClient;
