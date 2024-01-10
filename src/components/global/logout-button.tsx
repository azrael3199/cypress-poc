import React from "react";
import { Button } from "../ui/button";

interface LogoutButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "btn-primary"
    | "btn-secondary"
    | null;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({
  children,
  className,
  variant,
}) => {
  return (
    <Button variant={variant ?? "secondary"} className={className}>
      {children}
    </Button>
  );
};

export default LogoutButton;
