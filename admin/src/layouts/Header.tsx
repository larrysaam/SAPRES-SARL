import React from 'react';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b-4 border-indigo-600">
      <div className="flex items-center">
        <button className="text-gray-500 focus:outline-none lg:hidden">
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 6H20M4 12H20M4 18H18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="relative mx-4 lg:mx-0">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <svg
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15.5 14.5L19 18M8 11C8 14.866 11.134 18 15 18C18.866 18 22 14.866 22 11C22 7.13401 18.866 4 15 4C11.134 4 8 7.13401 8 11Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <input
            className="form-input w-32 sm:w-64 rounded-md pl-10 pr-4 focus:border-indigo-600"
            type="text"
            placeholder="Search"
          />
        </div>
      </div>

      <div className="flex items-center">
        <div className="relative">
          <button className="flex mx-4 text-gray-600 focus:outline-none">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 17H20L18.5951 15.4937C18.7624 14.6031 19 13.5765 19 12.5C19 9.22091 16.3284 6.5 13 6.5C9.67157 6.5 7 9.22091 7 12.5C7 13.5765 7.23755 14.6031 7.40485 15.4937L6 17H11M15 17V18C15 19.6569 13.6569 21 12 21C10.3431 21 9 19.6569 9 18V17M15 17H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="relative">
          <button className="relative block h-8 w-8 rounded-full overflow-hidden shadow focus:outline-none">
            <img
              className="h-full w-full object-cover"
              src="https://images.unsplash.com/photo-1528892952291-009c6695fd88?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=320&h=320&q=80"
              alt="Your avatar"
            />
          </button>
        </div>
        <span className="ml-2 text-gray-700">{user?.role || 'Guest'}</span>
      </div>
    </header>
  );
};

export default Header;
