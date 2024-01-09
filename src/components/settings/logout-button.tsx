import React from "react";
import { Button } from "../ui/button";

interface LogoutButtonProps {
  children: React.ReactNode;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ children }) => {
  return <Button variant="secondary">{children}</Button>;
};

export default LogoutButton;
