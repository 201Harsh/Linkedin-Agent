import mongoose from "mongoose";

const ConnectTODB = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGO_URL as string);

    if (connect) {
      console.log("Connected to MongoDB");
    }
  } catch (error) {
    console.log("Error connecting to MongoDB", error);
  }
};

export default ConnectTODB;
