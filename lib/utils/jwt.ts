import jwt, { SignOptions } from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface JWTPayload {
  user_id: string;
  school_id: string | null;
  role: string;
}

export const generateAccessToken = (payload: JWTPayload): string => {
  const options: SignOptions = { expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m" } as SignOptions;
  return jwt.sign(payload, ACCESS_SECRET, options);
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  const options: SignOptions = { expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d" } as SignOptions;
  return jwt.sign(payload, REFRESH_SECRET, options);
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, ACCESS_SECRET) as JWTPayload;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, REFRESH_SECRET) as JWTPayload;
};
