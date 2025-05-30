// server/routes/taskRoutes.js
import express from "express";
import mongoose from "mongoose";
import Task from "../models/taskModel.js";
import Employee from "../models/Employee.js";

const router = express.Router();

// Assign a new task
console.log("Assign Task API called");
router.post("/assign", async (req, res) => {
  try {
    console.log(req.body);
    const { heading, description, assignedTo, dueDate, category } = req.body;

    if (!heading || !description || !assignedTo || !dueDate || !category) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const task = await Task.create({
      heading,
      description,
      assignedTo: new mongoose.Types.ObjectId(assignedTo),
      dueDate,
      category,
      status: "new",
    });

    // Increment the "newTask" count for the assigned employee
    await Employee.findByIdAndUpdate(
      assignedTo,
      { $inc: { "taskCounts.new": 1 }, $push: { tasks: task._id } },
      { new: true }
    );

    // Emit a Socket.IO event to notify the employee
    const io = req.app.get("io");
    if (io) {
      io.to(assignedTo).emit("taskAssigned", { task });
      io.emit("taskAssigned", { task }); // <-- Add this line for admin dashboards
    }

    res.status(201).json(task);
  } catch (err) {
    console.error("Assign Task error:", err); // <-- Add this line
    res
      .status(500)
      .json({ error: "Failed to assign task", details: err.message });
  }
});

// Update task status
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const oldStatus = task.status;
    const employeeId = task.assignedTo;

    // Update the task's status
    task.status = status;
    await task.save();

    // Update the employee's taskCounts
    const update = {};
    if (oldStatus && oldStatus !== status) {
      update[`taskCounts.${oldStatus}`] = -1; // Decrement old status
    }
    if (status && oldStatus !== status) {
      update[`taskCounts.${status}`] = 1; // Increment new status
    }
    if (Object.keys(update).length > 0) {
      await Employee.findByIdAndUpdate(employeeId, { $inc: update });
    }

    // Emit a Socket.IO event to notify the admin dashboard
    const io = req.app.get("io");
    if (io) {
      io.emit("taskStatusUpdated", { employeeId, taskId: id, status });
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: "Failed to update task status" });
  }
});

// Update a task
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { heading, description, dueDate, category } = req.body;

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { heading, description, dueDate, category },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Emit a Socket.IO event to notify the employee
    const io = req.app.get("io");
    if (io) {
      io.to(updatedTask.assignedTo.toString()).emit("taskEdited", {
        taskId: updatedTask._id,
      });
    }

    res.json(updatedTask);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update task", details: err.message });
  }
});

// Delete a task
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findByIdAndDelete(id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const employeeId = task.assignedTo;

    // Decrement the count for the task's current status
    if (task.status) {
      await Employee.findByIdAndUpdate(employeeId, {
        $inc: { [`taskCounts.${task.status}`]: -1 },
        $pull: { tasks: id },
      });
    }

    // Emit a Socket.IO event to notify the employee
    const io = req.app.get("io");
    if (io) {
      io.to(employeeId.toString()).emit("taskDeleted", { taskId: id });
    }

    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to delete task", details: err.message });
  }
});

// Send a task reminder
router.post("/:id/remind", async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id).populate("assignedTo");
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Emit a Socket.IO event to notify the employee
    const io = req.app.get("io");
    if (io) {
      io.to(task.assignedTo._id.toString()).emit("taskReminder", {
        taskId: task._id,
        heading: task.heading,
        dueDate: task.dueDate,
        message: `Reminder: Task "${task.heading}" is due on ${new Date(
          task.dueDate
        ).toLocaleDateString()}`,
      });
    }

    res.json({ success: true, message: "Reminder sent successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to send reminder", details: err.message });
  }
});

export default router;
