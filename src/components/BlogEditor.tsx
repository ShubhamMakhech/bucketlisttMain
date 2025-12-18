import React, { useRef, useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BlogEditorProps {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImageUrl: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  onTitleChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onExcerptChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onFeaturedImageUrlChange: (value: string) => void;
  onMetaTitleChange: (value: string) => void;
  onMetaDescriptionChange: (value: string) => void;
  onMetaKeywordsChange: (keywords: string[]) => void;
}

export const BlogEditor: React.FC<BlogEditorProps> = ({
  title,
  slug,
  excerpt,
  content,
  featuredImageUrl,
  metaTitle,
  metaDescription,
  metaKeywords,
  onTitleChange,
  onSlugChange,
  onExcerptChange,
  onContentChange,
  onFeaturedImageUrlChange,
  onMetaTitleChange,
  onMetaDescriptionChange,
  onMetaKeywordsChange,
}) => {
  const keywordInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(
    featuredImageUrl || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !slug) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      onSlugChange(generatedSlug);
    }
  }, [title, slug, onSlugChange]);

  // Auto-generate meta title from title if empty
  useEffect(() => {
    if (title && !metaTitle) {
      onMetaTitleChange(title);
    }
  }, [title, metaTitle, onMetaTitleChange]);

  // Update preview when featuredImageUrl changes externally
  useEffect(() => {
    setImagePreview(featuredImageUrl || null);
  }, [featuredImageUrl]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setIsUploading(true);

    try {
      // Upload to Supabase storage
      const fileExt = file.name.split(".").pop();
      const fileName = `blog-images/${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("blog-images").getPublicUrl(fileName);

      // Update the featured image URL
      onFeaturedImageUrlChange(publicUrl);

      // Clean up old preview URL
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description:
          error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      // Reset preview on error
      setImagePreview(featuredImageUrl || null);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    // Clean up preview URL if it's a blob URL
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    onFeaturedImageUrlChange("");
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !metaKeywords.includes(keywordInput.trim())) {
      onMetaKeywordsChange([...metaKeywords, keywordInput.trim()]);
      setKeywordInput("");
      keywordInputRef.current?.focus();
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    onMetaKeywordsChange(metaKeywords.filter((k) => k !== keyword));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ font: [] }],
      [{ size: [] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [
        { list: "ordered" },
        { list: "bullet" },
        { indent: "-1" },
        { indent: "+1" },
      ],
      ["link", "image", "video"],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ["clean"],
    ],
    clipboard: {
      matchVisual: false,
    },
  };

  const formats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "link",
    "image",
    "video",
    "color",
    "background",
    "align",
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Basic Information */}
      <Card className="w-full">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-lg md:text-xl">
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm md:text-base">
              Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Enter blog title"
              required
              className="w-full text-sm md:text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug" className="text-sm md:text-base">
              URL Slug *
            </Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              placeholder="blog-url-slug"
              required
              className="w-full text-sm md:text-base"
            />
            <p className="text-xs md:text-sm text-muted-foreground">
              Used in the URL: /blogs/{slug}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt" className="text-sm md:text-base">
              Excerpt
            </Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => onExcerptChange(e.target.value)}
              placeholder="Short description of the blog post"
              rows={3}
              className="w-full text-sm md:text-base resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="featured-image" className="text-sm md:text-base">
              Featured Image
            </Label>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="featured-image"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full sm:w-auto"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Image
                    </>
                  )}
                </Button>
                {imagePreview && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveImage}
                    disabled={isUploading}
                    className="w-full sm:w-auto text-destructive hover:text-destructive"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Featured preview"
                    className="w-full max-w-full md:max-w-md h-32 md:h-48 object-cover rounded-lg border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs md:text-sm text-muted-foreground">
                Upload an image (max 5MB). Supported formats: JPG, PNG, GIF,
                WebP
              </p>
              {/* Fallback: Allow manual URL entry */}
              <div className="pt-2 border-t">
                <Label
                  htmlFor="featured-image-url"
                  className="text-xs text-muted-foreground"
                >
                  Or enter image URL manually
                </Label>
                <Input
                  id="featured-image-url"
                  value={featuredImageUrl}
                  onChange={(e) => {
                    onFeaturedImageUrlChange(e.target.value);
                    setImagePreview(e.target.value || null);
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="w-full text-sm md:text-base mt-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Editor */}
      <Card className="w-full">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-lg md:text-xl">Content *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="blog-editor-wrapper">
              <ReactQuill
                theme="snow"
                value={content}
                onChange={onContentChange}
                modules={modules}
                formats={formats}
                placeholder="Write your blog content here..."
                className="blog-quill-editor"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card className="w-full">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-lg md:text-xl">SEO Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meta-title" className="text-sm md:text-base">
              Meta Title
            </Label>
            <Input
              id="meta-title"
              value={metaTitle}
              onChange={(e) => onMetaTitleChange(e.target.value)}
              placeholder="SEO title (defaults to blog title)"
              className="w-full text-sm md:text-base"
            />
            <p className="text-xs md:text-sm text-muted-foreground">
              {metaTitle.length}/60 characters (recommended: 50-60)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta-description" className="text-sm md:text-base">
              Meta Description
            </Label>
            <Textarea
              id="meta-description"
              value={metaDescription}
              onChange={(e) => onMetaDescriptionChange(e.target.value)}
              placeholder="SEO description"
              rows={3}
              className="w-full text-sm md:text-base resize-none"
            />
            <p className="text-xs md:text-sm text-muted-foreground">
              {metaDescription.length}/160 characters (recommended: 150-160)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta-keywords" className="text-sm md:text-base">
              Meta Keywords
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                ref={keywordInputRef}
                id="meta-keywords"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter keyword and press Enter"
                className="w-full text-sm md:text-base"
              />
              <Button
                type="button"
                onClick={handleAddKeyword}
                variant="outline"
                className="w-full sm:w-auto whitespace-nowrap"
              >
                Add
              </Button>
            </div>
            {metaKeywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {metaKeywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="flex items-center gap-1 text-xs md:text-sm"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <style>{`
        .blog-editor-wrapper {
          width: 100%;
        }
        .blog-quill-editor {
          min-height: 300px;
        }
        .blog-quill-editor .ql-editor {
          min-height: 300px;
          font-size: 14px;
        }
        @media (min-width: 768px) {
          .blog-quill-editor {
            min-height: 400px;
          }
          .blog-quill-editor .ql-editor {
            min-height: 400px;
            font-size: 16px;
          }
        }
        .blog-quill-editor .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
        }
        .blog-quill-editor .ql-container {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
        }
        @media (max-width: 768px) {
          .blog-quill-editor .ql-toolbar {
            padding: 8px;
          }
          .blog-quill-editor .ql-toolbar .ql-formats {
            margin-right: 4px;
          }
          .blog-quill-editor .ql-toolbar button {
            width: 24px;
            height: 24px;
            padding: 2px;
          }
        }
      `}</style>
    </div>
  );
};
