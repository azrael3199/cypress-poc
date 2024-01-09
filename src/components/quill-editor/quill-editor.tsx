"use client";

import { useAppState } from "@/lib/providers/state-provider";
import { File, Folder, Workspace } from "@/lib/supabase/supabase.types";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "quill/dist/quill.snow.css";
import { Button } from "../ui/button";
import {
  deleteFile,
  deleteFolder,
  findUser,
  getFileDetails,
  getFolderDetails,
  getWorkspaceDetails,
  restoreFolder,
  updateFile,
  updateFolder,
  updateWorkspace,
} from "@/lib/supabase/queries";
import { usePathname, useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import BannerImage from "../../../public/BannerImage.jpg";
import EmojiPicker from "../global/emoji-picker";
import { useToast } from "../ui/use-toast";
import BannerUpload from "../banner-upload/banner-upload";
import { XCircleIcon } from "lucide-react";
import { useSocket } from "@/lib/providers/socket-provider";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";

interface QuillEditorProps {
  dirType: "workspace" | "folder" | "file";
  dirDetails: Workspace | Folder | File;
  fileId: string;
}

const TOOLBAR_OPTIONS = [
  ["bold", "italic", "underlined", "strike"],
  ["blockquote", "code-block"],
  [{ header: 1 }, { header: 2 }],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ indent: "-1" }, { indent: "+1" }],
  [{ directions: "rtl" }],
  [{ size: ["small", false, "large", "huge"] }],
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ color: [] }, { background: [] }],
  [{ font: [] }],
  [{ align: [] }],
  ["clean"],
];

const QuillEditor: React.FC<QuillEditorProps> = ({
  dirType,
  dirDetails,
  fileId,
}) => {
  const supabase = createClientComponentClient();
  const { state, workspaceId, folderId, dispatch } = useAppState();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useSupabaseUser();
  const { socket, isConnected } = useSocket();
  const pathname = usePathname();
  const [quill, setQuill] = useState<any>(null);
  const [collaborators, setCollaborators] = useState<
    { id: string; email: string; avatarUrl: string }[] | []
  >([]);
  const [saving, setSaving] = useState(false);
  const [deletingBanner, setDeletingBanner] = useState(false);
  const [localCursors, setLocalCursors] = useState<any[] | []>([]);

  const details = useMemo(() => {
    let selectedDir;
    if (dirType === "file") {
      selectedDir = state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders.find((folder) => folder.id === folderId)
        ?.files.find((file) => file.id === fileId);
    }
    if (dirType === "folder") {
      selectedDir = state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders.find((folder) => folder.id === fileId);
    }
    if (dirType === "workspace") {
      selectedDir = state.workspaces.find(
        (workspace) => workspace.id === fileId
      );
    }

    if (selectedDir) {
      return selectedDir;
    }

    return {
      title: dirDetails.title,
      iconId: dirDetails.iconId,
      createdAt: dirDetails.createdAt,
      data: dirDetails.data,
      inTrash: dirDetails.inTrash,
      bannerUrl: dirDetails.bannerUrl,
    } as Workspace | Folder | File;
  }, [state, workspaceId, folderId]);

  const breadCrumbs = useMemo(() => {
    if (!pathname || !state.workspaces || !workspaceId) return;
    const segments = pathname
      .split("/")
      .filter((val) => val !== "dashboard" && val);
    const workspaceDetails = state.workspaces.find(
      (workspace) => workspace.id === workspaceId
    );
    const workspaceBreadcrumbs = workspaceDetails
      ? `${workspaceDetails.iconId} ${workspaceDetails.title}`
      : "";
    if (segments.length === 1) {
      return workspaceBreadcrumbs;
    }

    const folderSegment = segments[1];
    const folderDetails = workspaceDetails?.folders.find(
      (folder) => folder.id === folderSegment
    );
    const folderBreadcrumbs = folderDetails
      ? `/${folderDetails.iconId} ${folderDetails.title}`
      : "";

    if (segments.length === 2) {
      return `${workspaceBreadcrumbs} ${folderBreadcrumbs}`;
    }

    const fileSegment = segments[2];
    const fileDetails = folderDetails?.files.find(
      (file) => file.id === fileSegment
    );
    const fileBreadcrumbs = fileDetails
      ? `/${fileDetails.iconId} ${fileDetails.title}`
      : "";

    return `${workspaceBreadcrumbs} ${folderBreadcrumbs} ${fileBreadcrumbs}`;
  }, [state, pathname, workspaceId]);

  const wrapperRef = useCallback(async (wrapper: any) => {
    if (typeof window !== undefined) {
      if (wrapper === null) return;
      wrapper.innerHTML = "";
      const editor = document.createElement("div");
      wrapper.append(editor);
      const Quill = (await import("quill")).default;
      const QuillCursors = (await import("quill-cursors")).default;
      Quill.register({ "modules/cursors": QuillCursors }, true);
      const q = new Quill(editor, {
        theme: "snow",
        modules: {
          toolbar: TOOLBAR_OPTIONS,
          cursors: true,
        },
      });
      setQuill(q);
    }
  }, []);

  const restoreFileHandler = async () => {
    if (!workspaceId) return;
    if (dirType === "file") {
      if (!folderId || !fileId) return;
      dispatch({
        type: "UPDATE_FILE",
        payload: { file: { inTrash: null }, fileId, folderId, workspaceId },
      });
      await updateFile({ inTrash: null }, fileId);
    }
    if (dirType === "folder") {
      if (!fileId) return;
      dispatch({
        type: "RESTORE_FOLDER",
        payload: { folderId: fileId, workspaceId },
      });
      await restoreFolder(fileId);
    }
  };

  const deleteFileHandler = async () => {
    if (!workspaceId) return;
    if (dirType === "file") {
      if (!folderId || !fileId) return;
      dispatch({
        type: "DELETE_FILE",
        payload: { fileId, folderId, workspaceId },
      });
      await deleteFile(fileId);
      router.replace(`/dashboard/${workspaceId}`);
    }
    if (dirType === "folder") {
      if (!fileId) return;
      dispatch({
        type: "DELETE_FOLDER",
        payload: { folderId: fileId, workspaceId },
      });
      await deleteFolder(fileId);
      router.replace(`/dashboard/${workspaceId}`);
    }
  };

  const iconOnChange = async (icon: string) => {
    if (!fileId) return;
    if (!workspaceId) return;
    if (dirType === "workspace") {
      dispatch({
        type: "UPDATE_WORKSPACE",
        payload: { workspace: { iconId: icon }, workspaceId: fileId },
      });

      const { error } = await updateWorkspace({ iconId: icon }, fileId);
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: error,
        });
      }
    }
    if (dirType === "folder") {
      dispatch({
        type: "UPDATE_FOLDER",
        payload: {
          folder: { iconId: icon },
          workspaceId: workspaceId,
          folderId: fileId,
        },
      });
      const { error } = await updateFolder({ iconId: icon }, fileId);
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: error,
        });
      }
    }
    if (dirType === "file") {
      if (!folderId) return;
      dispatch({
        type: "UPDATE_FILE",
        payload: {
          file: { iconId: icon },
          workspaceId: workspaceId,
          folderId: folderId,
          fileId,
        },
      });
      const { error } = await updateFile({ iconId: icon }, fileId);
      if (error) {
        toast({
          title: "Error",
          variant: "destructive",
          description: error,
        });
      }
    }
  };

  const deleteBannerHandler = async () => {
    if (!fileId) return;
    setDeletingBanner(true);
    try {
      if (dirType === "file") {
        if (!folderId || !workspaceId) return;
        dispatch({
          type: "UPDATE_FILE",
          payload: { file: { bannerUrl: null }, fileId, folderId, workspaceId },
        });
        const { data: findData, error: findError } = await supabase.storage
          .from("file-banners")
          .list(undefined, {
            limit: 1,
            search: `banner-${fileId}`,
          });
        if (findError) {
          throw findError;
        }
        if (findData?.length) {
          await supabase.storage
            .from("file-banners")
            .remove([findData[0].name]);
        }
        await updateFile({ bannerUrl: null }, fileId);
      }
      if (dirType === "folder") {
        if (!workspaceId) return;
        dispatch({
          type: "UPDATE_FOLDER",
          payload: {
            folder: { bannerUrl: null },
            folderId: fileId,
            workspaceId,
          },
        });
        const { data: findData, error: findError } = await supabase.storage
          .from("file-banners")
          .list(undefined, {
            limit: 1,
            search: `banner-${fileId}`,
          });
        if (findError) {
          throw findError;
        }
        if (findData?.length) {
          await supabase.storage
            .from("file-banners")
            .remove([findData[0].name]);
        }
        await updateFolder({ bannerUrl: null }, fileId);
      }
      if (dirType === "workspace") {
        if (!workspaceId) return;
        dispatch({
          type: "UPDATE_WORKSPACE",
          payload: { workspace: { bannerUrl: null }, workspaceId },
        });
        const { data: findData, error: findError } = await supabase.storage
          .from("file-banners")
          .list(undefined, {
            limit: 1,
            search: `banner-${fileId}`,
          });
        if (findError) {
          throw findError;
        }
        if (findData?.length) {
          await supabase.storage
            .from("file-banners")
            .remove([findData[0].name]);
        }
        await updateWorkspace({ bannerUrl: null }, fileId);
      }
    } catch (error) {
      toast({
        title: "Error",
        variant: "destructive",
        description: `${error}`,
      });
    } finally {
      setDeletingBanner(false);
    }
  };

  useEffect(() => {
    if (!fileId) return;
    let selectedDir;
    const fetchInformation = async () => {
      if (dirType === "file") {
        const { data: selectedDir, error } = await getFileDetails(fileId);
        if (error || !selectedDir) {
          return router.replace("/dashboard");
        }
        if (!selectedDir[0]) {
          if (!workspaceId) return;
          return router.replace(`/dashboard/${workspaceId}`);
        }
        if (!workspaceId || !selectedDir[0].folderId || quill === null) return;
        if (!selectedDir[0].data) return;
        quill.setContents(JSON.parse(selectedDir[0].data || ""));
        dispatch({
          type: "UPDATE_FILE",
          payload: {
            file: { data: selectedDir[0].data },
            fileId,
            folderId: selectedDir[0].folderId,
            workspaceId,
          },
        });
      }

      if (dirType === "folder") {
        const { data: selectedDir, error } = await getFolderDetails(fileId);
        if (error || !selectedDir) {
          return router.replace("/dashboard");
        }
        if (!selectedDir[0]) {
          if (!workspaceId) return;
          return router.replace(`/dashboard/${workspaceId}`);
        }
        if (!workspaceId || quill === null) return;
        if (!selectedDir[0].data) return;
        quill.setContents(JSON.parse(selectedDir[0].data || ""));
        dispatch({
          type: "UPDATE_FOLDER",
          payload: {
            folder: { data: selectedDir[0].data },
            folderId: fileId,
            workspaceId,
          },
        });
      }

      if (dirType === "workspace") {
        const { data: selectedDir, error } = await getWorkspaceDetails(fileId);
        if (error || !selectedDir) {
          return router.replace("/dashboard");
        }
        if (!workspaceId || quill === null) return;
        if (!selectedDir[0].data) return;
        quill.setContents(JSON.parse(selectedDir[0].data || ""));
        dispatch({
          type: "UPDATE_WORKSPACE",
          payload: {
            workspace: { data: selectedDir[0].data },
            workspaceId: fileId,
          },
        });
      }
    };

    fetchInformation();
  }, [fileId, workspaceId, quill, dirType]);

  // Rooms
  useEffect(() => {
    if (socket === null || quill === null || !fileId) return;
    socket.emit("create-room", fileId);
  }, [socket, quill, fileId]);

  // Send quill changes to all clients
  useEffect(() => {
    if (quill === null || socket === null || !fileId || !user) return;
    const selectionChangeHandler = (cursorId: string) => {
      return (range: any, oldRange: any, source: any) => {
        if (source === "user" && cursorId) {
          socket.emit("send-cursor-move", range, fileId, cursorId);
        }
      };
    };
    const quillHandler = (delta: any, oldDelta: any, source: any) => {
      if (source !== "user") return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaving(true);
      const contents = quill.getContents();
      const quillLength = quill.getLength();
      saveTimerRef.current = setTimeout(async () => {
        try {
          if (contents && quillLength !== 1 && fileId) {
            if (dirType === "workspace") {
              dispatch({
                type: "UPDATE_WORKSPACE",
                payload: {
                  workspace: { data: JSON.stringify(contents) },
                  workspaceId: fileId,
                },
              });
              await updateWorkspace({ data: JSON.stringify(contents) }, fileId);
            }
            if (dirType === "folder") {
              if (!workspaceId) return;
              dispatch({
                type: "UPDATE_FOLDER",
                payload: {
                  folder: { data: JSON.stringify(contents) },
                  folderId: fileId,
                  workspaceId: workspaceId,
                },
              });
              await updateFolder({ data: JSON.stringify(contents) }, fileId);
            }
            if (dirType === "file") {
              if (!workspaceId || !folderId) return;
              dispatch({
                type: "UPDATE_FILE",
                payload: {
                  file: { data: JSON.stringify(contents) },
                  fileId,
                  folderId,
                  workspaceId,
                },
              });
              await updateFile({ data: JSON.stringify(contents) }, fileId);
            }
          }
        } catch (error) {
          toast({
            title: "Error",
            variant: "destructive",
            description: "Could not save the file",
          });
        }
        setSaving(false);
      }, 850);
      socket.emit("send-changes", delta, fileId);
    };
    quill.on("text-change", quillHandler);
    quill.on("selection-change", selectionChangeHandler(user.id));

    return () => {
      quill.off("text-change", quillHandler);
      quill.off("selection-change", selectionChangeHandler);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [quill, socket, fileId, user, details, folderId, workspaceId, dispatch]);

  useEffect(() => {
    if (quill === null || socket === null || !fileId || !localCursors.length)
      return;
    const socketHandler = (range: any, roomId: string, cursorId: string) => {
      if (roomId === fileId) {
        const cursorToMove = localCursors.find(
          (c) => c.cursors()?.[0].id === cursorId
        );
        if (cursorToMove) {
          cursorToMove.moveCursor(cursorId, range);
        }
      }
    };
    socket.on("receive-cursor-move", socketHandler);
    return () => {
      socket.off("receive-cursor-move", socketHandler);
    };
  }, [quill, socket, fileId, localCursors]);

  // Send changes to everyone
  useEffect(() => {
    if (quill === null || socket === null) return;
    const socketHandler = (deltas: any, id: string) => {
      if (id === fileId) {
        quill.updateContents(deltas);
      }
    };
    socket.on("receive-changes", socketHandler);

    return () => {
      socket.off("receive-changes", socketHandler);
    };
  }, [quill, socket, fileId]);

  useEffect(() => {
    if (!fileId || quill === null) {
      return;
    }
    const room = supabase.channel(fileId);
    const subscription = room
      .on("presence", { event: "sync" }, () => {
        const newState = room.presenceState();
        const newCollaborators = Object.values(newState).flat() as any;
        setCollaborators(newCollaborators);
        if (user) {
          const allCursors: any = [];
          newCollaborators.forEach(
            (collaborator: { id: string; email: string; avatar: string }) => {
              if (collaborator.id !== user.id) {
                const userCursor = quill.getModule("cursors");
                userCursor.createCursor(
                  collaborator.id,
                  collaborator.email.split("@")[0],
                  `#${Math.random().toString(16).slice(2, 8)}`
                ),
                  allCursors.push(userCursor);
              }
            }
          );
          setLocalCursors(allCursors);
        }
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED" || !user) return;
        const response = await findUser(user.id);
        if (!response) return;

        room.track({
          id: user.id,
          email: user.email?.split("@")[0],
          avatarUrl: response.avatarUrl
            ? supabase.storage.from("avatars").getPublicUrl(response.avatarUrl)
                .data.publicUrl
            : "",
        });
      });

    return () => {
      supabase.removeChannel(room);
    };
  }, [fileId, quill, supabase, user]);

  // Mount Quill Editor
  return (
    <>
      <div className="relative">
        {details.inTrash && (
          <article className="py-2 z-40, bg-[#E35757] flex md:flex-row flex-col justify-center items-center gap-4 flex-wrap">
            <div className="flex flex-col md:flex-row gap-2 justify-center items-center">
              <span className="text-white">
                This {dirType} is in the trash.
              </span>
              <Button
                size="small"
                variant="outline"
                className="p-2 bg-transparent border-white text-white hover:bg-white hover:text-[#EB5757]"
                onClick={restoreFileHandler}
              >
                Restore
              </Button>
              <Button
                size="small"
                variant="outline"
                className="p-2 bg-transparent border-white text-white hover:bg-white hover:text-[#EB5757]"
                onClick={deleteFileHandler}
              >
                Delete
              </Button>
            </div>
            <span className="text-sm text-white">{details.inTrash}</span>
          </article>
        )}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between justify-center sm:items-center sm:p-2 p-8 gap-4">
          <div>{breadCrumbs}</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center h-10">
              {collaborators.map((c) => (
                <TooltipProvider key={c.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="-ml-3 bg-background border-2 flex items-center justify-center border-white h-10 w-10 rounded-full">
                        <AvatarImage
                          className="rounded-full"
                          src={c.avatarUrl ? c.avatarUrl : ""}
                        />
                        <AvatarFallback>
                          {c.email.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>{c.email}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
            {saving ? (
              <Badge
                variant="secondary"
                className="bg-orange-600 top-4 text-white right-4 z-50"
              >
                Saving
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-emerald-600 top-4 text-white right-4 z-50"
              >
                Saved
              </Badge>
            )}
          </div>
        </div>
      </div>
      {details.bannerUrl && (
        <div className="relative w-full h-[200px]">
          <Image
            src={
              supabase.storage
                .from("file-banners")
                .getPublicUrl(details.bannerUrl).data.publicUrl
            }
            fill
            className="w-full md:h-48 h-20 object-cover"
            alt="Banner Image"
          />
        </div>
      )}

      <div className="flex justify-center items-center flex-col mt-2 relative">
        <div className="w-full self-center max-w-[800px] flex flex-col px-6 lg:my-8">
          <div className="text-[80px]">
            <EmojiPicker getValue={iconOnChange}>
              <div className="cursor-pointer transition-colors h-[100px] flex items-center justify-center hover:bg-muted rounded-xl">
                {details.iconId}
              </div>
            </EmojiPicker>
          </div>
          <div className="flex">
            <BannerUpload
              details={details}
              id={fileId}
              dirType={dirType}
              className="mt-2 text-sm text-muted-foreground p-2 hover:text-card-foreground transistion-all rounded-md"
            >
              {details.bannerUrl ? "Update Banner" : "Add Banner"}
            </BannerUpload>
            {details.bannerUrl && (
              <Button
                disabled={deletingBanner}
                onClick={deleteBannerHandler}
                variant="ghost"
                className="gap-2 hover:bg-background flex items-center justify-center mt-2 text-sm text-muted-foreground w-36 p-2 rounded-md"
              >
                <XCircleIcon size={16} />
                <span className="whitespace-nowrap font-normal">
                  Remove Banner
                </span>
              </Button>
            )}
          </div>
          <span className="text-muted-foreground text-3xl font-bold h-9">
            {details.title}
          </span>
          <span className="text-muted-foreground text-sm mb-4 md:m-0">
            {dirType.toUpperCase()}
          </span>
        </div>
        <div id="container" className="max-w-[800px]" ref={wrapperRef}></div>
      </div>
    </>
  );
};

export default QuillEditor;
