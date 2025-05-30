import { useState } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import RichTextDescriptionBox from "../other/RichTextDescriptionBox";

const STATUS_OPTIONS = ["All", "New", "Active", "Completed", "Failed"];

const statusColors = {
  new: "bg-blue-100 border-blue-400",
  newTask: "bg-blue-100 border-blue-400",
  active: "bg-yellow-100 border-yellow-400",
  completed: "bg-green-100 border-green-400",
  failed: "bg-red-100 border-red-400",
};

const statusLabels = {
  new: "New",
  newTask: "New",
  active: "Active",
  completed: "Completed",
  failed: "Failed",
};

const AdminTaskList = ({
  tasks = [],
  onTaskUpdated = () => {},
  onDeleteTasks,
}) => {
  const [editTask, setEditTask] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [deleting, setDeleting] = useState(false);

  // Filter tasks by status and search
  const filteredTasks = tasks.filter((task) => {
    const matchesStatus =
      statusFilter === "All"
        ? true
        : (task.status || "").toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      task.heading.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Handle checkbox toggle
  const handleSelect = (taskId) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  // Handle delete selected (safe, async, robust)
  const handleDeleteSelected = async () => {
    if (selectedTasks.length === 0) return;
    if (typeof onDeleteTasks === "function") {
      setDeleting(true);
      try {
        await onDeleteTasks(selectedTasks);
        setSelectedTasks([]);
      } catch (err) {
        alert("Failed to delete selected tasks.");
      }
      setDeleting(false);
    } else {
      alert("Delete function is not available.");
    }
  };

  // Handle Edit
  const openEdit = (task) => {
    setEditTask(task);
    setEditForm({
      heading: task.heading,
      description: task.description,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      category: task.category,
    });
  };
  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/tasks/${editTask._id}`,
        editForm
      );
      setEditTask(null);
      if (typeof onTaskUpdated === "function") onTaskUpdated();
    } catch (err) {
      console.error("Failed to update task:", err);
      alert("Failed to update task. Please try again.");
    }
  };

  // Handle Delete
  const confirmDelete = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/tasks/${deleteId}`
      );
      setDeleteId(null);
      if (typeof onTaskUpdated === "function") onTaskUpdated();
    } catch (err) {
      console.error("Failed to delete task:", err);
      alert("Failed to delete task. Please try again.");
    }
  };

  // Handle Remind
  const handleRemind = async (task) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/tasks/${task._id}/remind`
      );
      alert("Reminder sent!");
      if (typeof onTaskUpdated === "function") onTaskUpdated();
    } catch (err) {
      console.error("Failed to send reminder:", err);
      alert("Failed to send reminder. Please try again.");
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Assigned Tasks
      </h2>
      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-4 items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />
        <button
          onClick={handleDeleteSelected}
          disabled={selectedTasks.length === 0 || deleting}
          className={`px-4 py-2 rounded text-white ${
            selectedTasks.length === 0 || deleting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {deleting ? "Deleting..." : "Delete Selected"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.length === 0 && (
          <div className="col-span-full text-gray-500 text-center py-8">
            No tasks assigned.
          </div>
        )}
        {filteredTasks.map((task, index) => {
          const status = task.status || "new";
          const color = statusColors[status] || "bg-gray-100 border-gray-300";
          const label = statusLabels[status] || status;

          return (
            <div
              key={task._id || task.id || index}
              className={`relative min-w-[300px] ${color} border-l-4 p-8 rounded-lg shadow-lg flex flex-col justify-between`}
            >
              {/* Checkbox for multi-select */}
              <input
                type="checkbox"
                checked={selectedTasks.includes(task._id)}
                onChange={() => handleSelect(task._id)}
                className="absolute top-3 left-3 h-5 w-5"
                aria-label="Select task"
              />
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  {task.category || "General"}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    status === "completed"
                      ? "bg-green-500 text-white"
                      : status === "active"
                      ? "bg-yellow-400 text-white"
                      : status === "failed"
                      ? "bg-red-500 text-white"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {label}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">
                {task.heading || "No Heading"}
              </h3>
              <div className="text-sm text-gray-700 mb-3"></div>
              <div className="flex justify-between items-center text-xs text-gray-500 mt-auto">
                <span>
                  Due:{" "}
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : "N/A"}
                </span>
                <span>
                  Task ID:{" "}
                  <span className="font-mono">
                    {task._id?.toString().slice(-6) || "N/A"}
                  </span>
                </span>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className="bg-yellow-500 text-white px-3 py-1 rounded text-xs"
                  onClick={() => openEdit(task)}
                >
                  Edit
                </button>
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded text-xs"
                  onClick={() => setDeleteId(task._id)}
                >
                  Delete
                </button>
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded text-xs"
                  onClick={() => handleRemind(task)}
                >
                  Send a Reminder
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editTask && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <form
            onSubmit={submitEdit}
            className="bg-white p-6 rounded shadow-lg w-full max-w-md"
          >
            <h3 className="text-lg font-bold mb-4">Edit Task</h3>
            <input
              type="text"
              name="heading"
              value={editForm.heading}
              onChange={handleEditChange}
              placeholder="Heading"
              className="w-full mb-2 p-2 border rounded"
              required
            />
            <RichTextDescriptionBox
              value={editForm.description}
              onChange={(val) => setEditForm({ ...editForm, description: val })}
            />
            <input
              type="date"
              name="dueDate"
              value={editForm.dueDate}
              onChange={handleEditChange}
              className="w-full mb-2 p-2 border rounded"
              required
            />
            <input
              type="text"
              name="category"
              value={editForm.category}
              onChange={handleEditChange}
              placeholder="Category"
              className="w-full mb-2 p-2 border rounded"
              required
            />
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>
              <button
                type="button"
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setEditTask(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-xs">
            <h3 className="text-lg font-bold mb-4">Delete Task?</h3>
            <p className="mb-4">Are you sure you want to delete this task?</p>
            <div className="flex gap-2">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded"
                onClick={confirmDelete}
              >
                Delete
              </button>
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

AdminTaskList.propTypes = {
  tasks: PropTypes.array,
  onTaskUpdated: PropTypes.func,
  onDeleteTasks: PropTypes.func,
};

export default AdminTaskList;
