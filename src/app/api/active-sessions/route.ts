import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import mongoose from 'mongoose';

// Define a simple User schema for the admin-dashboard to interact with the backend's User model
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
});

// Fix: Use type assertion to resolve the complex union type error
const User = (mongoose.models.User as mongoose.Model<any>) || 
  mongoose.model('User', UserSchema);

export async function GET() {
  try {
    const client = await clientPromise;
    
    // FIX: Check if database connection exists and get db properly
    if (!client.connection || !client.connection.db) {
      throw new Error('Database connection not available');
    }
    
    const db = client.connection.db; // Now TypeScript knows this is defined
    
    // Only fetch payments with status 'completed'
    const payments = await db.collection("payments")
      .find({ 
        status: 'completed'  // Only get successful payments
      })
      .sort({ createdAt: -1 })
      .toArray();

    const planDurations: { [key: number]: number } = {
      5: 30 * 60 * 1000, // 30 minutes in milliseconds
      10: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
      20: 4 * 60 * 60 * 1000, // 4 hours in milliseconds
      30: 7 * 60 * 60 * 1000, // 7 hours in milliseconds
      75: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      130: 3 * 24 * 60 * 60 * 1000, // 3 days in milliseconds
      375: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      950: 30 * 24 * 60 * 60 * 1000, // 1 month in milliseconds (approx)
    };

    const activeSessions = await Promise.all(payments.map(async payment => {
      const paymentDate = new Date(payment.createdAt);
      const duration = planDurations[payment.amount];

      if (!duration) {
        return null; // Skip if amount doesn't match a plan
      }

      const expiryTime = new Date(paymentDate.getTime() + duration);
      const currentTime = new Date();

      // Only include sessions that are still active (not expired)
      if (expiryTime > currentTime) {
        const remainingTime = expiryTime.getTime() - currentTime.getTime();

        // Fetch user details
        const user = await User.findById(payment.userId).select('username email');

        return {
          userId: payment.userId,
          userName: user ? user.username : 'Unknown',
          userEmail: user ? user.email : 'Unknown',
          amountPaid: payment.amount,
          planDuration: duration, // This will be in milliseconds, convert to readable format later
          paymentDateTime: payment.createdAt,
          expiryTime: expiryTime.toISOString(),
          remainingTime: remainingTime, // This will be in milliseconds, convert to readable format later
          // ADDED: Include payment status for clarity
          status: payment.status
        };
      }
      return null; // Skip expired sessions
    }));

    const filteredActiveSessions = activeSessions.filter(session => session !== null);

    return NextResponse.json(filteredActiveSessions);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Error fetching payments' }, { status: 500 });
  }
}