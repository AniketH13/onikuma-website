import app from '../server/server.js';
import { connectDB, getMongoStatus } from '../server/db/connect.js';

export default async function handler(req, res) {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://anikethyoju_db_user:4aHQEbNob4cfJAWH@mydatabase.gimb44k.mongodb.net/onikuma_nepal?retryWrites=true&w=majority';
  
  if (!getMongoStatus()) {
    try {
      await connectDB(uri);
    } catch (err) {
      console.warn('Vercel DB initialization note:', err.message);
    }
  }
  
  return app(req, res);
}
