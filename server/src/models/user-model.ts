import {
  Schema as MongooseSchema,
  model,
  Document as MongooseDoc,
} from "mongoose";

export interface IUser extends MongooseDoc {
  linkedinId: string;
  name: string;
  email: string;
  avatar?: string;
  accessToken: string;
}

const userSchema = new MongooseSchema<IUser>(
  {
    linkedinId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    accessToken: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const User = model<IUser>("User", userSchema);
