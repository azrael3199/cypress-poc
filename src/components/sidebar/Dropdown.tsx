"use client";

import { useAppState } from "@/lib/providers/state-provider";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import clsx from "clsx";
import EmojiPicker from "../global/emoji-picker";
import { createFile, updateFile, updateFolder } from "@/lib/supabase/queries";
import { useToast } from "../ui/use-toast";
import TooltipComponent from "../global/tooltip-component";
import { PlusIcon, Trash } from "lucide-react";
import { File } from "@/lib/supabase/supabase.types";
import { v4 } from "uuid";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";

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
  const { user } = useSupabaseUser();
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
    if (!workspaceId) return;
    if (listType === "folder") {
      dispatch({
        type: "UPDATE_FOLDER",
        payload: {
          workspaceId,
          folderId: id,
          folder: { iconId: selectedEmoji },
        },
      });
      const { data, error } = await updateFolder({ iconId: selectedEmoji }, id);
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
  };

  const addNewFile = async () => {
    if (!workspaceId) return;
    const newFile: File = {
      folderId: id,
      data: null,
      createdAt: new Date().toISOString(),
      inTrash: null,
      title: "Untitled",
      iconId: "📄",
      id: v4(),
      workspaceId,
      bannerUrl: "",
    };

    dispatch({
      type: "ADD_FILE",
      payload: { file: newFile, folderId: id, workspaceId },
    });
    const { data, error } = await createFile(newFile);
    if (error) {
      toast({
        title: "Error",
        variant: "destructive",
        description: "Could not create a file",
      });
    } else {
      toast({
        title: "Success",
        description: "File created successfully",
      });
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
              title: e.target.value,
            },
            folderId: fId[0],
            workspaceId: workspaceId,
          },
        });
      } else return;
    }
  };

  const fileTitleChange = (e: any) => {
    if (!workspaceId) return;
    const fId = id.split("folder");
    if (fId.length === 2 && fId[1]) {
      dispatch({
        type: "UPDATE_FILE",
        payload: {
          file: { title: e.target.value },
          folderId: fId[0],
          workspaceId,
          fileId: fId[1],
        },
      });
    }
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = async () => {
    if (!isEditing) return;
    setIsEditing(false);
    const fId = id.split("folder");
    if (fId.length === 1) {
      if (!folderTitle) return;
      const { error } = await updateFolder({ title }, fId[0]);
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not update folder title!",
        });
      } else {
        toast({
          title: "Success",
          description: "Updated folder title",
        });
      }
    }

    if (fId.length === 2 && fId[1]) {
      if (!fileTitle) return;
      const { error } = await updateFile({ title: fileTitle }, fId[1]);
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not update file title!",
        });
      } else {
        toast({
          title: "Success",
          description: "Updated file title",
        });
      }
    }
  };

  const moveToTrash = async () => {
    if (!user?.email || !workspaceId) return;
    const pathId = id.split("folder");
    if (listType === "folder") {
      dispatch({
        type: "UPDATE_FOLDER",
        payload: {
          folder: { inTrash: `Deleted by ${user?.email}` },
          folderId: pathId[0],
          workspaceId,
        },
      });
      const { error } = await updateFolder(
        { inTrash: `Deleted by ${user?.email}` },
        pathId[0]
      );
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not move the folder to trash!",
        });
      } else {
        toast({
          title: "Success",
          description: "Moved the folder to trash",
        });
      }
    }

    if (listType === "file") {
      dispatch({
        type: "UPDATE_FILE",
        payload: {
          file: { inTrash: `Deleted by ${user?.email}` },
          folderId: pathId[0],
          workspaceId,
          fileId: pathId[1],
        },
      });
      const { error } = await updateFile(
        { inTrash: `Deleted by ${user?.email}` },
        pathId[1]
      );
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: "Could not move the file to trash!",
        });
      } else {
        toast({
          title: "Success",
          description: "Moved the file to trash",
        });
      }
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

  const hoverStyles = useMemo(
    () =>
      clsx(
        "h-full hidden rounded-sm absolute right-0 items-center justify-center gap-2",
        {
          "group-hover/file:flex": listType === "file",
          "group-hover/folder:flex": listType === "folder",
        }
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isFolder, listType]
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
              <EmojiPicker
                getValue={onChangeEmojiHandler}
                className="grow-0 w-6"
              >
                {iconId}
              </EmojiPicker>
              <input
                type="text"
                value={listType === "folder" ? folderTitle : fileTitle}
                className={clsx(
                  "outline-none overflow-hidden w-[140px] text-Neutrals/neutrals-7 grow-0",
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
            </div>
            <div className={hoverStyles}>
              <TooltipComponent message="Delete Folder">
                <Trash
                  onClick={moveToTrash}
                  size={15}
                  className="hover:dark:text-white dark:text-Neutrals/neutrals-7 transition-colors"
                />
              </TooltipComponent>
              {listType === "folder" && !isEditing && (
                <TooltipComponent message="Add File">
                  <PlusIcon
                    onClick={addNewFile}
                    size={15}
                    className="hover:dark:text-white dark:text-Neutrals/neutrals-7 transition-colors"
                  />
                </TooltipComponent>
              )}
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {state.workspaces
          .find((workspace) => workspace.id === workspaceId)
          ?.folders.find((folder) => folder.id === id)
          ?.files.filter((file) => !file.inTrash)
          .map((file) => {
            const customFileId = `${id}folder${file.id}`;
            return (
              <Dropdown
                key={file.id}
                title={file.title}
                listType="file"
                id={customFileId}
                iconId={file.iconId}
              />
            );
          })}
      </AccordionContent>
    </AccordionItem>
  );
};

export default Dropdown;
