"use server";

import { validate } from "uuid";
import {
  collaborators,
  files,
  folders,
  users,
  workspaces,
} from "../../../migrations/schema";
import db from "./db";
import { File, Folder, Subscription, User, Workspace } from "./supabase.types";
import { and, eq, ilike, notExists } from "drizzle-orm";

export const createWorkspace = async (workspace: Workspace) => {
  try {
    const response = await db.insert(workspaces).values(workspace);
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: "Error" };
  }
};

export const deleteWorkspace = async (workspaceId: string) => {
  if (!workspaceId) return;
  await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
};

export const findUser = async (userId: string) => {
  const response = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });
  return response;
};

export const updateUserProfile = async (
  userId: string,
  user: Partial<User>
) => {
  const validId = validate(userId);
  if (!validId) return { data: null, error: `Error` };
  try {
    await db.update(users).set(user).where(eq(users.id, userId));
    return { data: null, error: null };
  } catch (error) {
    console.log("Error: ", error);
    return { data: null, error: `Error` };
  }
};

export const getUserSubscriptionStatus = async (userId: string) => {
  try {
    const data = await db.query.subscriptions.findFirst({
      where: (s: any, { eq }: { eq: any }) => eq(s.userId, userId),
    });
    if (data) return { data: data as Subscription, error: null };
    else return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: `Error` };
  }
};

export const getFolders = async (workspaceId: string) => {
  const isValid = validate(workspaceId);
  if (!isValid)
    return {
      data: null,
      error: "Error",
    };

  try {
    const results: Folder[] | [] = await db
      .select()
      .from(folders)
      .orderBy(folders.createdAt)
      .where(eq(folders.workspaceId, workspaceId));
    return { data: results, error: null };
  } catch (error) {
    return { data: null, error: `Error: ${error}` };
  }
};

export const getFiles = async (folderId: string) => {
  const isValid = validate(folderId);
  if (!isValid) {
    return {
      data: null,
      error: "Error",
    };
  }

  try {
    const results: File[] | [] = await db
      .select()
      .from(files)
      .orderBy(files.createdAt)
      .where(eq(files.folderId, folderId));
    return {
      data: results,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: `Error ${error}`,
    };
  }
};

export const getPrivateWorkspaces = async (userId: string) => {
  if (!userId) return [];
  const privateWorkspaces = (await db
    .select({
      id: workspaces.id,
      createdAt: workspaces.createdAt,
      workspaceOwner: workspaces.workspaceOwner,
      title: workspaces.title,
      iconId: workspaces.iconId,
      data: workspaces.data,
      inTrash: workspaces.inTrash,
      logo: workspaces.logo,
      bannerUrl: workspaces.bannerUrl,
    })
    .from(workspaces)
    .where(
      and(
        notExists(
          db
            .select()
            .from(collaborators)
            .where(eq(collaborators.workspaceId, workspaces.id))
        ),
        eq(workspaces.workspaceOwner, userId)
      )
    )) as Workspace[];
  return privateWorkspaces;
};

export const getCollaboratingWorkspaces = async (userId: string) => {
  if (!userId) return [];
  const collaboratedWorkspaces = (await db
    .select({
      id: workspaces.id,
      createdAt: workspaces.createdAt,
      workspaceOwner: workspaces.workspaceOwner,
      title: workspaces.title,
      iconId: workspaces.iconId,
      data: workspaces.data,
      inTrash: workspaces.inTrash,
      logo: workspaces.logo,
      bannerUrl: workspaces.bannerUrl,
    })
    .from(users)
    .innerJoin(collaborators, eq(users.id, collaborators.userId))
    .innerJoin(workspaces, eq(collaborators.workspaceId, workspaces.id))
    .where(eq(users.id, userId))) as Workspace[];
  return collaboratedWorkspaces;
};

export const getSharedWorkspaces = async (userId: string) => {
  if (!userId) return [];
  const sharedWorkspaces = (await db
    .selectDistinct({
      id: workspaces.id,
      createdAt: workspaces.createdAt,
      workspaceOwner: workspaces.workspaceOwner,
      title: workspaces.title,
      iconId: workspaces.iconId,
      data: workspaces.data,
      inTrash: workspaces.inTrash,
      logo: workspaces.logo,
      bannerUrl: workspaces.bannerUrl,
    })
    .from(workspaces)
    .orderBy(workspaces.createdAt)
    .innerJoin(collaborators, eq(workspaces.id, collaborators.workspaceId))
    .where(eq(workspaces.workspaceOwner, userId))) as Workspace[];
  return sharedWorkspaces;
};

export const addCollaborators = async (users: User[], workspaceId: string) => {
  const response = users.forEach(async (user: User) => {
    const userExists = await db.query.collaborators.findFirst({
      where: (u, { eq }) =>
        and(eq(u.userId, user.id), eq(u.workspaceId, workspaceId)),
    });
    if (!userExists)
      await db.insert(collaborators).values({ workspaceId, userId: user.id });
  });
};

export const removeCollaborators = async (
  users: User[],
  workspaceId: string
) => {
  const response: { data: null; error: any } = { data: null, error: null };
  users.forEach(async (user: User) => {
    try {
      const userExists = await db.query.collaborators.findFirst({
        where: (u, { eq }) =>
          and(eq(u.userId, user.id), eq(u.workspaceId, workspaceId)),
      });
      if (userExists)
        await db
          .delete(collaborators)
          .where(
            and(
              eq(collaborators.workspaceId, workspaceId),
              eq(collaborators.userId, user.id)
            )
          );
    } catch (error) {
      response.error = error;
    }
  });
  return response;
};

export const getCollaborators = async (workspaceId: string) => {
  const response = await db
    .select()
    .from(collaborators)
    .where(eq(collaborators.workspaceId, workspaceId));
  if (!response.length) return [];
  const userInformation: Promise<User | undefined>[] = response.map(
    async (user) => {
      const exists = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, user.userId),
      });
      return exists;
    }
  );

  const resolvedUsers = await Promise.all(userInformation);
  return resolvedUsers.filter(Boolean) as User[];
};

export const createFolder = async (folder: Folder) => {
  try {
    const response = await db.insert(folders).values(folder);
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: `Error: ${error}` };
  }
};

export const createFile = async (file: File) => {
  try {
    const response = await db.insert(files).values(file);
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: `Error: ${error}` };
  }
};

export const updateWorkspace = async (
  workspace: Partial<Workspace>,
  workspaceId: string
) => {
  if (!workspaceId) return { data: null, error: null };
  try {
    await db
      .update(workspaces)
      .set(workspace)
      .where(eq(workspaces.id, workspaceId));
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: `Error: ${error}` };
  }
};

export const updateFolder = async (
  folder: Partial<Folder>,
  folderId: string
) => {
  if (!folderId) return { data: null, error: null };
  try {
    await db.update(folders).set(folder).where(eq(folders.id, folderId));
    return { data: null, error: null };
  } catch (error) {
    console.log("Error", error);
    return { data: null, error: `Error ${error}` };
  }
};

export const updateFile = async (file: Partial<File>, fileId: string) => {
  if (!fileId) return { data: null, error: null };
  try {
    const response = await db
      .update(files)
      .set(file)
      .where(eq(files.id, fileId));
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: `Error: ${error}` };
  }
};

export const deleteFolder = async (folderId: string) => {
  const validId = validate(folderId);
  if (!folderId || !validId)
    return {
      data: null,
      error: "Error",
    };
  try {
    await db.delete(folders).where(eq(folders.id, folderId));
    return {
      data: null,
      error: null,
    };
  } catch (error) {
    console.log(error);
    return {
      data: null,
      error: `Error ${error}`,
    };
  }
};

export const deleteFile = async (fileId: string) => {
  const validId = validate(fileId);
  if (!fileId || !validId)
    return {
      data: null,
      error: "Error",
    };
  try {
    await db.delete(files).where(eq(files.id, fileId));
    return {
      data: null,
      error: null,
    };
  } catch (error) {
    console.log(error);
    return {
      data: null,
      error: `Error ${error}`,
    };
  }
};

export const getUsersFromSearch = async (email: string) => {
  if (!email) return [];
  const accounts = db
    .select()
    .from(users)
    .where(ilike(users.email, `${email}%`));
  return accounts;
};

export const getWorkspaceDetails = async (workspaceId: string) => {
  const isValid = validate(workspaceId);
  if (!isValid) {
    return {
      data: [],
      error: "Error: Workspace Id not valid",
    };
  }
  try {
    const workspace = (await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1)) as Workspace[];
    return { data: workspace, error: null };
  } catch (error) {
    console.log(error);
    return { data: [], error: `Error: ${error}` };
  }
};

export const getFolderDetails = async (folderId: string) => {
  const isValid = validate(folderId);
  if (!isValid) {
    return {
      data: [],
      error: "Error: Folder Id not valid",
    };
  }
  try {
    const folder = (await db
      .select()
      .from(folders)
      .where(eq(folders.id, folderId))
      .limit(1)) as Folder[];
    return { data: folder, error: null };
  } catch (error) {
    console.log(error);
    return { data: [], error: `Error: ${error}` };
  }
};

export const getFileDetails = async (fileId: string) => {
  const isValid = validate(fileId);
  if (!isValid) {
    return {
      data: [],
      error: "Error: File Id not valid",
    };
  }
  try {
    const file = (await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1)) as File[];
    return { data: file, error: null };
  } catch (error) {
    console.log(error);
    return { data: [], error: `Error: ${error}` };
  }
};

export const moveFolderToTrash = async (
  inTrashMsg: string,
  folderId: string
) => {
  const isValid = validate(folderId);
  if (!isValid) {
    return {
      data: null,
      error: "Error: Folder Id not valid",
    };
  }

  try {
    await db
      .update(folders)
      .set({ inTrash: inTrashMsg })
      .where(eq(folders.id, folderId));
    await db
      .update(files)
      .set({ inTrash: inTrashMsg })
      .where(eq(files.folderId, folderId));

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    console.log(error);
    return {
      data: null,
      error: "Error",
    };
  }
};

export const restoreFolder = async (folderId: string) => {
  const isValid = validate(folderId);
  if (!isValid) {
    return {
      data: [],
      error: "Error: Folder Id not valid",
    };
  }

  try {
    await db
      .update(folders)
      .set({ inTrash: null })
      .where(eq(folders.id, folderId));
    await db
      .update(files)
      .set({ inTrash: null })
      .where(eq(files.folderId, folderId));

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    console.log(error);
    return {
      data: null,
      error: "Error",
    };
  }
};
