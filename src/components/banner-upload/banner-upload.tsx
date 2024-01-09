import {
  appFoldersType,
  appWorkspacesType,
} from "@/lib/providers/state-provider";
import { File, Folder, Workspace } from "@/lib/supabase/supabase.types";
import React from "react";
import CustomDialogTrigger from "../global/custom-dialog";
import BannerUploadForm from "./banner-upload-form";

interface BannerUploadProps {
  children: React.ReactNode;
  className: string;
  dirType: "workspace" | "file" | "folder";
  id: string;
  details: appWorkspacesType | appFoldersType | File | Workspace | Folder;
}

const BannerUpload: React.FC<BannerUploadProps> = ({
  children,
  details,
  id,
  dirType,
  className,
}) => {
  return (
    <CustomDialogTrigger
      header="Upload Banner"
      content={<BannerUploadForm dirType={dirType} id={id} />}
      className={className}
    >
      {children}
    </CustomDialogTrigger>
  );
};

export default BannerUpload;
