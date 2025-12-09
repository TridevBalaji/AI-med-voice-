"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Usersinfo } from "@/context/userdetailscontext";

export type UsersDetails={
    name:string,
    email:string,
    credits:number,
} 

function Provider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    const createNewUser = async () => {
      try {
       const res =await axios.post("/api/user");
       console.log(res);
      } catch (error) {
        console.error("Failed to create user", error);
      }
    };

    createNewUser();
  }, []);

  const [userDetail, setUserDetail] = useState<UsersDetails | undefined>(
    undefined
  );

  return (
    <Usersinfo.Provider value={{ userDetail, setUserDetail }}>
      {children}
    </Usersinfo.Provider>
  );
}

export default Provider;