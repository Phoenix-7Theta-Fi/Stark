import { ObjectId } from 'mongodb';

export enum UserRole {
  USER = 'user',
  PRACTITIONER = 'practitioner'
}

export interface User {
  _id: ObjectId;
  email: string;
  password: string;
  name?: string;
  role: UserRole;
}