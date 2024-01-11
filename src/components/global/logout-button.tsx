"use client";
import React from "react";
import { Button } from "../ui/button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "../ui/use-toast";

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
  const supabase = createClientComponentClient();

  const { toast } = useToast();

  const logoutUser = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        variant: "destructive",
        description: `Could not logout user: ${error}`,
      });
    }
  };

  return (
    <Button
      variant={variant ?? "secondary"}
      className={className}
      onClick={logoutUser}
    >
      {children}
    </Button>
  );
};

export default LogoutButton;
