import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { BlogEditor } from "./BlogEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string[] | null;
  author_id: string | null;
  is_active: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export const AdminBlogPage: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<Blog | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featuredImageUrl: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: [] as string[],
    isActive: true,
    publishedAt: "",
  });

  // Redirect if not admin
  React.useEffect(() => {
    if (!isAdmin && !isAdmin === false) {
      navigate("/");
    }
  }, [isAdmin, navigate]);

  // Fetch all blogs
  const { data: blogs, isLoading } = useQuery({
    queryKey: ["admin-blogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Blog[];
    },
    enabled: isAdmin === true,
  });

  // Create blog mutation
  const createBlogMutation = useMutation({
    mutationFn: async (blogData: any) => {
      const { data, error } = await supabase
        .from("blogs")
        .insert({
          ...blogData,
          author_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      setIsCreating(false);
      resetForm();
      toast({
        title: "Success",
        description: "Blog created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create blog",
        variant: "destructive",
      });
    },
  });

  // Update blog mutation
  const updateBlogMutation = useMutation({
    mutationFn: async ({ id, ...blogData }: any) => {
      const { data, error } = await supabase
        .from("blogs")
        .update({
          ...blogData,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      setEditingBlog(null);
      resetForm();
      toast({
        title: "Success",
        description: "Blog updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update blog",
        variant: "destructive",
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from("blogs")
        .update({ is_active: isActive })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      toast({
        title: "Success",
        description: "Blog status updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Delete blog mutation
  const deleteBlogMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blogs").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      setDeleteDialogOpen(false);
      setBlogToDelete(null);
      toast({
        title: "Success",
        description: "Blog deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete blog",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      featuredImageUrl: "",
      metaTitle: "",
      metaDescription: "",
      metaKeywords: [],
      isActive: true,
      publishedAt: "",
    });
  };

  const handleCreate = () => {
    setIsCreating(true);
    resetForm();
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt || "",
      content: blog.content,
      featuredImageUrl: blog.featured_image_url || "",
      metaTitle: blog.meta_title || "",
      metaDescription: blog.meta_description || "",
      metaKeywords: blog.meta_keywords || [],
      isActive: blog.is_active,
      publishedAt: blog.published_at
        ? format(new Date(blog.published_at), "yyyy-MM-dd'T'HH:mm")
        : "",
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingBlog(null);
    resetForm();
  };

  const handleSave = () => {
    if (!formData.title || !formData.slug || !formData.content) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Map form data to database schema (snake_case)
    const blogData = {
      title: formData.title,
      slug: formData.slug,
      excerpt: formData.excerpt || null,
      content: formData.content,
      featured_image_url: formData.featuredImageUrl || null,
      meta_title: formData.metaTitle || null,
      meta_description: formData.metaDescription || null,
      meta_keywords:
        formData.metaKeywords.length > 0 ? formData.metaKeywords : null,
      is_active: formData.isActive,
      published_at: formData.publishedAt || null,
    };

    if (editingBlog) {
      updateBlogMutation.mutate({ id: editingBlog.id, ...blogData });
    } else {
      createBlogMutation.mutate(blogData);
    }
  };

  const handleToggleActive = (blog: Blog) => {
    toggleActiveMutation.mutate({
      id: blog.id,
      isActive: !blog.is_active,
    });
  };

  const handleDeleteClick = (blog: Blog) => {
    setBlogToDelete(blog);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (blogToDelete) {
      deleteBlogMutation.mutate(blogToDelete.id);
    }
  };

  const handleViewPublic = (slug: string) => {
    window.open(`/blogs/${slug}`, "_blank");
  };

  if (!isAdmin) {
    return null;
  }

  if (isCreating || editingBlog) {
    return (
      <div className="container mx-auto py-4 md:py-8 px-4 md:px-6">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">
            {editingBlog ? "Edit Blog" : "Create New Blog"}
          </h1>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </div>

        <BlogEditor
          title={formData.title}
          slug={formData.slug}
          excerpt={formData.excerpt}
          content={formData.content}
          featuredImageUrl={formData.featuredImageUrl}
          metaTitle={formData.metaTitle}
          metaDescription={formData.metaDescription}
          metaKeywords={formData.metaKeywords}
          onTitleChange={(value) => setFormData({ ...formData, title: value })}
          onSlugChange={(value) => setFormData({ ...formData, slug: value })}
          onExcerptChange={(value) =>
            setFormData({ ...formData, excerpt: value })
          }
          onContentChange={(value) =>
            setFormData({ ...formData, content: value })
          }
          onFeaturedImageUrlChange={(value) =>
            setFormData({ ...formData, featuredImageUrl: value })
          }
          onMetaTitleChange={(value) =>
            setFormData({ ...formData, metaTitle: value })
          }
          onMetaDescriptionChange={(value) =>
            setFormData({ ...formData, metaDescription: value })
          }
          onMetaKeywordsChange={(keywords) =>
            setFormData({ ...formData, metaKeywords: keywords })
          }
        />

        <div className="mt-4 md:mt-6 space-y-4">
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-lg md:text-xl">
                Publishing Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="space-y-0.5">
                  <label className="text-sm md:text-base font-medium">
                    Active Status
                  </label>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Toggle to show/hide blog from public
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm md:text-base font-medium">
                  Published Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.publishedAt}
                  onChange={(e) =>
                    setFormData({ ...formData, publishedAt: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm md:text-base border rounded-md"
                />
                <div className="space-y-1">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    <strong>Required for public visibility:</strong> Set a date
                    to publish the blog. Leave empty to save as draft (won't
                    appear on public page).
                  </p>
                  {!formData.publishedAt && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      ⚠️ This blog will not appear on the public /blogs page
                      until a published date is set.
                    </p>
                  )}
                  {formData.publishedAt &&
                    new Date(formData.publishedAt) > new Date() && (
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        📅 This blog is scheduled for future publication.
                      </p>
                    )}
                  {formData.publishedAt &&
                    new Date(formData.publishedAt) <= new Date() &&
                    formData.isActive && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        ✅ This blog will appear on the public /blogs page
                        immediately.
                      </p>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              onClick={handleSave}
              disabled={
                createBlogMutation.isPending || updateBlogMutation.isPending
              }
              className="w-full sm:w-auto"
            >
              {editingBlog ? "Update Blog" : "Create Blog"}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 md:py-8 px-4 md:px-6">
      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Blog Management</h1>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create New Blog
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading blogs...
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="text-lg md:text-xl">All Blogs</CardTitle>
          </CardHeader>
          <CardContent>
            {blogs && blogs.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Title</TableHead>
                      <TableHead className="hidden md:table-cell min-w-[150px]">
                        Slug
                      </TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Published
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Created
                      </TableHead>
                      <TableHead className="text-right min-w-[180px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blogs.map((blog) => (
                      <TableRow key={blog.id}>
                        <TableCell className="font-medium">
                          <div
                            className="max-w-[200px] truncate"
                            title={blog.title}
                          >
                            {blog.title}
                          </div>
                          <div className="md:hidden text-xs text-muted-foreground mt-1">
                            {blog.slug}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          <div
                            className="max-w-[150px] truncate"
                            title={blog.slug}
                          >
                            {blog.slug}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant={blog.is_active ? "default" : "secondary"}
                              className="text-xs w-fit"
                            >
                              {blog.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {blog.is_active && !blog.published_at && (
                              <Badge
                                variant="outline"
                                className="text-xs w-fit"
                              >
                                Draft
                              </Badge>
                            )}
                            {blog.is_active &&
                              blog.published_at &&
                              new Date(blog.published_at) > new Date() && (
                                <Badge
                                  variant="outline"
                                  className="text-xs w-fit"
                                >
                                  Scheduled
                                </Badge>
                              )}
                            {blog.is_active &&
                              blog.published_at &&
                              new Date(blog.published_at) <= new Date() && (
                                <Badge
                                  variant="default"
                                  className="text-xs w-fit bg-green-600"
                                >
                                  Published
                                </Badge>
                              )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          {blog.published_at
                            ? format(
                                new Date(blog.published_at),
                                "MMM dd, yyyy"
                              )
                            : "Draft"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          {format(new Date(blog.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewPublic(blog.slug)}
                              title="View Public Page"
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(blog)}
                              title={
                                blog.is_active
                                  ? "Deactivate Blog"
                                  : "Activate Blog"
                              }
                              className="h-8 w-8 p-0"
                            >
                              {blog.is_active ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(blog)}
                              title="Edit Blog"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(blog)}
                              title="Delete Blog"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No blogs found. Create your first blog to get started.
                </p>
                <Button onClick={handleCreate} className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Blog
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Blog</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{blogToDelete?.title}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteBlogMutation.isPending}
            >
              {deleteBlogMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
