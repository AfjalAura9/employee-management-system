import React from "react";

const NewTask = ({ data, updateTaskStatus }) => {
  return (
    <div className="min-w-[300px] bg-blue-100 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <span className="bg-blue-300 text-blue-900 px-4 py-1 rounded-full text-sm font-medium">
          {data.category}
        </span>
        <span className="text-sm text-gray-600">
          {data.dueDate ? new Date(data.dueDate).toLocaleDateString() : ""}
        </span>
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{data.title}</h3>
      <p className="text-sm text-gray-700 mb-4">{data.description}</p>
      <button
        className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm w-full transition ease-in-out duration-200"
        onClick={() => updateTaskStatus(data._id, "active")}
      >
        Accept Task
      </button>
    </div>
  );
};

export default NewTask;
