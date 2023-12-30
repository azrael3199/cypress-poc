"use client";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";
import { User, Workspace } from "@/lib/supabase/supabase.types";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Lock, Plus, Share } from "lucide-react";
import { Button } from "../ui/button";
import { v4 } from "uuid";
import { addCollaborators, createWorkspace } from "@/lib/supabase/queries";
import CollaboratorSearch from "./collaborator-search";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const WorkspaceCreator = () => {
  const { user } = useSupabaseUser();
  const router = useRouter();
  const [permissions, setPermissions] = useState("private");
  const [title, setTitle] = useState("");
  const [collaborators, setCollaborators] = useState<User[]>([
    // {
    //   avatarUrl: "/avatars/7.png",
    //   billingAddress: { street: "123 Main St", city: "City1", zip: "12345" },
    //   email: "user1@example.com",
    //   fullName: "John Doe",
    //   id: "user1",
    //   paymentMethod: { card_type: "Visa", last_four_digits: "1234" },
    //   updatedAt: "2023-01-01T12:00:00Z",
    // },
    // {
    //   avatarUrl: "/avatars/7.png",
    //   billingAddress: { street: "456 Oak St", city: "City2", zip: "67890" },
    //   email: "user2@example.com",
    //   fullName: "Jane Smith",
    //   id: "user2",
    //   paymentMethod: { card_type: "MasterCard", last_four_digits: "5678" },
    //   updatedAt: "2023-01-02T15:30:00Z",
    // },
    // {
    //   avatarUrl: "/avatars/7.png",
    //   billingAddress: { street: "789 Pine St", city: "City3", zip: "54321" },
    //   email: "user3@example.com",
    //   fullName: "Alice Johnson",
    //   id: "user3",
    //   paymentMethod: {
    //     card_type: "American Express",
    //     last_four_digits: "9876",
    //   },
    //   updatedAt: "2023-01-03T08:45:00Z",
    // },
    // {
    //   avatarUrl: "/avatars/7.png",
    //   billingAddress: { street: "101 Elm St", city: "City4", zip: "98765" },
    //   email: "user4@example.com",
    //   fullName: "Bob Williams",
    //   id: "user4",
    //   paymentMethod: { card_type: "Discover", last_four_digits: "4321" },
    //   updatedAt: "2023-01-04T17:20:00Z",
    // },
    // {
    //   avatarUrl: "/avatars/7.png",
    //   billingAddress: { street: "222 Oak St", city: "City5", zip: "54321" },
    //   email: "user5@example.com",
    //   fullName: "Eva Martinez",
    //   id: "user5",
    //   paymentMethod: { card_type: "Visa", last_four_digits: "7890" },
    //   updatedAt: "2023-01-05T14:10:00Z",
    // },
    // {
    //   avatarUrl: "/avatars/7.png",
    //   billingAddress: { street: "333 Pine St", city: "City6", zip: "98765" },
    //   email: "user6@example.com",
    //   fullName: "Charlie Brown",
    //   id: "user6",
    //   paymentMethod: { card_type: "MasterCard", last_four_digits: "1230" },
    //   updatedAt: "2023-01-06T11:30:00Z",
    // },
    // {
    //   avatarUrl: "/avatars/7.png",
    //   billingAddress: { street: "444 Elm St", city: "City7", zip: "13579" },
    //   email: "user7@example.com",
    //   fullName: "Grace Miller",
    //   id: "user7",
    //   paymentMethod: { card_type: "Amex", last_four_digits: "4567" },
    //   updatedAt: "2023-01-07T09:15:00Z",
    // },
    // {
    //   avatarUrl: "/avatars/7.png",
    //   billingAddress: { street: "555 Maple St", city: "City8", zip: "24680" },
    //   email: "user8@example.com",
    //   fullName: "David Wilson",
    //   id: "user8",
    //   paymentMethod: { card_type: "Discover", last_four_digits: "7890" },
    //   updatedAt: "2023-01-08T13:45:00Z",
    // },
    // {
    //   avatarUrl: "/avatars/7.png",
    //   billingAddress: { street: "666 Birch St", city: "City9", zip: "97531" },
    //   email: "user9@example.com",
    //   fullName: "Olivia Davis",
    //   id: "user9",
    //   paymentMethod: { card_type: "Visa", last_four_digits: "0123" },
    //   updatedAt: "2023-01-09T18:00:00Z",
    // },
    // {
    //   avatarUrl: "/avatars/7.png",
    //   billingAddress: { street: "777 Cedar St", city: "City10", zip: "86420" },
    //   email: "user10@example.com",
    //   fullName: "Samuel Brown",
    //   id: "user10",
    //   paymentMethod: { card_type: "MasterCard", last_four_digits: "3456" },
    //   updatedAt: "2023-01-10T22:30:00Z",
    // },
    // {
    //   avatarUrl: "/avatars/7.png",
    //   billingAddress: { street: "888 Pine St", city: "City11", zip: "75309" },
    //   email: "user11@example.com",
    //   fullName: "Ava Taylor",
    //   id: "user11",
    //   paymentMethod: {
    //     card_type: "American Express",
    //     last_four_digits: "6789",
    //   },
    //   updatedAt: "2023-01-11T10:05:00Z",
    // },
    // {
    //   avatarUrl: "/avatars/7.png",
    //   billingAddress: { street: "999 Elm St", city: "City12", zip: "24680" },
    //   email: "user12@example.com",
    //   fullName: "Jack Johnson",
    //   id: "user12",
    //   paymentMethod: { card_type: "Visa", last_four_digits: "9012" },
    //   updatedAt: "2023-01-12T15:20:00Z",
    // },
    // {
    //   avatarUrl: "/avatars/7.png",
    //   billingAddress: { street: "111 Oak St", city: "City13", zip: "13579" },
    //   email: "user13@example.com",
    //   fullName: "Sophia Adams",
    //   id: "user13",
    //   paymentMethod: { card_type: "MasterCard", last_four_digits: "2345" },
    //   updatedAt: "2023-01-13T18:45:00Z",
    // },
    // {
    //   avatarUrl: "/avatars/7.png",
    //   billingAddress: { street: "222 Pine St", city: "City14", zip: "97531" },
    //   email: "user14@example.com",
    //   fullName: "Nathan Wilson",
    //   id: "user14",
    //   paymentMethod: { card_type: "Discover", last_four_digits: "6789" },
    //   updatedAt: "2023-01-14T12:10:00Z",
    // },
  ]);

  const addCollaborator = (user: User) => {
    setCollaborators([...collaborators, user]);
  };

  const removeCollaborator = (user: User) => {
    setCollaborators(collaborators.filter((c) => c.id !== user.id));
  };

  const createItem = async () => {
    const uuid = v4();
    if (user?.id) {
      const newWorkspace: Workspace = {
        data: null,
        createdAt: new Date().toISOString(),
        iconId: "💼",
        id: uuid,
        inTrash: "",
        title,
        workspaceOwner: user.id,
        logo: null,
        bannerUrl: "",
      };

      if (permissions === "private") {
        await createWorkspace(newWorkspace);
        router.refresh();
      }

      if (permissions === "shared") {
        await createWorkspace(newWorkspace);
        await addCollaborators(collaborators, uuid);
        router.refresh();
      }
    }
  };

  return (
    <div className="flex gap-4 flex-col">
      <div>
        <Label htmlFor="name" className="text-sm text-muted-foreground">
          Name
        </Label>
        <div className="flex justify-center items-center gap-2">
          <Input
            name="name"
            value={title}
            placeholder="Workspace Name"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
      </div>
      <>
        <Label htmlFor="permissions" className="text-sm text-muted-foreground">
          Permissions
        </Label>
        <Select
          onValueChange={(val) => {
            setPermissions(val);
          }}
          defaultValue={permissions}
        >
          <SelectTrigger className="w-full h-26 -mt-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="private">
                <div className="p-2 flex gap-4 justify-center items-center">
                  <Lock />
                  <article className="text-left flex flex-col">
                    <span>Private</span>
                    <p>
                      Your workspace is private to you. You can choose to share
                      it later.
                    </p>
                  </article>
                </div>
              </SelectItem>
              <SelectItem value="shared">
                <div className="p-2 flex gap-4 justify-center items-center">
                  <Share />
                  <article className="text-left flex flex-col">
                    <span>Shared</span>
                    <p>You can invite collaborators</p>
                  </article>
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </>
      {permissions === "shared" && (
        <div>
          <CollaboratorSearch
            existingCollaborators={collaborators}
            getCollaborator={(user) => {
              addCollaborator(user);
            }}
          >
            <Button type="button" className="text-sm mt-4">
              <Plus />
              Add Collaborators
            </Button>
          </CollaboratorSearch>
          <div className="mt-4">
            <span className="text-sm text-muted-foreground">
              Collaborators {collaborators.length || ""}
            </span>
            <ScrollArea className="h-[120px] overflow-y-scroll w-full rounded-md border border-muted-foreground/20">
              {collaborators.length ? (
                collaborators.map((c) => (
                  <div
                    className="p-4 flex justify-between items-center"
                    key={c.id}
                  >
                    <div className="flex gap-4 items-center w-full">
                      <Avatar className="w-9 h-9 flex-none">
                        <AvatarImage src="/avatars/7.png"></AvatarImage>
                        <AvatarFallback>CG</AvatarFallback>
                      </Avatar>
                      <div className="text-sm gap-2 text-muted-foreground overflow-hidden overflow-ellipsis grow">
                        {c.email}
                      </div>
                      <Button
                        className="flex-none"
                        variant="secondary"
                        onClick={() => removeCollaborator(c)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="absolute right-0 left-0 top-0 bottom-0 flex justify-center items-center">
                  <span className="text-muted-foreground text-sm">
                    You have no collaborators
                  </span>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      )}
      <Button
        type="button"
        disabled={
          !title || (permissions === "shared" && collaborators.length === 0)
        }
        variant="secondary"
        onClick={createItem}
      >
        Create
      </Button>
    </div>
  );
};

export default WorkspaceCreator;
