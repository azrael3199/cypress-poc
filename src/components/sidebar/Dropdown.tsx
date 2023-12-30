"use client";

import { useAppState } from "@/lib/providers/state-provider";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { AccordionItem, AccordionTrigger } from "../ui/accordion";
import clsx from "clsx";
import EmojiPicker from "../global/emoji-picker";
import { updateFolder } from "@/lib/supabase/queries";
import { useToast } from "../ui/use-toast";

interface DropdownProps {
  title: string;
  id: string;
  listType: "folder" | "file";
  iconId: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  title,
  id,
  listType,
  iconId,
  children,
  disabled,
}) => {
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const { state, dispatch, workspaceId, folderId } = useAppState();
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  // Folder Title synced with server data and local state
  const folderTitle: string | undefined = useMemo(() => {
    if (listType === "folder") {
      const stateTitle = state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders.find((folder) => folder.id === id)?.title;
      if (title === stateTitle || !stateTitle) return title;
      return stateTitle;
    }
  }, [state, listType, id, title, workspaceId]);

  const fileTitle: string | undefined = useMemo(() => {
    if (listType === "file") {
      const fileAndFolderId = id.split("folder");
      const stateTitle = state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders.find((folder) => folder.id === fileAndFolderId[0])
        ?.files.find((file) => file.id === fileAndFolderId[1])?.title;
      if (title === stateTitle || !stateTitle) return title;
      return stateTitle;
    }
  }, [state, listType, id, title, workspaceId]);

  // Navigate user to a different page
  const navigatePage = (accordionId: string, type: string) => {
    if (type === "folder") {
      router.push(`/dashboard/${workspaceId}/${accordionId}`);
    }
    if (type === "file") {
      router.push(`/dashboard/${workspaceId}/${folderId}/${accordionId}`);
    }
  };

  const onChangeEmojiHandler = async (selectedEmoji: string) => {
    if (listType === "folder") {
      if (workspaceId) {
        dispatch({
          type: "UPDATE_FOLDER",
          payload: {
            workspaceId,
            folderId: id,
            folder: { iconId: selectedEmoji },
          },
        });
        const { data, error } = await updateFolder(
          { iconId: selectedEmoji },
          id
        );
        if (error) {
          toast({
            title: "Error",
            variant: "destructive",
            description: "Could not set the emoji for this folder",
          });
        } else {
          toast({
            title: "Success",
            description: "Emoji updated",
          });
        }
      } else return;
    }
  };

  const folderTitleChange = (e: any) => {
    const fId = id.split("folder");
    if (fId.length === 1) {
      if (workspaceId) {
        dispatch({
          type: "UPDATE_FOLDER",
          payload: {
            folder: {
              title,
            },
            folderId: fId[0],
            workspaceId: workspaceId,
          },
        });
      } else return;
    }
  };

  const fileTitleChange = (e: any) => {
    const fId = id.split("folder");
    if (fId.length === 2 && fId[1]) {
      // WIP Update File Title
    }
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = async () => {
    setIsEditing(false);
    const fId = id.split("folder");
    if (fId.length === 1) {
      if (!folderTitle) return;
      await updateFolder({ title }, fId[0]);
    }

    if (fId.length === 2 && fId[1]) {
      if (!fileTitle) return;
      // WIP Update File
    }
  };

  const isFolder = listType === "folder";

  const groupIdentifies = useMemo(
    () =>
      clsx(
        "dark:text-white whitespace-nowrap flex justify-between items-center w-full relative",
        {
          "group/folder": isFolder,
          "group/file": !isFolder,
        }
      ),
    [isFolder]
  );

  const listStyles = useMemo(
    () =>
      clsx("relative", {
        "border-none text-md": isFolder,
        "border-none ml-6 text-[16px] py-1": !isFolder,
      }),
    [isFolder]
  );

  return (
    <AccordionItem
      value={id}
      className={listStyles}
      onClick={(e) => {
        e.stopPropagation();
        navigatePage(id, listType);
      }}
    >
      <AccordionTrigger
        id={listType}
        className="hover:no-underline p-2 dark:text-muted-foreground text-sm"
        disabled={listType === "file"}
      >
        <div className={groupIdentifies}>
          <div className="flex gap-4 items-center justify-center overflow-hidden">
            <div className="flex gap-2 items-center relative">
              <EmojiPicker getValue={onChangeEmojiHandler}>
                {iconId}
              </EmojiPicker>
              <input
                type="text"
                value={listType === "folder" ? folderTitle : fileTitle}
                className={clsx(
                  "outline-none overflow-hidden w-[140px] text-Neutrals-7",
                  {
                    "bg-muted cursor-text": isEditing,
                    "bg-transparent cursor-pointer": !isEditing,
                  }
                )}
                readOnly={!isEditing}
                onDoubleClick={handleDoubleClick}
                onBlur={handleBlur}
                onChange={
                  listType === "folder" ? folderTitleChange : fileTitleChange
                }
              />
              {listType === "folder" && !isEditing && <></>}
            </div>
          </div>
        </div>
      </AccordionTrigger>
    </AccordionItem>
  );
};

export default Dropdown;
