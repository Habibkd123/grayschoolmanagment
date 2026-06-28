const mongoose = require("mongoose");
const MONGODB_URI = "mongodb+srv://gkd:gkd785625%40Kd02@cluster0.hxh3fpj.mongodb.net/schools";

async function testReset() {
  try {
    await mongoose.connect(MONGODB_URI);

    // Require model from the project path
    const User = require("./lib/models/User").default;

    const id = "6a3abe82a447b6adb40b61fd";
    const user = await User.findById(id);
    if (!user) {
      console.log("User not found!");
      return;
    }

    console.log("Before reset:", {
      id: user._id,
      plain_password: user.plain_password,
      password_hash: user.password_hash,
      must_change_password: user.must_change_password
    });

    // Simulate reset
    const newPassword = "NewResetPassword123";
    user.password_hash = newPassword;
    user.plain_password = newPassword;
    user.must_change_password = false;

    console.log("Modified user object before save:", {
      plain_password: user.plain_password,
      isModifiedPlain: user.isModified("plain_password"),
      isModifiedHash: user.isModified("password_hash")
    });

    const savedUser = await user.save();
    console.log("After save:", {
      id: savedUser._id,
      plain_password: savedUser.plain_password,
      password_hash: savedUser.password_hash,
      must_change_password: savedUser.must_change_password
    });

    // Fetch again from DB to verify
    const verifiedUser = await User.findById(id).select("+password_hash");
    console.log("Re-fetched from DB:", {
      id: verifiedUser._id,
      plain_password: verifiedUser.plain_password,
      password_hash: verifiedUser.password_hash,
      must_change_password: verifiedUser.must_change_password
    });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

testReset();
