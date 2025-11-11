import mongoose from 'mongoose';
const connectdb= async()=>{
    try {
            const connection= await mongoose.connect(process.env.MONGO_URL);
            console.log("mongodb connected successfully");
        
    } catch (error) {
        console.log("mongodb connection failed",error);
        process.exit(1);
        
    }
}

export default connectdb;