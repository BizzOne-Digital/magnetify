import { AdminPageTitle } from "@/components/admin/AdminHeader";
import { MediaLibrary } from "@/components/admin/MediaLibrary";

export default function AdminMediaPage() {
  return (
    <>
      <AdminPageTitle title="Media Library" description="All images stored in MongoDB. Served from /api/uploads/…" />
      <MediaLibrary />
    </>
  );
}
