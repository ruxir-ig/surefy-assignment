import type { Request, Response } from "express";

export const getEvents = async (req: Request, res: Response) => {
  res.status(200).json({ message: "Event route working ✅" });
};
