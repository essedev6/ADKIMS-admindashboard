import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
});

let User;

if (mongoose.models.User) {
  User = mongoose.models.User;
} else {
  User = mongoose.model('User', UserSchema);
}

export default User;