import { config } from 'dotenv';
import { Schema, model, Document } from 'mongoose';
import Cryptr from 'cryptr';

config();

const { CRYPTR_SECRET } = process.env;
const cryptr = new Cryptr(CRYPTR_SECRET as string);

interface User extends Document {
  name: string;
  userId: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  phone: string | null;
  status: 'active' | 'inactive';
  token: string | null;
  otp: string | null;
  notifications?: any[];
}

const userSchema = new Schema<User>(
  {
    name: {
      type: String,
      minlength: 3,
      maxlength: 30,
    },
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 4,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
      required: true,
    },
    phone: {
      type: String,
      minlength: 10,
      maxlength: 10,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    token: {
      type: String,
      default: null,
    },
    otp: {
      type: String,
      default: null,
      minlength: 4,
      maxlength: 4,
    },
    notifications: {
      type: Array,
      default: [],
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

userSchema.statics.findUserByCredentials = async (email: string, password: string) => {
  try {
    if (!email || !password) {
      return {
        status: false,
        message: 'Please provide all the required fields',
        data: null,
      };
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return {
        status: false,
        message: 'User not found!',
        data: null,
      };
    }
    const isValid = cryptr.decrypt(user.password) === password;
    if (!isValid) {
      return {
        status: false,
        message: 'Invalid credentials',
        data: null,
      };
    }
    return {
      status: true,
      message: 'User found',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    };
  } catch (err: any) {
    console.log(err);
    return {
      status: false,
      message: err.message,
      data: null,
    };
  }
};

const User = model<User>('user', userSchema);

export default User;
