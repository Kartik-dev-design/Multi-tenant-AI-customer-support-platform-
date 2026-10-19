import { NextFunction, Request, Response } from "express";

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);
// baar baar try catch likhne ki jagah humne ek asyncHandler function bana diya hain jisse hum apne controller ke function ko wrap karenge aur ye function automatically error ko catch karke next middleware me pass kar dega