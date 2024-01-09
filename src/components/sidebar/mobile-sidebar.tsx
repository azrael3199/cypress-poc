"use client";
import React, { useState } from "react";
import CypressPageIcon from "../icons/cypressPageIcon";
import { Menu } from "lucide-react";
import clsx from "clsx";

interface MobileSidebarProps {
  children: React.ReactNode;
}

export const nativaNavigations = [
  {
    title: "Sidebar",
    id: "sidebar",
    customIcon: Menu,
  },
  {
    title: "Pages",
    id: "pages",
    customIcon: CypressPageIcon,
  },
];

const MobileSidebar: React.FC<MobileSidebarProps> = ({ children }) => {
  const [selectedNav, setSelectedNav] = useState("");
  return (
    <>
      {selectedNav === "sidebar" && <>{children}</>}
      <nav className="bg-black/10 backdrop-blur-lg sm:hidden fixed z-50 bottom-0 right-0 left-0">
        <ul className="flex justify-between items-center p-4">
          {nativaNavigations.map((item) => (
            <li
              className="flex items-center flex-col justify-center cursor-pointer"
              onClick={() => {
                setSelectedNav(item.id);
              }}
              key={item.id}
            >
              <item.customIcon></item.customIcon>
              <small
                className={clsx("", {
                  "text-muted-foreground": selectedNav !== item.id,
                })}
              >
                {item.title}
              </small>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};

export default MobileSidebar;
