const mongoose = require("mongoose");

async function buildIndexes() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/school-management");
    console.log("Connected. Syncing indexes for Student model...");
    
    // We can just require the compiled model or define a quick dummy one to call syncIndexes on the collection
    const studentSchema = new mongoose.Schema({});
    // Add the indexes we just added
    studentSchema.index({ school_id: 1, name: 1 });
    studentSchema.index({ name: 1 });
    const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);
    
    await Student.syncIndexes();
    console.log("Indexes synced successfully.");
  } catch (err) {
    console.error("Error syncing indexes:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

buildIndexes();
