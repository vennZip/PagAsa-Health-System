import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is not configured.");
    }

    await mongoose.connect(mongoUri);

    console.log("MongoDB connected successfully!");
    console.log("Connected database:", mongoose.connection.name);
    
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
