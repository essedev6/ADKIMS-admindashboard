import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import User from '../../../models/User';

export async function GET() {
  try {
    const client = await clientPromise;
    
    if (!client.connection || !client.connection.db) {
      throw new Error('Database connection not available');
    }
    
    const db = client.connection.db;
    
    const payments = await db.collection("payments")
      .find({ 
        status: 'completed'
      })
      .sort({ createdAt: -1 })
      .toArray();

    const planDurations: { [key: number]: number } = {
      5: 30 * 60 * 1000,
      10: 2 * 60 * 60 * 1000,
      20: 4 * 60 * 60 * 1000,
      30: 7 * 60 * 60 * 1000,
      75: 24 * 60 * 60 * 1000,
      130: 3 * 24 * 60 * 60 * 1000,
      375: 7 * 24 * 60 * 60 * 1000,
      950: 30 * 24 * 60 * 60 * 1000,
    };

    const activeSessions = await Promise.all(payments.map(async payment => {
      const paymentDate = new Date(payment.createdAt);
      const duration = planDurations[payment.amount];

      if (!duration) {
        return null;
      }

      const expiryTime = new Date(paymentDate.getTime() + duration);
      const currentTime = new Date();

      if (expiryTime > currentTime) {
        const remainingTime = expiryTime.getTime() - currentTime.getTime();
        const user = await User.findById(payment.userId).select('username email');

        return {
          userId: payment.userId,
          userName: user ? user.username : 'Unknown',
          userEmail: user ? user.email : 'Unknown',
          amountPaid: payment.amount,
          planDuration: duration,
          paymentDateTime: payment.createdAt,
          expiryTime: expiryTime.toISOString(),
          remainingTime: remainingTime,
          status: payment.status
        };
      }
      return null;
    }));

    const filteredActiveSessions = activeSessions.filter(session => session !== null);
    return NextResponse.json(filteredActiveSessions);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Error fetching payments' }, { status: 500 });
  }
}