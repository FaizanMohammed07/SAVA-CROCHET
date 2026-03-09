import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Search, ShieldBan, ShieldCheck } from "lucide-react";
import { useAdminUsers, useBlockUser } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/types";

const AdminUsers = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const { data, isLoading } = useAdminUsers({ page });
  const users = (data?.data as User[]) || [];
  const pagination = data?.pagination;

  const blockUser = useBlockUser();

  const handleToggleBlock = async (userId: string) => {
    try {
      await blockUser.mutateAsync(userId);
      toast({ title: "User status updated" });
    } catch {
      toast({ title: "Error updating user", variant: "destructive" });
    }
  };

  const filtered = search
    ? users.filter(
        (u) =>
          u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase()),
      )
    : users;

  return (
    <div className="space-y-6">
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-display text-3xl text-foreground"
      >
        Users
      </motion.h1>

      <div className="relative max-w-md">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-xl font-body"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-warm-brown" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground font-body text-center py-10">
          No users found
        </p>
      ) : (
        <>
          <div className="overflow-x-auto bg-card rounded-2xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-xs font-body font-medium text-muted-foreground">
                    User
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-body font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-body font-medium text-muted-foreground">
                    Phone
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-body font-medium text-muted-foreground">
                    Joined
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-body font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-body font-medium text-sage">
                            {user.firstName?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-body font-medium">
                          {user.fullName ||
                            `${user.firstName} ${user.lastName}`}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-body text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="py-3 px-4 text-sm font-body text-muted-foreground">
                      {user.phone || "—"}
                    </td>
                    <td className="py-3 px-4 text-sm font-body text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleBlock(user._id)}
                        className={`rounded-lg text-xs font-body ${user.isBlocked ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"}`}
                      >
                        {user.isBlocked ? (
                          <>
                            <ShieldCheck size={14} className="mr-1" /> Unblock
                          </>
                        ) : (
                          <>
                            <ShieldBan size={14} className="mr-1" /> Block
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg font-body text-sm"
              >
                Previous
              </Button>
              <span className="text-sm font-body text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage(page + 1)}
                className="rounded-lg font-body text-sm"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminUsers;
