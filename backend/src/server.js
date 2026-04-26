const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { MongoMemoryServer } = require('mongodb-memory-server-core');
const { Server } = require('socket.io');
const app = require('./app');

dotenv.config();

const PORT = process.env.PORT || 5000;
let mongoMemoryServer = null;

function getAllowedOrigins() {
  return (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: getAllowedOrigins(),
    credentials: true
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join-user-room', (userId) => {
    if (userId) socket.join(`user:${userId}`);
  });

  socket.on('disconnect', () => {
    // handled automatically
  });
});

async function getMongoUri() {
  if (process.env.USE_IN_MEMORY_DB === 'true') {
    mongoMemoryServer = await MongoMemoryServer.create();
    const mongoUri = mongoMemoryServer.getUri();
    console.log('Using in-memory MongoDB for local development');
    return mongoUri;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set. Add it to backend/.env or enable USE_IN_MEMORY_DB=true.');
  }

  return process.env.MONGO_URI;
}

async function shutdown() {
  await mongoose.connection.close().catch(() => {});

  if (mongoMemoryServer) {
    await mongoMemoryServer.stop().catch(() => {});
  }
}

async function startServer() {
  try {
    const mongoUri = await getMongoUri();
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');

    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Startup error:', error.message);
    await shutdown();
    process.exit(1);
  }
}

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, async () => {
    await shutdown();
    process.exit(0);
  });
});

startServer();
