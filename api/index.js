import app from '../server/server.js';
import { connectDB } from '../server/db/connect.js';

let initialized = false;

export default async function handler(req, res) {
  if (!initialized) {
    initialized = true;
    const uri = process.env.MONGODB_URI || 'mongodb+srv://anikethyoju_db_user:4aHQEbNob4cfJAWH@mydatabase.gimb44k.mongodb.net/onikuma_nepal?retryWrites=true&w=majority';
    try {
      await connectDB(uri);
    } catch (err) {
      console.warn('Vercel DB initialization note:', err.message);
    }
  }
  return app(req, res);
}
