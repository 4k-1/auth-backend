import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../_helpers/db';

export default function authorize(roles: string[] = []) {
  return [
    async (req: any, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }

      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        const account = await db.Account.findByPk(decoded.id);

        if (!account) {
          return res.status(401).json({ message: 'Account not found' });
        }

        if (roles.length && !roles.includes(account.role)) {
          return res.status(403).json({ message: 'Forbidden' });
        }

        req.user = {
          id: account.id,
          role: account.role,
          ownsToken: (token: string) => true
        };
        next();
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }
    }
  ];
}