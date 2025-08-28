import mongoose from 'mongoose';
import {env} from '../config/env.js';

export async function connectMongo(){
    const url = env.mongoUri;
    if (!url) throw new Error('MONGODB_URI is required');
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {autoIndex: true});
    console.log('[DB] Connected to mongo')


}