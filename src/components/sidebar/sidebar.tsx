import {
  getCollaboratingWorkspaces,
  getFolders,
  getPrivateWorkspaces,
  getSharedWorkspaces,
  getUserSubscriptionStatus,
} from "@/lib/supabase/queries";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";
import { twMerge } from "tailwind-merge";
import WorkspaceDropdown from "./workspace-dropdown";
import PlanUsage from "./plan-usage";
import NativeNavigation from "./native-navigation";
import { ScrollArea } from "../ui/scroll-area";
import FoldersDropdownList from "./folders-dropdown-list";
import UserCard from "./user-card";

interface SidebarProps {
  params: { workspaceId: string };
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = async ({ params, className }) => {
  cookies().getAll();
  const supabase = createServerComponentClient({ cookies });

  // User
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Subscription Status
  const { data: subscriptionData, error: subscriptionError } =
    await getUserSubscriptionStatus(user.id);

  // Folders
  const { data: workspaceFolderData, error: foldersError } = await getFolders(
    params.workspaceId
  );
  // Error
  if (subscriptionError || foldersError) redirect("/dashboard");

  // Get all different workspaces: Private, Collaborating, Shared workspace
  const [privateWorkspaces, sharedWorkspaces, collaboratingWorkspaces] =
    await Promise.all([
      getPrivateWorkspaces(user.id),
      getSharedWorkspaces(user.id),
      getCollaboratingWorkspaces(user.id),
    ]);

  return (
    <aside
      className={twMerge(
        "hidden sm:flex sm:flex-col w-[280px] shrink-0 p-4 md:gap-4 !justify-between",
        className
      )}
    >
      <div>
        <WorkspaceDropdown
          privateWorkspaces={privateWorkspaces}
          sharedWorkspaces={sharedWorkspaces}
          collaboratingWorkspaces={collaboratingWorkspaces}
          defaultValue={[
            ...privateWorkspaces,
            ...collaboratingWorkspaces,
            ...sharedWorkspaces,
          ].find((workspace) => workspace.id === params.workspaceId)}
        />
        <PlanUsage
          foldersLength={workspaceFolderData?.length || 0}
          subscription={subscriptionData}
        />
        <NativeNavigation myWorkspaceId={params.workspaceId} />
        <ScrollArea className="overflow-auto relative h-[450px]">
          <div className="w-full pointer-events-none absolute bottom-0 h-20 bg-gradient-to-t from-background to-transparent z-40" />
          <FoldersDropdownList
            workspaceFolders={workspaceFolderData || []}
            workspaceId={params.workspaceId}
          />
        </ScrollArea>
      </div>
      <UserCard subscription={subscriptionData} />
    </aside>
  );
};

export default Sidebar;
