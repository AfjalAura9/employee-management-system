import React from "react";
import NotificationBell from "../common/NotificationBell";

const Header = (props) => {
  const logOutUser = () => {
    if (props.changeUser) props.changeUser(null);
  };

  const user = props.data || {};

  return (
    <div className="flex justify-between items-center bg-white shadow-lg p-6 rounded-lg mb-8">
      <div>
        <h1 className="text-2xl font-medium text-gray-800">
          Hello,{" "}
          <span className="text-3xl font-semibold text-blue-600">
            {user.firstName || "User"}👋
          </span>
        </h1>
      </div>
      <div className="flex items-center gap-6">
        <NotificationBell />
        <button
          onClick={logOutUser}
          className="bg-red-600 text-white font-medium text-base px-6 py-3 rounded-lg hover:bg-red-700 transition duration-300"
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Header;
