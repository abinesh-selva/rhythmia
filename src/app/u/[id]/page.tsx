"use client";

import { useParams } from "next/navigation";
import { UserProfileView } from "@/components/views/UserProfileView";

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  return <UserProfileView userId={id} />;
}
