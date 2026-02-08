import React from 'react';
import { FiPlus, FiMoreVertical } from 'react-icons/fi';

const Dashboard = () => {
  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold">Kishore's Business</h2>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center">
          <FiPlus className="mr-2" /> Add New Book
        </button>
      </div>

      <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-5">
        Your Role: Primary Admin <a href="#" className="underline">View</a>
      </div>

      <div className="flex justify-between items-center mb-5">
        <input type="text" placeholder="Search by book name..." className="border p-2 rounded-lg w-1/3" />
        <div>Sort By: Last Updated</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Expense Books */}
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full mr-3"></div>
              <div>
                <div className="font-bold">June expense</div>
                <div className="text-gray-500 text-sm">Updated 8 months ago</div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="mr-5 font-bold text-green-500">9,175</div>
              <FiMoreVertical />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full mr-3"></div>
              <div>
                <div className="font-bold">May Expenses - 2025</div>
                <div className="text-gray-500 text-sm">Updated 8 months ago</div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="mr-5 font-bold text-green-500">1,800</div>
              <FiMoreVertical />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full mr-3"></div>
              <div>
                <div className="font-bold">Daily Expenses</div>
                <div className="text-gray-500 text-sm">Updated over 1 year ago</div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="mr-5 font-bold text-green-500">6,631</div>
              <FiMoreVertical />
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="bg-white p-5 rounded-lg shadow">
          <h3 className="font-bold mb-3">Tried Passbook?</h3>
          <p className="text-gray-600 mb-3">Automatically get all online transactions at one place.</p>
          <a href="#" className="text-blue-500">Know More &gt;</a>
        </div>

        <div className="bg-white p-5 rounded-lg shadow">
          <h3 className="font-bold mb-3">Need help in business setup?</h3>
          <p className="text-gray-600 mb-3">Our support team will help you</p>
          <a href="#" className="text-blue-500">Contact Us &gt;</a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
