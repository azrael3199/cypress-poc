"use client";

import { Workspace } from "@/lib/supabase/supabase.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

interface SelectedWorkspaceProps {
  workspace: Workspace;
  onClick?: (option: Workspace) => void;
  className?: string;
}

const SelectedWorkspace: React.FC<SelectedWorkspaceProps> = ({
  workspace,
  onClick,
  className,
}) => {
  const supabase = createClientComponentClient();
  const [workspaceLogo, setWorkspaceLogo] = useState("/cypresslogo.svg");

  useEffect(() => {
    if (workspace.logo) {
      const path = supabase.storage
        .from("workspace-logos")
        .getPublicUrl(workspace.logo).data.publicUrl;
      setWorkspaceLogo(path);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace]);

  return (
    <Link
      href={`/dashboard/${workspace.id}`}
      onClick={() => {
        if (onClick) onClick(workspace);
      }}
      className="flex rounded-md hover:bg-muted transition flex-row py-1 px-4 gap-4 justify-center cursor-pointer items-center my-2"
    >
      <Image src={workspaceLogo} alt="Workspace Logo" height={26} width={26} />
      <div className="flex flex-col">
        <p
          className={twMerge(
            "text-lg w-[170px] overflow-hidden overflow-ellipsis whitespace-nowrap",
            className
          )}
        >
          {workspace.title}
        </p>
      </div>
    </Link>
  );
};

export default SelectedWorkspace;
