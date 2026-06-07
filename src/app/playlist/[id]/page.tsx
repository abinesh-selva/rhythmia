"use client";

import { useParams } from "next/navigation";
import { PlaylistView } from "@/components/views/PlaylistView";

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  return <PlaylistView playlistId={id} />;
}
