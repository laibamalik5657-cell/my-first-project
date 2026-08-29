import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL;
if (!MONGODB_URI) {
    throw new Error("Missing MongoDB connection string. Set MONGODB_URI in .env.local.")
}
type MongooseCache = {
    conn: mongoose.Connection | null,
    promise: Promise<mongoose.Connection> | null
}

const cache: MongooseCache = global.mongoose || { conn: null, promise: null }
if (!global.mongoose) {
    global.mongoose = cache
}

const connectDb = async () => {
    if (cache.conn) {
        return cache.conn
    }
    if (!cache.promise) {
        cache.promise = mongoose.connect(MONGODB_URI).then((conn) => conn.connection)
    }
    try {
        const conn = await cache.promise
        cache.conn = conn
        return conn
    } catch (error) {
        cache.promise = null
        console.error("MongoDB connection error:", error)
        throw error
    }
}
export default connectDb;