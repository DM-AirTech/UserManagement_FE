import * as React from "react";
import { Menu } from "@headlessui/react";
import { ChevronDown } from "lucide-react";

export function DropdownMenu({ label, children }) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="flex items-center space-x-2 px-3 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-50 focus:outline-none">
        {label}
        <ChevronDown className="h-4 w-4" />
      </Menu.Button>
      <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white border border-gray-200 rounded-md shadow-lg focus:outline-none z-50">
        <div className="py-1">{children}</div>
      </Menu.Items>
    </Menu>
  );
}

export function DropdownMenuItem({ children, onClick }) {
  return (
    <Menu.Item>
      {({ active }) => (
        <button
          onClick={onClick}
          className={`${
            active ? "bg-gray-100" : ""
          } w-full text-left px-4 py-2 text-sm text-gray-700`}
        >
          {children}
        </button>
      )}
    </Menu.Item>
  );
}

export function DropdownMenuLabel({ children }) {
  return <div className="px-4 py-2 text-xs text-gray-400">{children}</div>;
}

export function DropdownMenuSeparator() {
  return <hr className="my-1 border-gray-200" />;
}

export function DropdownMenuTrigger({ children }) {
  return children;
}

export function DropdownMenuContent({ children }) {
  return children;
}
