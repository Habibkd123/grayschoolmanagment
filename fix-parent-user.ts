import mongoose from "mongoose";
import User from "./lib/models/User";
import { Parent } from "./lib/models";
import dotenv from "dotenv";

dotenv.config();

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected to DB");

  const parentsWithoutUser = await Parent.find({ user_id: null, email: { $exists: true, $ne: null } });
  console.log(`Found ${parentsWithoutUser.length} parents without user_id`);

  for (const parent of parentsWithoutUser) {
    if (!parent.email) continue;
    
    // check if user exists
    let user = await User.findOne({ email: parent.email.toLowerCase(), school_id: parent.school_id });
    if (!user) {
      user = await User.create({
        school_id: parent.school_id,
        name: parent.name,
        email: parent.email.toLowerCase(),
        role: "parent",
        password_hash: "Parent@123",
      });
      console.log(`Created user for ${parent.email}`);
    }
    
    parent.user_id = user._id;
    await parent.save();
    console.log(`Linked user ${user._id} to parent ${parent._id}`);
  }

  console.log("Done");
  process.exit(0);
}

fix().catch(console.error);
