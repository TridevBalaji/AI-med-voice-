import type { UsersDetails } from "@/app/provider";
import { createContext } from "react";

export type UserContextValue = {
  userDetail: UsersDetails | undefined;
  setUserDetail: React.Dispatch<React.SetStateAction<UsersDetails | undefined>>;
};

export const Usersinfo = createContext<UserContextValue | undefined>(undefined);
