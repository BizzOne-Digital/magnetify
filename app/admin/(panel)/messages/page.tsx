import { safeDb } from "@/lib/db";
import { ContactMessage } from "@/models";
import { AdminPageTitle } from "@/components/admin/AdminHeader";
import { MessagesList } from "@/components/admin/MessagesList";

export default async function AdminMessagesPage() {
  const messages = await safeDb(() => ContactMessage.find().sort({ createdAt: -1 }).limit(500).lean(), []);
  return (
    <>
      <AdminPageTitle title="Contact Messages" description="Messages submitted through the contact form." />
      <MessagesList initial={JSON.parse(JSON.stringify(messages))} />
    </>
  );
}
