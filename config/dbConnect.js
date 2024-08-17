import mongoose from 'mongoose';

export const dbConnect = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URL)
    
        if(conn.connection.readyState === 1) console.log('Connect to MongooseDB')
        else console.log('DB Connecting')
    } catch (error) {
        console.log('Cannot Connect')
        throw new Error(error)
    }
}

